/**
 * Maps SlateScript Object to Octopus Script
 */
 
import {OctopusScript, OctopusScriptElement, OctopusScriptTextParagraph, OctopusScriptTagParagraph} from "../types/OctopusScript";
import { SlateScript, CustomElement, SlateTextParagraph, SlateTagParagraph } from "../types/SlateScript";

function mapObjectValueIfExists(sourceValue, targetObject, targetPropName){
    if (sourceValue != null && sourceValue != undefined) {
        targetObject[targetPropName] = sourceValue;
    }
}


function mapTextParagraph (slateTextParagraph: SlateTextParagraph): OctopusScriptTextParagraph{
    
    let octopusTextParagraph = {
        pid: slateTextParagraph.pid,
        text: slateTextParagraph.text,
        type: 'text'        
    }
    mapObjectValueIfExists (slateTextParagraph.bold, octopusTextParagraph, "bold");
    mapObjectValueIfExists (slateTextParagraph.italic, octopusTextParagraph, "italic");
    mapObjectValueIfExists (slateTextParagraph.underline, octopusTextParagraph, "underline");
    mapObjectValueIfExists (slateTextParagraph.dontCount, octopusTextParagraph, "dontCount");
    mapObjectValueIfExists (slateTextParagraph.ignore, octopusTextParagraph, "ignore");
    mapObjectValueIfExists (slateTextParagraph.rtl, octopusTextParagraph, "rtl");

    return octopusTextParagraph;

}

function mapTagParagraph (slateTagParagraph: SlateTagParagraph): OctopusScriptTagParagraph{
    
    let octopusTagParagraph:OctopusScriptTagParagraph = {
        pid: slateTagParagraph.pid,
        text: slateTagParagraph.text,
        type: 'tag',
        foreground: slateTagParagraph.foreground,
        background: slateTagParagraph.background
    }
    mapObjectValueIfExists (slateTagParagraph.dur, octopusTagParagraph, "dur");
    mapObjectValueIfExists (slateTagParagraph.fontSize , octopusTagParagraph, "fontSize");
    return octopusTagParagraph;

}

export function mapSlateScriptToOctopusScript(slateScript: SlateScript): OctopusScript{
    let script:OctopusScript = {
        body: [] as OctopusScriptElement[]
    }

    slateScript.forEach((value:CustomElement, index: number) => {
        script.body[index] = {
            elid: value.elid,
            type:  value.type,
            label:  value.label,
            content: []         
        };
        value.children.forEach( (value: SlateTextParagraph | SlateTagParagraph, index2) => {
            switch (value.type) {
                case "text":
                    const textVal = value as SlateTextParagraph;
                    script.body[index].content[index2] = mapTextParagraph(textVal);
                    break;
                case "tag":
                    const tagVal = value as SlateTagParagraph;
                    script.body[index].content[index2] = mapTagParagraph(tagVal);
                    break;
            }
        });
    });

    return script;
}
