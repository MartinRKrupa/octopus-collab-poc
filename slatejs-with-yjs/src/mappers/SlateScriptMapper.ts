/**
 * Maps SlateScript Object to Octopus Script
 */
 
import {OctopusScript, OctopusScriptElement, OctopusScriptTextParagraph, OctopusScriptTagParagraph, OctopusScriptParagraph} from "../types/OctopusScript";
import { SlateScript, CustomElement, SlateTextParagraph, SlateTagParagraph, SlateTextWrapperParagraph } from "../types/SlateScript";

function mapObjectValueIfExists(sourceValue, targetObject, targetPropName){
    if (sourceValue != null && sourceValue != undefined) {
        targetObject[targetPropName] = sourceValue;
    }
}


function mapTextParagraph (octopusTextParagraph: OctopusScriptTextParagraph): SlateTextParagraph{
    
    let slateTextParagraph: SlateTextParagraph = {
        pid: octopusTextParagraph.pid,
        text: octopusTextParagraph.text,
        type: 'text',
    }
    mapObjectValueIfExists (octopusTextParagraph.bold, slateTextParagraph, "bold");
    mapObjectValueIfExists (octopusTextParagraph.italic, slateTextParagraph, "italic");
    mapObjectValueIfExists (octopusTextParagraph.underline, slateTextParagraph, "underline");
    mapObjectValueIfExists (octopusTextParagraph.dontCount, slateTextParagraph, "dontCount");
    mapObjectValueIfExists (octopusTextParagraph.ignore, slateTextParagraph, "ignore");
    mapObjectValueIfExists (octopusTextParagraph.rtl, slateTextParagraph, "rtl");

    return slateTextParagraph;

}

function mapTagParagraph (octopusTagParagraph: OctopusScriptTagParagraph): SlateTagParagraph{
    
    let slateTagParagraph:SlateTagParagraph = {
        pid: octopusTagParagraph.pid,
        elementText: octopusTagParagraph.text,
        type: 'tag',
        foreground: octopusTagParagraph.foreground,
        background: octopusTagParagraph.background,
        children: [{text:""}]
    }
    mapObjectValueIfExists (octopusTagParagraph.dur, slateTagParagraph, "dur");
    mapObjectValueIfExists (octopusTagParagraph.fontSize , slateTagParagraph, "fontSize");
    return slateTagParagraph;

}

export function mapOctopusScriptToSlateScript(octopusScript: OctopusScript): SlateScript{
    let script:SlateScript = [] as CustomElement[];

    octopusScript.body.forEach((value:OctopusScriptElement , index: number) => {
        script[index] = {
            elid: value.elid,
            type:  value.type,
            label:  value.label,
            children: []         
        };
        value.content.forEach( (value: OctopusScriptParagraph, index2) => {
            switch (value.type) {
                case "text":
                    const textVal = value as OctopusScriptTextParagraph;
                    script[index].children[index2] = {type:"textElement", children:[]};
                    let textWrapper = script[index].children[index2] as SlateTextWrapperParagraph; 
                    textWrapper.children[0] = mapTextParagraph(textVal);
                    break;
                case "tag":
                    const tagVal = value as OctopusScriptTagParagraph;
                    script[index].children[index2] = mapTagParagraph(tagVal);
                    break;
            }
        });
    });

    return script;
}
