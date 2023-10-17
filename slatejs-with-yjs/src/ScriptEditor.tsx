import * as React from "react";
import * as Y from 'yjs';

import { useState, useMemo, useCallback, useEffect } from "react";
import { BaseEditor, Editor, createEditor, InsertNodeOperation, Node, NodeOperation, Operation, TextOperation, Transforms, Range, Descendant, Path, NodeEntry } from "slate";
import { isHotkey } from 'is-hotkey';
import { Editable, ReactEditor, Slate, withReact } from "slate-react";
import "./styles.css";
import { OctopusScript } from "./types/OctopusScript";
import { getTestScript, getSlateTestStudioElement } from "./data/TestScript";
import { CustomElement, CustomText, SlateTextWrapperParagraph, SlateScript, SlateTextParagraph } from "./types/SlateScript";
import * as ScriptRenderers from "./ScriptRenderers";
import * as OctopusScriptMapper from "./mappers/OctopusScriptMapper";
import * as SlateScriptMapper from "./mappers/SlateScriptMapper";
import { withYjs, slateNodesToInsertDelta, YjsEditor } from '@slate-yjs/core';
import { ASClient } from "./utils/activeSync";
import { Transaction } from "yjs";
import { arrayToUint8Array, uint8ArrayToArray } from "./utils/Uint8ArrayUtils";
import { shouldPlusButtonShow, togglePlusButton } from "./plusButtonHandler"
import * as yOps from "./utils/yjsScriptOperations"
import { withScriptEditor } from "./WithScriptEditor";


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

//Legacy script
let sharedOctopusScript = getTestScript();
//Slate script
let sharedSlateScript = SlateScriptMapper.mapOctopusScriptToSlateScript(sharedOctopusScript);
//Slate script to insert Delats for YJS;
console.log(sharedSlateScript);
const initialInsertDeltas = slateNodesToInsertDelta(sharedSlateScript);
console.log("Initial insert deltas are:", initialInsertDeltas);

//YJS CRDT
const initialYDoc = new Y.Doc()
//Correct data type fo SlateJS is XMLText
const initialSharedDoc = initialYDoc.get("content", Y.XmlText) as Y.XmlText;
// Load the initial value into the yjs document
initialSharedDoc.applyDelta(initialInsertDeltas);
interface Props { }

//NOTE: This story ID MUST EXIST in the backend, otherwise the solution does not work ...
//OLD STRUCT
//const storyId = 3107327319;
//NEW STRUCT
const storyId = 3104137812

