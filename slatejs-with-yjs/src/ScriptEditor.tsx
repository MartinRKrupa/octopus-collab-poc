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
import { withYjs, slateNodesToInsertDelta, YjsEditor, translateYjsEvent} from 'slate-yjs-mkr/core';
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

const emitter: Emitter<Record<EventType, unknown>> = mitt();

let sharedOctopusScript = getTestScript();
let sharedSlateScript = SlateScriptMapper.mapOctopusScriptToSlateScript(sharedOctopusScript)

interface Props { }

export const ScriptEditor: React.FC<Props> = () => {
    
    // Create a yjs document and get the shared type
    const sharedType = useMemo(() => {
        const yDoc = new Y.Doc()
        const sharedType = yDoc.get("content", Y.XmlText) as Y.XmlText;
        // Load the initial value into the yjs document
        sharedType.applyDelta(slateNodesToInsertDelta(sharedSlateScript));
        console.log("SHARED TYPE:" + sharedType.toJSON());
        console.log("Client ID is: " + yDoc.clientID);

        sharedType.observeDeep((event, transaction) => {
            console.log("OBSERVING Document change - EVENT/TRANSACTION:", event, transaction);
            let ops = translateYjsEvent(sharedType, editor, event[0]);
            console.log("OPERATIONS extracted from the document observation:", ops);
        });

        return sharedType
    }, []);

    const editor = useMemo(() => withYjs(withReact(createEditor()), sharedType), []);
    const [value, setValue] = useState<Node[]>([]);

    useEffect(() => {
        console.log("EFFFECT");
        YjsEditor.connect(editor);
        return () => YjsEditor.disconnect(editor);
    }, [editor]);

    const renderElement = useCallback(({ attributes, children, element }) => {
        switch (element.type) {
            case 'STUDIO':
                return (ScriptRenderers.renderStudio(element, children));
            default:
                return null;
        }
    }, []);

    const renderParagraph = useCallback(({ attributes, children, leaf }) => {
        switch (leaf.type) {
            case 'tag':
                return ScriptRenderers.renderTag(leaf);
            case 'text':
                return ScriptRenderers.renderText(leaf, children, attributes);
        }
    }, []);

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

    const onNewElementButtonClick = () => {
        const op: InsertNodeOperation = {
            type: 'insert_node',
            path: [0],
            node: getSlateTestStudioElement()
        };
        editor.apply(op);
    };

    const onRenameButtonClick = () => {
        Transforms.setNodes(editor, {
            label: "TEST"
        }
            , {
                at: [0]
            });
    };

    return (
        <div>
            <Slate editor={editor} initialValue={value as Descendant[]} onChange={newValue => {
                setValue(newValue);
                const slateScript = newValue as SlateScript;
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