import { OctopusScript, OctopusScriptElement } from "../types/OctopusScript"
import { CustomElement, SlateTagParagraph, SlateTextParagraph } from "../types/SlateScript";

const dummyScript: OctopusScript = {
    body: [{
        type: "STUDIO",
        label: "ŠTÚDIO",
        elid: 0,
        content: [
            {
                pid: '1',
                type: 'text',
                text: 'OBYC TEXT '
            },
            {
                pid: '2',
                type: 'text',
                bold: true,
                text: 'BOLD TEXT '
            },
            {
                pid: '4',
                type: 'tag',
                foreground: "#FF0000",
                background: "#000000",
                text: 'THIS IS A TAG'
            },
            {
                pid: '3',
                type: 'text',
                italic: true,
                text: ' ITALIC TEXT \nON 2 LINES'
            }

        ]
    }]
};

const newSlateStudioNode:CustomElement = {
    type: 'STUDIO',
    label: 'ŠTÚDIO 2',
    elid: null,
    children: [{
        type: 'text',
        text: 'A NEW STUDIO with',
        pid: null,
        children: null
    } as SlateTextParagraph,
    {
        type: 'tag',
        text: "MYTAG",
        foreground: "#FF0000",
        background: "#000000",
        pid: null,
        children: null        
    } as SlateTagParagraph,
    {
        type: 'text',
        text: 'a bold text',
        bold: true,
        pid: null,
        children: null
    } as SlateTextParagraph],
}

export function getTestScript(): OctopusScript {    
    return dummyScript;
}

export function getSlateTestStudioElement(): CustomElement {    
    return newSlateStudioNode;
}
