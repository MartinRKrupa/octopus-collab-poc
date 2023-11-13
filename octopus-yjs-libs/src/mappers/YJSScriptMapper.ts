import { SlateParagraph, SlateScript, SlateScriptElement} from "../types/SlateScript";
import * as Y from 'yjs';

/**
 * Recursive function mapping SlateJS Document into YJS XMLText. Either calls itself for inserting lower level pieces of the script (Elements -> Paragraphs) or inserts a text node into textElement paragraph.
 * @param slateScriptPiece - maps SlateScriptElement or SlateScriptParagraph 
 * @returns Y.XMLText for inserting as delta.
 */
export function mapObjectToXMLText(slateScriptPiece: SlateScriptElement | SlateParagraph): Y.XmlText {
    let xmlText = new Y.XmlText();
        Object.getOwnPropertyNames(slateScriptPiece).forEach((attr) => {
            if (attr != "children" && attr != "text")
                xmlText.setAttribute(attr, slateScriptPiece[attr]);                
            else {
                if (attr == "children") {
                    const childArray = slateScriptPiece[attr] as Array<SlateScriptElement | SlateParagraph>;
                    if (childArray && childArray.length > 0) {
                        childArray.reverse().forEach((child) => {                            
                            if (child['text'] && child['text'] != null){
                                let childAttrObj = {};
                                Object.getOwnPropertyNames(child ).forEach((childAttr)=> {
                                    if(childAttr != 'text') childAttrObj[childAttr] = child[childAttr]}
                                    );
                                xmlText.insert(0,child['text'], childAttrObj);
                            } else                        
                            xmlText.applyDelta([{ insert: mapObjectToXMLText(child)}]);
                        })
                    }
                }
            }
        });    
    return xmlText;
}

/**
 * Maps SlateScript into insert deltas - see https://docs.yjs.dev/api/delta-format. Insert deltas are objects that must be used to fill the shared YJS typewith content. 
 * @param slateScript 
 * @returns insert deltas
 */

export function mapSlateScriptToInsertDeltas(slateScript: SlateScript): object[] {
    let deltas: any[] = []
    slateScript.reverse().forEach((element) => {
        deltas.push({ insert: mapObjectToXMLText(element) })
    });
    return deltas;
}