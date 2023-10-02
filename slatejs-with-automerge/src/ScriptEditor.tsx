import * as React from "react";
import * as Automerge from '@automerge/automerge';
import { useState, useMemo, useCallback, useEffect} from "react";
import { Editor, BaseEditor, createEditor, InsertNodeOperation, Node, NodeOperation, Operation, TextOperation, Transforms, Range, Descendant } from "slate";
import { isHotkey } from 'is-hotkey';
import { Editable, ReactEditor, Slate, withReact } from "slate-react";
import "./styles.css";
import { OctopusScript } from "./types/OctopusScript";
import { getTestScript, getSlateTestStudioElement } from "./data/TestScript";
import { CustomElement, CustomText, SlateScript } from "./types/SlateScript";
import * as ScriptRenderers from "./ScriptRenderers";
import * as OctopusScriptMapper from "./mappers/OctopusScriptMapper";
import * as SlateScriptMapper from "./mappers/SlateScriptMapper";
import { AutomergeScript } from "./SharedScript";
import { withOperationsCatcher } from "./withOperationCatcher";
import { AutomergeChangelog } from "./SharedChangeLog";
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
const toggleMark = (editor: Editor & ReactEditor, format: string) => {
    const isActive = isMarkActive(editor, format)
    console.log(Editor.marks(editor));

    if (isActive) {
        Editor.removeMark(editor, format)
    } else {
        Editor.addMark(editor, format, true);
        Editor.addMark(editor, "pid", (Math.round(Math.random() * 10000)).toString());
    }
}

const isMarkActive = (editor: ReactEditor, format: string) => {
    const marks = Editor.marks(editor)
    return marks ? marks[format] === true : false
}

let scriptInitiated = false;
let sharedOctopusScript = null;
let sharedChangeLog: AutomergeChangelog = null;

const emitter: Emitter<Record<EventType, unknown>> = mitt();
let remote: Boolean = null; 

interface Props { }

export const ScriptEditor: React.FC<Props> = () => {
        
    const [sharedChangeLog, setSharedChangeLog] = useState<AutomergeChangelog>(() => {if (!scriptInitiated) return new AutomergeChangelog()});

    if (!scriptInitiated) {
        sharedOctopusScript = getTestScript();
    }
    
    useEffect(()=>{
        scriptInitiated = true;
        console.log ("Activationg emitter LISTENING for " + sharedChangeLog.getActorId());
        emitter.on('*', (type, e) => {
            if (type != sharedChangeLog.getActorId()){
                console.log("FOREIGN EVENT FROM " + type.toString() + " WILL BE PROCESSED BY EMITTER" + sharedChangeLog.getActorId(), e);
                sharedChangeLog.mergeChanges(e);
                let uprocessedOps = sharedChangeLog.getUnprocessedOperations();
                
                for (var i = 0 ; i < uprocessedOps.length; i++){
                    if (uprocessedOps[i].type != "set_selection") {
                        //editor.apply(uprocessedOps[i]);
                    }
                }
            }        
        });
    },[]);

    const [value, setValue] = useState<Node[]>(SlateScriptMapper.mapOctopusScriptToSlateScript(sharedOctopusScript));

    const editor = useMemo(() => withReact(withOperationsCatcher(createEditor(), sharedChangeLog, emitter)), []);

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
        console.log(editor.children);
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
            <Slate editor={editor} initialValue={value as Descendant[]} onChange={(newValue) => {
                console.log(newValue);
                setValue(newValue);
                
                const slateScript = newValue as SlateScript;
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