export const ScriptEditor: React.FC<Props> = () => {

    const plusRef = React.useRef();
    const labelRef = React.useRef();

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
        sharedType.observeDeep((event, transaction) => {
            console.log("OBSERVING Document change - EVENT/TRANSACTION:", event, transaction);

            const e = event[0] as Y.YEvent<any>;
            const target = e.target as Y.XmlText;

            console.log("PATH", e.path);
            console.log("TRANSACTIOn", e.transaction);
            console.log("KEYS", e.keys);
            console.log("CURRENT TARGET", e.currentTarget);
            console.log("TARGET", target);
            console.log("TARGET DOM", target.toDOM());
            console.log("CHANGES", e.changes);
            console.log("DELTA", e.changes.delta);
            console.log("TRANSACTION T", transaction);
            console.log("Change details");
            console.log(e.changes.keys);
            console.log(e.changes.added);
            console.log(e.changes.deleted);
            console.log(e.changes.delta);
            console.log("XML Doc");
            console.log(sharedType);
            if (e.path.length == 1){
                console.log ("The change must be decoded is on the lower levels");
                e.changes.delta.forEach((delta, idx) =>{
                    if (delta.insert) {
                        const ins = delta.insert as any;
                        console.log ("Delta number " + idx + ' attributes are ', ins.getAttributes());
                        console.log ("Delta number " + idx + ' content is ', ins.toDelta());
                    }
                });
            }

            if (!transaction.local) {
                console.log("REMOTE TRANSACTION OBSERVED");
            }
            else {
                console.log("LOCAL TRANSACTION OBSERVED");
            }
        });

        yDoc.on("update", (update: Uint8Array, origin: any, doc: Y.Doc, tr: Transaction) => {
            console.log("UPDATE EVENT, following are the update / origin / doc / transaction", update, origin, doc, tr);
            console.log("DECODED INCOMING CHANGE", Y.decodeUpdate(update));

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
                            const update = arrayToUint8Array(asRow.state);

                            Y.applyUpdate(sharedType.doc, update);
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
                    let remoteChangeFound = false;

                    //NOTE:Search in added structs
                    decodedUpdate.structs.forEach((struct, idx) => {
                        if (struct.id.client != sharedType.doc.clientID) {
                            console.log("One of the updates [" + idx + "] was perfromed by remote client " + struct.id.client + ".I am " + sharedType.doc.clientID + " Applying")
                            if (remoteChangeFound == false) remoteChangeFound = true;
                        }
                    });

                    //NOTE: Also search in DeleteSet 
                    decodedUpdate.ds.clients.forEach((value, key) => {
                        if (key != sharedType.doc.clientID) {
                            console.log("One of the dss [" + key + "] was perfromed by remote client " + key + ".I am " + sharedType.doc.clientID + " Applying")
                            if (remoteChangeFound == false) remoteChangeFound = true;
                        }
                    });
                    console.log("remoteChangeFound", remoteChangeFound)
                    if (remoteChangeFound) {
                        console.log("Change will now apply");
                        Y.applyUpdate(sharedType.doc, update);
                    }
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
        const slateJSWithYJSEditor: BaseEditor & ReactEditor = withYjs(withScriptEditor(withReact(createEditor())), sharedType);
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
            default:
                return null;
        }
    }, []);

    //Paragraph renderer callbacks
    const renderParagraph = useCallback(({ attributes, children, leaf }) => {
        switch (leaf.type) {
            case 'tag':
                return ScriptRenderers.renderTag(leaf, children, attributes);
            case 'text':
                return ScriptRenderers.renderText(leaf, children, attributes);
            case 'note':
                return ScriptRenderers.renderNote(leaf, children, attributes);
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

    //Adding a new Sript Element into slate's doc - for testing purposes.
    const onNewElementButtonClick = () => {
        const op: InsertNodeOperation = {
            type: 'insert_node',
            path: [0],
            node: getSlateTestStudioElement(editor.children.length)
        };
        editor.apply(op);
    };

    //Renaming a first Script Element as a rename on slate's doc - for testing purposes. 
    const onRenameButtonClick = () => {
        Transforms.setNodes(editor, {
            label: "TEST"
        }
            , {
                at: [0]
            });
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
        yOps.addElement(sharedType, { elid: 99, type: "STUDIO", label: "YJS STUDIO", content: [{ pid: "1", type: "text", text: "Studio Text" }] }, 0);
    };

    const renameElement = () => {
        yOps.setElementAttribute(sharedType, 0, "label", "NEW NAME");
    };

    const formatItalic = () => {
        yOps.formatRange(sharedType, 0, 0, 0, 3, { italic: true });
    };

    //Editor component
    return (
        <div>
            <div ref={plusRef} style={{ display: "none", position: "absolute", left: "0", top: "0", width: "25px", height: "25px", backgroundColor: "green" }}>+</div>
            <div ref={labelRef}>...label goes here</div>
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
            <div>SlateJS doc manipulation</div>
            <button onClick={onNewElementButtonClick}>
                Add a new Element
            </button>

            <button onClick={onRenameButtonClick}>
                Rename first Elem to TEST
            </button>
            <div>
                <div>Direct YJS doc manipulation</div>
                <button onClick={addCharacter}>
                    Add X on 3rd position of the 1st element nd 1st paragraph
                </button>
                <button onClick={deleteCharacter}>
                    Remove a char on 3rd position of the 1st paragraph in 1st element
                </button>
                <button onClick={formatItalic}>
                    Format first three chars in first paragraph italic
                </button>
                <button onClick={addStudioElement}>
                    Add Studio Element @ 1st pos
                </button>
                <button onClick={deleteElement}>
                    Delete First Element
                </button>
                <button onClick={deleteParagraph}>
                    Delete Second paragraph in 1st element
                </button>
                <button onClick={renameElement}>
                    Rename First Element
                </button>
            </div>
        </div>
    )
}