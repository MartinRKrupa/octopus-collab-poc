import { change } from '@automerge/automerge';
import * as Y from 'yjs';

interface ScriptChangeStep {
    type: "keep" | "insert" | "delete" | "set",
    size?: number,
    attributes?: Object,
    text?: string,
    deeperChange?: ScriptChange
}

export interface ScriptChange {
    elementIndex?: number,
    paragraphIndex?: number,
    steps: ScriptChangeStep[];
}

export class YJsScriptChangeListener {

    private script: Y.XmlText = null;
    private onChangeCallback: (changes: ScriptChange[]) => void;

    private decodeChangedKey(elementIndex, paragraphIndex, target, key:string, value: {action:'add'|'update'|'delete',oldValue:any}): ScriptChange {
        const curTarget = target as Y.XmlText;
        console.log("DECODING KEYS CHANGE ON ", curTarget.toDelta(), curTarget.getAttributes());
        let scriptChange = {elementIndex:elementIndex, paragraphIndex:paragraphIndex, steps:[]}
        
        if (value.action == 'add' || value.action == 'update'){
            const attrs = new Object();
            attrs[key] = curTarget.getAttribute(key)
            scriptChange.steps.push({type: "set", attributes: attrs})
        }
        //NOTE: delete
        else {
            const attrs = new Object();
            attrs[key] = null;
            scriptChange.steps.push({type: "set", attributes: attrs})
        }

        return scriptChange;
    }

    private decodeDelta(elementIndex, paragraphIndex, target, delta: Array<{ insert?: Array<any> | string, delete?: number, retain?: number, attributes?: Object }>, currentChangeStream: ScriptChange): ScriptChange {

        let curIndex = 0;
        console.log("Decoding delta at ", delta);
        const traverseElements = elementIndex == null;
        const traverseParagraphs = elementIndex != null && paragraphIndex == null;

        if (!currentChangeStream) {
            currentChangeStream = {
                steps: [],
                elementIndex: elementIndex,
                paragraphIndex: paragraphIndex
            };
        }

        delta.forEach((delta, idx) => {
            if (traverseElements) elementIndex = idx;
            else if (traverseParagraphs) paragraphIndex = idx;

            if (delta.retain) {
                currentChangeStream.steps[idx] = {
                    type: "keep",
                    size: delta.retain
                }

                /*let curAsDeltas = target.toDelta();
                console.log("Must calculate what to retain,", curAsDeltas);
                if (curAsDeltas.length > 0) {
                    curAsDeltas.forEach((curDelta, idx) => {
                        if (curDelta.insert && curDelta.insert.toDelta) {
                            console.log("CUR Delta readble " + idx + "is:", curDelta.insert.toDelta());
                        }
                        else console.log("CUR Delta readble " + idx + "is:", curDelta.insert);
                    });
                }*/
            }
            if (delta.insert) {
                curIndex += 1;
                const ins = delta.insert as any;
                const insertAsDelta = ins.toDelta ? ins.toDelta() : null;
                const insAttributes = ins.getAttributes ? ins.getAttributes() : delta.attributes ? delta.attributes : null;

                //console.log("Delta number " + idx + ' attributes are ', insAttributes);
                //console.log("Delta number " + idx + ' content is ', insertAsDelta);

                currentChangeStream.steps[idx] = {
                    type: "insert",
                    attributes: insAttributes
                }

                if (typeof ins == "string") {
                    currentChangeStream.steps[idx].text = ins;
                }
                else {
                    if (insertAsDelta && insertAsDelta.length > 0) {
                        currentChangeStream.steps[idx].deeperChange = { elementIndex: elementIndex, paragraphIndex: paragraphIndex, steps: [] };
                        this.decodeDelta(elementIndex, paragraphIndex, target, insertAsDelta, currentChangeStream.steps[idx].deeperChange);
                    }
                }
            }

            if (delta.delete) {
                currentChangeStream.steps[idx] = {
                    type: "delete",
                    size: delta.delete
                }
            }

        });
        return currentChangeStream;
    }
    /**
     * 
     * @param script - is  Y.XMLText shared type
     * @param changeCallback - is callback function which will be called when a change is observed on a document. It must expect an array of ScriptChange[] as its parameter. 
     */
    
    constructor(script: Y.XmlText, changeCallback: (changes: ScriptChange[]) => void) {
        this.script = script;
        this.onChangeCallback = changeCallback;

        this.script.observeDeep((events: Y.YEvent<Y.XmlText>[], transaction) => {
            console.log("OBSERVING Document change - EVENT/TRANSACTION:", events, transaction);
            console.log("EVENT Count:", events.length);
            const changeList: ScriptChange[] = [];

            events.forEach((e) => {

                const target = e.target as Y.XmlText;

                console.log("PATH", e.path);
                /*
                console.log("TRANSACTIOn", e.transaction);
                console.log("KEYS", e.keys);
                console.log("CURRENT TARGET", e.currentTarget);
                console.log("TARGET", target);
                console.log("TARGET DOM", target.toDOM());
                console.log("CHANGES", e.changes);
                if (e.changes && e.changes.keys) {
                    e.changes.keys.forEach((value, key: string) => {
                        console.log("Cur value of " + key + " is " + target.getAttribute(key));
                    });
                }
                console.log("DELTA", e.changes.delta);
                console.log("TRANSACTION T", transaction);
                console.log("Change details");
                console.log(e.changes.keys);
                console.log(e.changes.added);
                console.log(e.changes.deleted);
                console.log(e.changes.delta);
                */
                const elementIndex = e.path[0];
                const paragraphIndex = e.path[1];
                if (e.changes.delta && e.changes.delta.length > 0){
                    changeList.push(this.decodeDelta(elementIndex, paragraphIndex, target, e.changes.delta, null));
                }

                if (e.changes.keys && e.changes.keys.size > 0){
                    e.changes.keys.forEach((value:{action:'add'|'update'|'delete',oldValue:any}, key:string)=>{
                        changeList.push(this.decodeChangedKey(elementIndex, paragraphIndex, target, key, value));
                    });
                }
                /*
                if (transaction.changed && transaction.changed.size > 1) {
                    const change = Array.from(transaction.changed.keys())[0] as any;
                    const changeDelta = change.toDelta();
                    const curChageAsInsert = YJsScriptChangeListener.decodeDelta(elementIndex, paragraphIndex, target, changeDelta, null);
                    if (curChageAsInsert && curChageAsInsert.steps.length > 0) {
                        curChageAsInsert.steps.forEach((step) => {
                            step.type = "set";
                        });
                        changeStream.steps.push(...curChageAsInsert.steps);
                    }
                }
                console.log("FINAL CHANGE STREAM ", changeStream);
                */
            });
            if (!transaction.local) {
                console.log("REMOTE TRANSACTION OBSERVED");
            }
            else {
                console.log("LOCAL TRANSACTION OBSERVED");
            }
            this.onChangeCallback(changeList)
        });
    }
}