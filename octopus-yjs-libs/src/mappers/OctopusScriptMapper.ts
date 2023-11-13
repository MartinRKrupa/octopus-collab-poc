/**
 * Maps SlateScript Object to Octopus Script - loose mapping, not tied to low level types
 */
 
import {OctopusScript, OctopusScriptElement, OctopusScriptElementType, OctopusScriptParagraph} from "../types/OctopusScript";
import { SlateParagraph, SlateTextNode, SlateTextWrapperParagraph } from "../types/SlateScript";

function getProperParagraphToExtract(scriptParagaph: SlateParagraph): SlateParagraph | SlateTextNode{
    if (scriptParagaph.type == "textElement"){
        const textWrapperElement = scriptParagaph as SlateTextWrapperParagraph;
        if (textWrapperElement.children && textWrapperElement.children.length > 0) {
            return textWrapperElement.children[0];
        }
        else return null;
    } 
    else return scriptParagaph;
}

export function mapSlateElementToOctopusParagraph(scriptParagaph: SlateParagraph): OctopusScriptParagraph{
    
    //NOTE: There's no paragraph with null, unless its a Slate's empty text node.
    if (scriptParagaph.type == null) return null;
    
    let textAttributeMap = new Map ([["tagText", "text"],["noteText", "text"]]);
    let nodeToInsert: any = {};

    
    let slateParagraphToExtract = getProperParagraphToExtract(scriptParagaph);
    Object.getOwnPropertyNames(slateParagraphToExtract).forEach((attrName)=>{
        let useAttrName = textAttributeMap.has(attrName) ? textAttributeMap.get(attrName) : attrName;
        nodeToInsert[useAttrName] = slateParagraphToExtract[attrName];
    });

    return nodeToInsert;
}

export function mapSlateScriptToOctopusScript(slateScript: any): OctopusScript{
    let script:OctopusScript = {
        body: [] as OctopusScriptElement[],
        version: 1
    }

    slateScript.forEach((value:any, index: number) => {
        script.body[index] = {
            elid: value.elid,
            type:  value.type as OctopusScriptElementType,
            label:  value.label,
            content: []         
        };
        value.children.forEach( (slateParagraph: any, paragraphIndex) => {
            const paragraphToAdd =  mapSlateElementToOctopusParagraph(slateParagraph); 
            if (paragraphToAdd) script.body[index].content.push (paragraphToAdd);
        });
    });

    return script;
}
