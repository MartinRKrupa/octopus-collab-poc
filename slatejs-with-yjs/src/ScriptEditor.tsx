import * as React from "react";
import * as Y from 'yjs';

import { useState, useMemo, useCallback, useEffect } from "react";
import { BaseEditor, Editor, createEditor, Node, Range, Descendant } from "slate";
import { isHotkey } from 'is-hotkey';
import { Editable, ReactEditor, Slate, withReact } from "slate-react";
import "./styles.css";
import * as OS from "octopus-yjs-libs/src/types/OctopusScript";
import { getTestScript } from "octopus-yjs-libs/src/data/TestScript";
import { CustomElement, CustomText, SlateScript } from "octopus-yjs-libs/src/types/SlateScript";
import * as ScriptRenderers from "./ScriptRenderers";
import * as OctopusScriptMapper from "octopus-yjs-libs/src/mappers/OctopusScriptMapper";
import { withYjs, YjsEditor } from '@slate-yjs/core';
import { Transaction } from "yjs";
import { arrayToUint8Array, uint8ArrayToArray } from "octopus-yjs-libs/src/utils/Uint8ArrayUtils";
import { shouldPlusButtonShow, togglePlusButton } from "./plusButtonHandler"
import * as yOps from "octopus-yjs-libs/src/api/YJsScriptOperations"
import { withOctopusNormalizedEditor } from "./WithScriptEditor";
import { ScriptChange, YJsScriptChangeListener } from  "octopus-yjs-libs/src/api/YJsScriptChangeListener";
import { ASClient } from "./utils/ActiveSync";

declare module 'slate' {
    interface CustomTypes {
        Editor: BaseEditor & ReactEditor
        Element: CustomElement
        Text: CustomText
    }
}

const HOTKEYS = {
    'mod+b': 'bold',
    'mod+i': 'italic',
    'mod+u': 'underline',
    'mod+`': 'code',
}

const toggleMark = (editor: Editor, format: string) => {
    const isActive = isMarkActive(editor, format)
    console.log("Active marks at cursor", Editor.marks(editor));

    if (isActive) {
        Editor.removeMark(editor, format)
    } else {
        let node = editor.node(editor.selection);
        Editor.addMark(editor, format, true);
        console.log("CUR NODE", node);
    }
}

const isMarkActive = (editor: Editor, format: string) => {
    const marks = Editor.marks(editor)
    return marks ? marks[format] === true : false
}

//YJS CRDT
const initialYDoc = new Y.Doc()
const initialSharedDoc = initialYDoc.get("content", Y.XmlText) as Y.XmlText;
const mockOctopusScript = getTestScript();
yOps.initializeSharedTypeFromOctopusScript(initialSharedDoc, mockOctopusScript);

interface Props { }

//NOTE: This story ID MUST EXIST in the backend, otherwise the AS does not provide Data ...
const storyId = 3115279239;

