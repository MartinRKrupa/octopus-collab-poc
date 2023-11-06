/**
 * Maps OctopusScript Object to SlateScript
 */

import { Descendant } from "slate";
import { OctopusScript, OctopusScriptElement, OctopusScriptParagraph} from "../types/OctopusScript";
import { SlateNoteParagraph, SlateParagraph, SlateTextParagraph } from "../types/SlateScript";

export function mapOctopusParagraphToSlateElement(scriptParagaph: OctopusScriptParagraph): SlateParagraph{
    let nodeToInsert: SlateParagraph = {type: "", children: []};
            Object.getOwnPropertyNames(scriptParagaph).filter((attrName)=>attrName != "text")
                .forEach((attrName)=>nodeToInsert[attrName] = scriptParagaph[attrName]);

    switch (scriptParagaph.type) {
        case "text":
            nodeToInsert['text'] = scriptParagaph['text'] != null ? scriptParagaph['text'] : ""; 
            nodeToInsert['children'] = null;                   
            return { type: "textElement", children: [nodeToInsert as unknown as SlateTextParagraph] };
        case "tag":
            nodeToInsert['tagText'] = scriptParagaph['text'] != null ? scriptParagaph['text'] : "";                    
            break;
        case "note":
            nodeToInsert['noteText'] = scriptParagaph['text'] != null ? scriptParagaph['text'] : "";                    
            break;
    }
    return nodeToInsert;
}

export function mapOctopusScriptToSlateScript(octopusScript: OctopusScript): Descendant[] {
    let slateScript = [];
    
    octopusScript.body.forEach((value: OctopusScriptElement, elementIndex: number) => {
        slateScript[elementIndex] = {
            elid: value.elid,
            type: value.type,
            label: value.label,
            children: []
        };
        value.content.forEach((scriptParagaph: OctopusScriptParagraph, paragraphIndex) => {
            slateScript[elementIndex].children[paragraphIndex] = mapOctopusParagraphToSlateElement(scriptParagaph);
        });
    });

    return slateScript;
}
