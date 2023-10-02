import * as React from "react";
import * as Y from 'yjs';

import { useState, useMemo, useCallback, useEffect } from "react";
import { BaseEditor, Editor, createEditor, InsertNodeOperation, Node, NodeOperation, Operation, TextOperation, Transforms, Range, Descendant } from "slate";
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

export const ScriptEditor: React.FC<Props> = () => {

    // Create a yjs document and get the shared type
    const sharedType = useMemo(() => {
        const yDoc = new Y.Doc();
        const sharedType = yDoc.get("content", Y.XmlText) as Y.XmlText;        
        
        //NOTE: Initialze the doc from the same source and so, upcoming changes will have a shared starting tracking point.. otherwise the initial merge can be a mess and also applyUpdate(event) will not work ...
        const update = Y.encodeStateAsUpdate(initialYDoc);
        Y.applyUpdate(sharedType.doc, update);
        // Load the initial value into the yjs document
        console.log("SHARED TYPE:" + sharedType.toJSON());
        console.log("Client ID is: " + yDoc.clientID);

        /**
         * NOTE: THIS IS TO BE IMPLEMENTED IN REMOTE JAVA CLIENT. IT HAS TO OBSERVE AND AND PROPERLY APPLY CHANGES.
        */
        sharedType.observeDeep((event, transaction) => {
            console.log("OBSERVING Document change - EVENT/TRANSACTION:", event, transaction);
            if (!transaction.local) {
                //NOTE: ATTEMPT TO READ OPS HERE - i.e. when transaction is REMOTE (see below) ENDS UP IN NOT MERGING A DOC PROPERLY ... 
                console.log("REMOTE TRANSACTION OBSERVED")
            }
            else {
                let ops = translateYjsEvent(sharedType, editor, event[0]);
                console.log("LOCAL TRANSACTION OBSERVED");
                console.log("OPERATIONS extracted from the document observation in client :" + yDoc.clientID, ops);
            }
        });


        yDoc.on("update", (updateEvent) => {
            emitter.emit(yDoc.clientID.toString(), updateEvent);
        });

        return sharedType
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
    const emitter: Emitter<Record<EventType, unknown>> = useMemo(() => {
        console.log("Initiating Emitter for " + sharedType.doc.clientID);
        mit.on("*", (clientId, updateEvent: Uint8Array) => {
            console.log("Incomming Event. I am " + sharedType.doc.clientID.toString() + ", event is coming from " + clientId.toString());
            if (clientId !== sharedType.doc.clientID.toString()) {
                console.log("Caught incoming event from client ID " + clientId.toString() + " with following update event: ", updateEvent, "Update will now be applied");
                Y.applyUpdate(sharedType.doc, updateEvent);
            }
            else console.log ("Ignoring my own event");
        });

        return mit
    }, []
    );

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
                return ScriptRenderers.renderTag(leaf);
            case 'text':
                return ScriptRenderers.renderText(leaf, children, attributes);
        }
    }, []);

    //Keys listener. Mainly stops <Enter> from creating a new paragraph resulting in Legacy Octopus behavior. Also listens for hotkeys.
    const slateKeyDownEvent = (event: React.KeyboardEvent) => {
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
            }
            else {
                console.log("Key pressed on selection:" + event.key + "FROM: " + JSON.stringify(location.anchor.path) + ", offset: " + location.anchor.offset + " TO: " + JSON.stringify(location.focus.path) + ", offset: " + location.focus.offset);
            }
        }
    };

    //Adding a new Sript Element into slate's doc - for testing purposes.
    const onNewElementButtonClick = () => {
        const op: InsertNodeOperation = {
            type: 'insert_node',
            path: [0],
            node: getSlateTestStudioElement()
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