import * as React from "react";
import * as Y from 'yjs';

import { useState, useMemo, useCallback, useEffect } from "react";
import { BaseEditor, Editor, createEditor, InsertNodeOperation, Node, NodeOperation, Operation, TextOperation, Transforms, Range, Descendant, Path } from "slate";
import { isHotkey } from 'is-hotkey';
import { Editable, ReactEditor, Slate, withReact } from "slate-react";
import "./styles.css";
import { OctopusScript } from "./types/OctopusScript";
import { getTestScript, getSlateTestStudioElement } from "./data/TestScript";
import { CustomElement, CustomText, SlateScript } from "./types/SlateScript";
import * as ScriptRenderers from "./ScriptRenderers";
import * as OctopusScriptMapper from "./mappers/OctopusScriptMapper";
import * as SlateScriptMapper from "./mappers/SlateScriptMapper";
import { withYjs, slateNodesToInsertDelta, YjsEditor, translateYjsEvent } from 'slate-yjs-mkr/core';
import mitt, { Emitter, EventType } from "mitt";
import * as awarenessProtocol from 'y-protocols/awareness.js'
import { ASClient } from "./utils/activeSync";
import { Transaction } from "yjs";
import { arrayToUint8Array, uint8ArrayToArray } from "./utils/Uint8ArrayUtils";
import { shouldPlusButtonShow, togglePlusButton } from "./plusButtonHandler"


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
    console.log(Editor.marks(editor));

    if (isActive) {
        Editor.removeMark(editor, format)
    } else {
        Editor.addMark(editor, format, true);
        Editor.addMark(editor, "pid", (Math.round(Math.random() * 10000)).toString());
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
const initialInsertDeltas = slateNodesToInsertDelta(sharedSlateScript);

//YJS CRDT
const initialYDoc = new Y.Doc()
//Correct data type fo SlateJS is XMLText
const initialSharedDoc = initialYDoc.get("content", Y.XmlText) as Y.XmlText;
// Load the initial value into the yjs document
initialSharedDoc.applyDelta(initialInsertDeltas);
interface Props { }

//SIMPLE Emitter to emit and listen to YJS Updates within the window ...
const mit = mitt();

//NOTE: This story ID MUST EXIST in the backend, otherwise the solution does not work ...
const storyId = 3107327319;

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

            if (!transaction.local) {
                //NOTE: ATTEMPT TO READ OPS HERE - i.e. when transaction is REMOTE (see below) ENDS UP IN NOT MERGING A DOC PROPERLY ... 
                console.log("REMOTE TRANSACTION OBSERVED");
                //const targetElement = Node.get(editor, e.path as Path);
                //console.log(translateYTextEvent(sharedType, sharedOctopusScript, e as Y.YTextEvent, e.path as number[]));

            }
            else {
                //NOTE - this is a stolen method from slate-yjs, probably not want to use it to read the transactions ...
                let ops = translateYjsEvent(sharedType, editor, event[0]);
                console.log("LOCAL TRANSACTION OBSERVED");
                console.log("OPERATIONS extracted from the document observation in client :" + yDoc.clientID, ops);
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
        /*
        yDoc.on("update", (updateEvent) => {
            //NOTE OFF, to suport ActiveSync.
        });
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
                            const update = arrayToUint8Array(asRow.state);

                            Y.applyUpdate(sharedType.doc, update);

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
        const slateJSWithYJSEditor: BaseEditor & ReactEditor = withYjs(withReact(createEditor()), sharedType);

        //NOTE: Editors change listener - just for logging, to see how changes flow
        /*
        const { onChange } = slateJSWithYJSEditor;
        slateJSWithYJSEditor.onChange = (change) => {
            console.log("CATCHING EDITOR CHANGE", change);
            if (change != null) {
                console.log("CHANGE IN PROGRESS. CHANGE ", change);
            }
            onChange(change);
        }
        */

        return slateJSWithYJSEditor;
    });

    //SlateJS'doc value. Initially empty. It is automatically filled from YJS CRDT Doc. 
    const [value, setValue] = useState<Node[]>([]);

    //NOTE: Listening to "remote" (i.e other editors') changes emmited as YJS Updates and applying them as YJS Updates
    /*NOTE: TURNED OFF TO SUPPORT ACTIVESync
    
    const emitter: Emitter<Record<EventType, unknown>> = useMemo(() => {
        console.log("Initiating Emitter for " + sharedType.doc.clientID);
        mit.on("*", (clientId, updateEvent: Uint8Array) => {
            console.log("Incomming Event. I am " + sharedType.doc.clientID.toString() + ", event is coming from " + clientId.toString());
            if (clientId !== sharedType.doc.clientID.toString()) {
                console.log("Caught incoming event from client ID " + clientId.toString() + " with following update event: ", updateEvent, "Update will now be applied");
                Y.applyUpdate(sharedType.doc, updateEvent);
            }
            else console.log("Ignoring my own event");
        });
    
        return mit
    }, []
    );*/

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
        let selectedTextOffset = htmlSelection.anchorOffset;        
        let selectedNode = selectedText.parentElement;

        //NOTE: This allows input into special editable HTML nodes without slate noticing ... can be useful ...  
        if(selectedNode.classList.contains("slate-ignored")){
            console.log("THIS INPUT SHOULD BE COMPLETELY IGNORED BY SLATE");
            const fromText = selectedText.textContent.substring(0, selectedTextOffset);
            const toText = selectedText.textContent.substring(selectedTextOffset, selectedText.textContent.length);
            if(event.key.length == 1){
                selectedText.textContent = fromText + event.key + toText;
                htmlSelection.setPosition(selectedText, selectedTextOffset + 1);
            } 
            if(event.key == "Enter"){
                selectedText.textContent = fromText + "\n" + toText;
                htmlSelection.setPosition(selectedText, selectedTextOffset + 1);
            } 

            if(event.key == "Delete"){
                selectedText.textContent = fromText + toText.substring(1);
                htmlSelection.setPosition(selectedText, selectedTextOffset);
            } 
            
            if(event.key == "Backspace"){
                selectedText.textContent = fromText.substring(0,fromText.length-1) + toText;
                htmlSelection.setPosition(selectedText, selectedTextOffset - 1);
            } 

            event.preventDefault();    

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
            <button onClick={onNewElementButtonClick}>
                Add a new Element
            </button>

            <button onClick={onRenameButtonClick}>
                Rename first Elem to TEST
            </button>
        </div>
    )
}