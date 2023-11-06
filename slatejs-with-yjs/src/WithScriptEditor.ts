import { BaseEditor, Editor, createEditor, InsertNodeOperation, Node, NodeOperation, Operation, TextOperation, Transforms, Range, Descendant, Path, NodeEntry } from "slate";
import { ReactEditor } from "slate-react";
import { SlateScriptElement, SlateTextParagraph, SlateTextWrapperParagraph } from "./types/SlateScript";
import { text } from "stream/consumers";

export function withOctopusNormalizedEditor(editor: BaseEditor & ReactEditor) {

    const { isVoid, isInline, normalizeNode } = editor;

    editor.isVoid = (element) => {
        const voidElems = ['tag', 'note', 'cg','mos','pres'];
        if (voidElems.indexOf(element.type) > -1) {
            return true;
        }
        return isVoid(element);
    }

    
    editor.isInline = (element) => {
        const inlineElems = ['tag', 'note', 'textElement','cg','mos','pres'];
        if (inlineElems.indexOf(element.type) > -1) {
            return true;
        }
        return isInline(element);
    }
    
    /**
     * Overrides default normalization to fit rules for Octopus script., i.e.:
     * - When normalizing the whole element (path has only one level), then consecutive text paragraphs with the same formatting attributes are merged into the first Node having these attributes, deleting the rest
     * - When normalizing a text paragraph (Element, not the leaf - i.e path has 2 levels), its content is checked for multiple text leaves. When fonud, they're split into     separate paragraph Elements.
     * @param entry - a NodeEntry of a node being normalized [Node, Path] 
     * @returns 
     */

    editor.normalizeNode = (entry) => {
        const rawNode = entry[0];
        const path = entry[1];
        const elemIndex = path[0]

        //NOTE: Normalizing element's nodes - merging 
        if (path.length == 1) {
            console.log("NORMALIZING ELEMENT to MERGE consecutive paragraphs");
     
            const node = rawNode as SlateScriptElement;
            if (node.children && node.children.length > 0) {

                let distinctAttrNodeIndex: number = null;
                let distinctAttrs: Map<string, Object> = new Map();
                let childNodeIndicesMergeFromToMap: Map<number, number> = new Map();

                for (let i = 0; i < node.children.length; i++) {

                    const paragraphElementNode = node.children[i] as SlateTextWrapperParagraph ;

                    if (paragraphElementNode.type == "textElement" && paragraphElementNode.children.length == 1 && paragraphElementNode.children[0].type == "text") {
                        const paragraphTextNode = paragraphElementNode.children[0];
                        let nodesMatch = true;

                        if (distinctAttrNodeIndex != null) {
                            console.log("Comparing nodes", paragraphTextNode, distinctAttrs)

                            if ((Object.keys(paragraphTextNode).length - 1) != distinctAttrs.size || distinctAttrs.size == 0) {
                                nodesMatch = false;
                                console.log("LENGTHS DONT MATCH, WILL NOT RENORMALIZE ");
                            }
                            else {
                                Object.keys(paragraphTextNode).forEach((key) => {
                                    if (key != "text" && nodesMatch && (!distinctAttrs.has(key) || distinctAttrs.get(key) != paragraphTextNode[key])) {
                                        nodesMatch = false;
                                        console.log("KEY " + key + " DOESNT MATCH, WILL NOT RENORMALIZE ");
                                    }
                                });
                            }

                            if (nodesMatch == true) {
                                console.log("NODES TO PROPERLY NORMALIZE MUST BE COPIED FROM " + i + " TO " + distinctAttrNodeIndex);
                                childNodeIndicesMergeFromToMap.set(i, distinctAttrNodeIndex);
                            }
                        }

                        if (distinctAttrNodeIndex == null || !nodesMatch) {
                            distinctAttrNodeIndex = i;
                            distinctAttrs.clear();
                            Object.keys(paragraphTextNode).forEach((key) => {
                                if (key != "text") distinctAttrs.set(key, paragraphTextNode[key]);
                            });
                        }
                    }
                }
                if (childNodeIndicesMergeFromToMap.size > 0){
                    console.log ("SOME NODES MUST BE MOVED TO BE PROPERLY NORMALIZED. From->To map:", childNodeIndicesMergeFromToMap);
                    let previousTo = null;
                    let insertPosition = null;
                    childNodeIndicesMergeFromToMap.forEach((to, from)=>{
                        if (to != previousTo) {
                            previousTo = to;
                            insertPosition = 0;
                        } 
                        insertPosition ++;
                        editor.moveNodes({ at: [elemIndex, from, 0], to: [elemIndex, to, insertPosition]});
                    });
                    
                    
                    let fromsToRemove = Array.from(childNodeIndicesMergeFromToMap.keys());
                    childNodeIndicesMergeFromToMap.forEach((to, from) =>{
                        if (from > (to + 1)){
                            let emptyTextNodesCheckCount = from - to;
                            for (let i = 1 ; i < emptyTextNodesCheckCount; i++){
                                if (!fromsToRemove.includes(to + i)) fromsToRemove.push(to + i);
                            }
                        }
                    });
                    //NODE: Nodes must be removed from the end to the beginning to not mess up indices.
                    fromsToRemove.sort((a:number, b:number)=>{
                        return a > b ? 1 : a == b ? 0 : -1;
                    }).reverse();
                    
                    fromsToRemove.forEach((paragraphIndex) => {
                        Transforms.removeNodes(editor,{ at: [elemIndex, paragraphIndex]});
                    })
                    //NOTE: don't know why, but when the original normalization goes on, an error is thrown ... 
                    return;                    
                }
            }

        }
        else {
            const node = rawNode as unknown as SlateTextWrapperParagraph;
            const paragraphIndex = path[1];
            if (node.type && node.type == "textElement") {
                /**
                 * NOTE: When slate creates multiple nodes within one text "Paragraph" and if the nodes vary in their attributes, we want to split it into multiple paragraphs. 
                 * If the attributes are the same, it's no issue, default normalizer joins them into one leaf.
                */
                if (node.children.length > 1) {
                    console.log("NORMALIZING PARAGRAPH TO SPLIT IT INTO consecutive paragraphs");
                    let firstNodeFormattingAttrs = Object.keys(node.children[0]);
                    console.log("FIRST NODE's FORMATING ATTRS", node.children[0], firstNodeFormattingAttrs);
                    let assumeAutoNormalization = true;
                    node.children.forEach((checkNode) => {
                        if (assumeAutoNormalization && Object.keys(checkNode).length != firstNodeFormattingAttrs.length) {
                            console.debug("One of the text nodes has a different number of properties, will have to renormalize");
                            assumeAutoNormalization = false;
                        }
                        else {
                            firstNodeFormattingAttrs.forEach((attr) => {
                                if (assumeAutoNormalization && checkNode[attr] == null) {
                                    assumeAutoNormalization = false;
                                    console.debug("NODE DOESNT CONTAIN ATTR ", node, attr);
                                }
                            });
                        }
                    });

                    if (!assumeAutoNormalization) {
                        let newNodeIndex = 0;
                        node.children.forEach((nodeToFix, textIndex) => {
                            //Even node is an empty text - to fit Slate's normalization rules ordering an inline element to always be surrounded by an empty text leaf.
                            if (newNodeIndex % 2 == 0){
                                const insertPath = [elemIndex, paragraphIndex + newNodeIndex];
                                Transforms.insertNodes(editor, {text:""} as Node, {at: insertPath});
                            }
                            //Odd node is a newly created element
                            else {
                                const movedPath = [elemIndex, paragraphIndex + newNodeIndex + 1, 0];
                                const insertPath = [elemIndex, paragraphIndex + newNodeIndex];
                                const newNode = { type: "textElement", children: [] };
                                editor.insertNode(newNode as Node, { at: insertPath });
                                editor.moveNodes({ at: movedPath, to: [...insertPath, 0] })    
                            }                        
                            newNodeIndex++;
                        });
                        console.debug("WARNING, CHILDREN OF THE NODE MUST HAVE BEEN RENORMALIZED!!");
                    }
                }
            }
        }
        normalizeNode(entry);
    }

    return editor;
}