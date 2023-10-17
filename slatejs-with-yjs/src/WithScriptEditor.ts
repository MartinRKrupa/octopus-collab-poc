import { BaseEditor, Editor, createEditor, InsertNodeOperation, Node, NodeOperation, Operation, TextOperation, Transforms, Range, Descendant, Path } from "slate";
import { ReactEditor } from "slate-react";
import { SlateTextWrapperParagraph } from "./types/SlateScript";

export function withScriptEditor(editor: BaseEditor & ReactEditor) {

    const { isVoid, isInline, normalizeNode} = editor;

    editor.isVoid = (element) => {
        const voidElems = ['tag','note'];
        if (voidElems.indexOf(element.type) > -1) {
            console.log (element.type + "IS Void");
            return true;
        }
        return isVoid(element);
    }

    editor.isInline = (element) => {
        const inlineElems = ['tag','note','textElement'];
        if (inlineElems.indexOf(element.type) > -1) {
            console.log (element.type + "IS INLINE");
            return true;
        }
        return isInline(element);
    }

    editor.normalizeNode = (entry) =>{
        const node = entry[0] as unknown as SlateTextWrapperParagraph;
        const path = entry[1];
        const elemIndex = path[0]
        const paragraphIndex = path[1]        
        
        if (node.type && node.type == "textElement"){            
            if (node.children.length > 1) {
                let firstNodeFormattingAttrs = Object.keys(node.children[0]);
                console.log ("FORMATING ATTRS ", node.children[0], firstNodeFormattingAttrs);
                let autoNormalization = true;
                node.children.forEach((checkNode)=>{
                    if (autoNormalization && Object.keys(checkNode).length != firstNodeFormattingAttrs.length) {
                        console.debug ("One of the text nodes has a different number of properties, will have to renormalize");
                        autoNormalization = false;
                    }                    
                    else {
                        firstNodeFormattingAttrs.forEach((attr)=>{
                            if (autoNormalization && checkNode[attr] == null) {
                                autoNormalization = false;
                                console.debug ("NODE DOESNT CONTAIN ATTR ", node, attr);
                            }     
                        });    
                    }
                }); 

                if (!autoNormalization){
                    node.children.forEach((nodeToFix, textIndex)=>{
                        const movedPath = [elemIndex, paragraphIndex + textIndex + 1, 0]; 
                        const insertPath = [elemIndex, paragraphIndex + textIndex];                     
                        const newNode = {type:"textElement", children: []};
                        editor.insertNode(newNode as Node, {at:insertPath});                    
                        editor.moveNodes({at:movedPath, to:[...insertPath,0]})
                    });
                    editor.removeNodes({at:[elemIndex, paragraphIndex + node.children.length]});
                    console.debug ("WARNING, CHILDREN OF THE NODE MUST HAVE BEEN RENORMALIZED!!");    
                    return;
                }
            }
        }
        normalizeNode(entry);
    }

    return editor;
}