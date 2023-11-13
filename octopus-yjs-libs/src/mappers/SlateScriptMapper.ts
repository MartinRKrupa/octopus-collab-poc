/**
 * Maps OctopusScript Object to SlateScript - loose mapping, not tied to low level types
 */

import { OctopusScript, OctopusScriptElement, OctopusScriptParagraph} from "../types/OctopusScript";
import { SlateParagraph, SlateScriptElement, SlateTextNode } from "../types/SlateScript";

export function mapOctopusParagraphToSlateElement(scriptParagaph: OctopusScriptParagraph): SlateParagraph{
    let nodeToInsert: SlateParagraph = {type: "", children: []};
            Object.getOwnPropertyNames(scriptParagaph).filter((attrName)=>attrName != "text")
                .forEach((attrName)=>nodeToInsert[attrName] = scriptParagaph[attrName]);

    switch (scriptParagaph.type) {
        case "text":
            nodeToInsert['text'] = scriptParagaph['text'] != null ? scriptParagaph['text'] : ""; 
            nodeToInsert['children'] = null;                   
            return { type: "textElement", children: [nodeToInsert as unknown as SlateTextNode] };
        case "tag":
            nodeToInsert['tagText'] = scriptParagaph['text'] != null ? scriptParagaph['text'] : "";                    
            break;
        case "note":
            nodeToInsert['noteText'] = scriptParagaph['text'] != null ? scriptParagaph['text'] : "";                    
            break;
    }
    return nodeToInsert;
}

export function mapOctopusScriptElementToSlateScriptElement(octopusScript: OctopusScriptElement): SlateScriptElement{
    let retVal = {
        elid: octopusScript.elid,
        type: octopusScript.type,
        label: octopusScript.label,
        children: []
    };
    octopusScript.content.forEach((scriptParagaph: OctopusScriptParagraph, paragraphIndex) => {
        retVal.children[paragraphIndex] = mapOctopusParagraphToSlateElement(scriptParagaph);
    });

    return retVal;
}

export function mapOctopusScriptToSlateScript(octopusScript: OctopusScript): SlateScriptElement[] {
    let slateScript = [];
    
    octopusScript.body.forEach((value: OctopusScriptElement, elementIndex: number) => {
        slateScript[elementIndex] = mapOctopusScriptElementToSlateScriptElement(value);
    });

    return slateScript;
}