export const ScriptEditor: React.FC<Props> = () => {

    const plusRef = React.useRef();
    const labelRef = React.useRef();
    const logRef = React.useRef();


    const yDoc = useMemo(() => {
        const yDoc = new Y.Doc();
        return yDoc;
    }, []);

    /* TBD: AWARENESS
    const awareness = useMemo(()=>{
        const awareDoc = new awarenessProtocol.Awareness(yDoc);
        awareDoc.on('update', (clients, transactionOrigin) => {
            console.log ("AWARENESS UPDATE clients / transactionOrigin ", clients, transactionOrigin);       
            console.log(awareDoc.getStates());
        });

        awareDoc.on('change', (clients, transactionOrigin) => {
            console.log ("AWARENESS CHANGE clients / transactionOrigin ", clients, transactionOrigin);            
        });

        return awareDoc;

    },[]);
    */

    // Create a yjs document and get the shared type    
    const sharedType = useMemo(() => {
        const sharedType = yDoc.get("content", Y.XmlText) as Y.XmlText;
        //NOTE: Initialze the doc from the same source and so, upcoming changes will have a shared starting tracking point.. otherwise the initial merge can be a mess and also applyUpdate(event) will not work ...
        //With ACTIVESYNC - this is disabled. the shared state is retrieved by all clients in ASInitMessage - see below
        //const update = Y.encodeStateAsUpdate(initialYDoc);
        //Y.applyUpdate(sharedType.doc, update);
        //Load the initial value into the yjs document
        console.log("SHARED TYPE:" + sharedType.toJSON());
        console.log("Client ID is: " + yDoc.clientID);

        /**
         * NOTE: THIS IS TO BE IMPLEMENTED IN REMOTE JAVA CLIENT. IT HAS TO OBSERVE AND AND PROPERLY APPLY CHANGES.
        */
        const sharedTypeCallbackFn = (changes: ScriptChange[]) => {
            console.log("Y JS SCRIPT CHANGES:", changes);
            const logElem: HTMLDivElement = logRef.current;
            logElem.innerText = "CHANGES START: \n " + JSON.stringify(changes, null, 4) + "\n-------------\n" + logElem.innerText;
        }
        const scriptChangeListener = new YJsScriptChangeListener(sharedType, sharedTypeCallbackFn);

        yDoc.on("update", (update: Uint8Array, origin: any, doc: Y.Doc, tr: Transaction) => {
            console.log("UPDATE EVENT, following are the update / origin / doc / transaction", update, origin, doc, tr);
            const decodedUpdate = Y.decodeUpdate(update);
            console.log("DECODED INCOMING CHANGE", decodedUpdate);

            if (tr.local) {
                const changeReqBody = { "change": uint8ArrayToArray(update) };
                asClient.runApiHTTPRequest("POST", "Story/" + storyId + "/applyYjsChange", JSON.stringify(changeReqBody), (response) => {
                    console.log("Apply Change response is " + response);
                });
            }
            else {
                console.log("REMOTE transaction - will not be re-sent to AS")
            }
        });
        /**
         * End of what needs to be implemented in Java
         */

        return sharedType;
    }, []);

    const asClient = useMemo(() => {
        const client = new ASClient();
        console.log("PARSING PARAMS", JSON.parse("{\"params\":{\"entityId\":" + storyId + ",\"entityType\":\"STORY\"}}"));

        const handleASMessage = (asMessage) => {
            console.log("Retrieving AS Message by client " + client.getClientId());

            if (asMessage && asMessage.type && ((asMessage.rows && asMessage.rows[0] && asMessage.rows[0].props) || (asMessage.row && asMessage.row.props))) {

                const asRow = asMessage.rows ? asMessage.rows[0].props : asMessage.row.props;
                console.log("Retrieved AsRow is:", asRow);

                //AS Messages handling
                if (asMessage.type == "ASInitMsg") {
                    const labelElem: HTMLDivElement = labelRef.current;
                    labelElem.innerHTML = "<strong>YJS ClientID:</strong>" + sharedType.doc.clientID + ", <strong>AS client ID:</strong>" + client.getClientId();

                    if (!asRow.state) {
                        console.log("Initial state not found, initializing from dummy data ");
                        let requestBody = { "state": uint8ArrayToArray(Y.encodeStateAsUpdate(initialSharedDoc.doc)) };

                        client.runApiHTTPRequest("POST", "Story/" + storyId + "/setYjsState", JSON.stringify(requestBody), (response) => {
                            console.log("Set State response is " + response);
                        });
                    }
                    else {
                        if (sharedType.toJSON() == "") {
                            console.log("Inital state found. Initializing doc from the remote");
                            yOps.updateSharedTypeFromAS(sharedType, asRow.state);
                            editor.normalize();
                        }
                        else {
                            console.log("Document already initialized, skipping state initialization from remote");
                        }
                    }
                }
                if (asMessage.type == "ASUpdateMsg" && asRow.change) {
                    const update = arrayToUint8Array(asRow.change);
                    const decodedUpdate = Y.decodeUpdate(update);
                    console.log("Encoded Change Retrieved by client " + client.getClientId() + ". It will now be applied to doc " + sharedType.doc.clientID);
                    console.log("Decoded update", decodedUpdate);
                    console.log("Change will now apply");
                    //NOTE - no need to worry to apply a change that might've been triggered by the ery same client. It will simply produce no change event ...  
                    yOps.updateSharedTypeFromAS(sharedType, asRow.change)
                }
            }
        }

        return client.start("test", "octopus", "Collab", "{\"params\":{\"entityId\":" + storyId + ",\"entityType\":\"STORY\"}}", handleASMessage);

    }, []);

    useEffect(() => {
        const handleUnload = () => {
            asClient.disconnect(null);
            // Perform actions before the component unloads
        };
        window.addEventListener('unload', handleUnload);
        return () => {
            window.removeEventListener('unload', handleUnload);
        };
    }, []);


    //NOTE: Editor initialization
    const [editor, setEditor] = useState(() => {
        const slateJSWithYJSEditor: BaseEditor & ReactEditor & YjsEditor = withYjs(withOctopusNormalizedEditor(withReact(createEditor())), sharedType);
        return slateJSWithYJSEditor;
    });

    //SlateJS'doc value. Initially empty. It is automatically filled from YJS CRDT Doc. 
    const [value, setValue] = useState<Node[]>([]);

    //Link YJS to SlateJS
    useEffect(() => {
        YjsEditor.connect(editor);
        return () => YjsEditor.disconnect(editor);
    }, [editor]);


    //Element renderer callbacks
    const renderElement = useCallback(({ attributes, children, element }) => {
        switch (element.type) {
            case 'STUDIO':
                return (ScriptRenderers.renderStudio(element, children));
            case 'tag':
                return (ScriptRenderers.renderTag(element, children, attributes));
            case 'textElement':
                return (ScriptRenderers.renderTextWrappingParagraph(element, children));
            case 'note':
                return ScriptRenderers.renderNote(element, children, attributes);
            case 'cg':
                return ScriptRenderers.renderCg(element, children, attributes);
            case 'mos':
                return ScriptRenderers.renderMos(element, children, attributes);
            case 'pres':
                return ScriptRenderers.renderPresenter(element, children, attributes);

            default:
                return null;
        }
    }, []);

    //Paragraph renderer callbacks
    const renderParagraph = useCallback(({ attributes, children, leaf }) => {
        switch (leaf.type) {
            case 'text':
                return ScriptRenderers.renderText(leaf, children, attributes);
        }
    }, []);

    //Keys listener. Mainly stops <Enter> from creating a new paragraph resulting in Legacy Octopus behavior. Also listens for hotkeys.
    const slateKeyDownEvent = (event: React.KeyboardEvent) => {

        let htmlSelection = window.getSelection();
        let selectedText = htmlSelection.anchorNode;
        if (selectedText) {
            let selectedTextOffset = htmlSelection.anchorOffset;
            let selectedNode = selectedText.parentElement;

            //NOTE: This allows input into special editable HTML nodes without slate noticing ... can be useful ...  
            if (selectedNode.classList.contains("slate-ignored")) {
                console.log("THIS INPUT SHOULD BE COMPLETELY IGNORED BY SLATE");
                const fromText = selectedText.textContent.substring(0, selectedTextOffset);
                const toText = selectedText.textContent.substring(selectedTextOffset, selectedText.textContent.length);
                if (event.key.length == 1) {
                    selectedText.textContent = fromText + event.key + toText;
                    htmlSelection.setPosition(selectedText, selectedTextOffset + 1);
                }
                if (event.key == "Enter") {
                    selectedText.textContent = fromText + "\n" + toText;
                    htmlSelection.setPosition(selectedText, selectedTextOffset + 1);
                }

                if (event.key == "Delete") {
                    selectedText.textContent = fromText + toText.substring(1);
                    htmlSelection.setPosition(selectedText, selectedTextOffset);
                }

                if (event.key == "Backspace") {
                    selectedText.textContent = fromText.substring(0, fromText.length - 1) + toText;
                    htmlSelection.setPosition(selectedText, selectedTextOffset - 1);
                }
                event.preventDefault();
            }
        }


        for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event as any)) {
                event.preventDefault()
                const hk = hotkey.toString();
                const mark = HOTKEYS[hk];
                toggleMark(editor, mark)
            }
        }


        if (event.keyCode === 13) {
            editor.insertText('\n');
            event.preventDefault();
        }
        let location: Range = editor.selection;
        if (location != null) {
            if (JSON.stringify(location.anchor.path) == JSON.stringify(location.focus.path) && location.anchor.offset == location.focus.offset) {
                console.log("Key pressed at cursor:" + event.key + JSON.stringify(location.anchor.path) + ", offset:" + location.anchor.offset);
                Range.edges(location)
            }
            else {
                console.log("Key pressed on selection:" + event.key + "FROM: " + JSON.stringify(location.anchor.path) + ", offset: " + location.anchor.offset + " TO: " + JSON.stringify(location.focus.path) + ", offset: " + location.focus.offset);
            }
        }
    };

    //Keys listener. Shows plus button in position
    const slateKeyUpEvent = (event: React.KeyboardEvent) => {
        const wordUnderCursor = shouldPlusButtonShow(editor, editor.selection);
        console.log("Should I show Plus button at the cursor ??", wordUnderCursor);
        togglePlusButton(wordUnderCursor, plusRef.current);
    };

    const addCharacter = () => {
        yOps.addCharacter(sharedType, 0, 0, "X", 3);
    };

    const deleteElement = () => {
        yOps.deleteElement(sharedType, 0);
    };

    const deleteCharacter = () => {
        yOps.deleteCharacter(sharedType, 0, 0, 3);
    };

    const deleteParagraph = () => {
        yOps.deleteParagraph(sharedType, 0, 1);
    };

    const addStudioElement = () => {
        yOps.addElement(sharedType, { elid: 99, type: OS.OctopusScriptElementType.STUDIO, label: "YJS STUDIO", content: [{ type: OS.OctopusScriptParagraphType.text, text: "Studio Text" }] }, 0);
    };

    const renameElement = () => {
        yOps.setElementAttributes(sharedType, 0, new Map([["label", "NEW NAME"]]));
    };

    const addCueIn = () => {
        yOps.setElementAttributes(sharedType, 0, new Map([["cuein", 1000]]));
    };

    const removeCueIn = () => {
        yOps.setElementAttributes(sharedType, 0, new Map([["cuein", null]]));
    };
    const colorTag = () => {
        const attrs = new Map;
        attrs.set("foreground", "#00FF00");
        attrs.set("background", "grey");

        yOps.setParagraphAttributes(sharedType, 0, 2, attrs);
    }

    const formatItalic = () => {
        yOps.formatRange(sharedType, 0, 0, 0, 3, { italic: true });
    };

    const addTagParagraph = () => {
        yOps.addParagraph(sharedType, 0, { type: "tag", text: " THIS IS A VERY NEW TAG ", foreground: "#0000FF", background: "yellow" }, 1)
    }

    //Editor component
    return (
        <div>
            <div ref={plusRef} style={{ display: "none", position: "absolute", left: "0", top: "0", width: "25px", height: "25px", backgroundColor: "green" }}>+</div>
            <div ref={labelRef}>...label goes here</div>
            <div style={{ display: "inline-block", width: "50%" }}>
                <Slate editor={editor} initialValue={value as Descendant[]} onChange={newValue => {
                    setValue(newValue);
                    const slateScript = newValue as SlateScript;
                    console.debug("Slate JS: ");
                    console.debug(slateScript);
                    console.debug("Octopus script's new value:");
                    console.debug(OctopusScriptMapper.mapSlateScriptToOctopusScript(slateScript));
                }}>
                    <Editable
                        renderElement={renderElement}
                        renderLeaf={renderParagraph}
                        placeholder="Enter some rich text…"
                        spellCheck
                        autoFocus
                        onKeyDown={slateKeyDownEvent}
                        onKeyUp={slateKeyUpEvent}
                    />
                </Slate>
                <div>
                    <div>&nbsp;</div>
                    <div>Direct YJS doc manipulation (VIA JS API)</div>
                    <div>ELEMENT</div>

                    <button onClick={addStudioElement}>
                        Add Studio Element @ 1st pos
                    </button>
                    <button onClick={deleteElement}>
                        Delete First Element
                    </button>
                    <button onClick={renameElement}>
                        Rename First Element to 'NEW NAME'
                    </button>
                    <button onClick={addCueIn}>
                        Add attribute to an element - cuein
                    </button>
                    <button onClick={removeCueIn}>
                        Remove attribute from an element - cuein
                    </button>
                    <div>PARAGRAPH</div>
                    <button onClick={addTagParagraph}>
                        Add tag paragraph @2nd pos in 1st element
                    </button>
                    <button onClick={deleteParagraph}>
                        Delete Second paragraph in 1st element
                    </button>
                    <button onClick={colorTag}>
                        Set attribute of a paragraph - Tag @3rd FG color
                    </button>
                    <div>TEXT</div>
                    <button onClick={formatItalic}>
                        Format first three chars in first paragraph italic
                    </button>
                    <button onClick={addCharacter}>
                        Add X on 3rd position of the 1st element nd 1st paragraph
                    </button>
                    <button onClick={deleteCharacter}>
                        Remove a char on 3rd position of the 1st paragraph in 1st element
                    </button>
                </div>
            </div>
            <div style={{ display: "inline-block", width: "45%", verticalAlign: "top", marginLeft: "10px", }}>
                <div>CHANGE LOG (with newest on top):</div>
                <div ref={logRef} style={{ whiteSpace: "pre", border: "1px solid black", height: "500px", overflowY: "scroll", }}></div>
            </div>
        </div>
    )
}