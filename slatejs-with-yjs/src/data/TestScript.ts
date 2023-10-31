import { OctopusScript, OctopusScriptElement } from "../types/OctopusScript"
import { CustomElement, SlateNoteParagraph, SlateTagParagraph, SlateTextParagraph, SlateTextWrapperParagraph } from "../types/SlateScript";

const dummyScript: OctopusScript = {
    body: [{
        type: "STUDIO",
        label: "ŠTÚDIO",
        elid: 0,
        content: [
            {
                type: 'text',
                text: 'OBYC TEXT '
            },
            {
                type: 'text',
                bold: true,
                text: 'BOLD TEXT '
            },
            {
                type: 'tag',
                foreground: "#FF0000",
                background: "#000000",
                text: 'THIS IS A TAG'
            },
            {
                type: 'text',
                italic: true,
                text: ' ITALIC TEXT \nON 2 LINES'
            }

        ]
    }]
};

export function getTestScript(): OctopusScript {
    return dummyScript;
}

export function getSlateTestStudioElement(elid): CustomElement {
    return {
        type: 'STUDIO',
        label: 'ŠTÚDIO 2',
        elid: elid,
        children: [{
            type: 'textElement',
            children: [
                {
                    type: 'text',
                    text: 'A NEW STUDIO with',
                } as SlateTextParagraph
            ]
        } as SlateTextWrapperParagraph,
        {
            type: 'tag',
            elementText: "MYTAG",
            foreground: "#FF0000",
            background: "#000000",
        } as SlateTagParagraph,
        {
            type: 'note',
            elementText: "This is a technical note jako prase",
        } as SlateNoteParagraph,
        {
            type: 'textElement',
            children: [
                {
                    type: 'text',
                    text: 'a bold text',
                    bold: true,
                } as SlateTextParagraph
            ]
        } as SlateTextWrapperParagraph
        ]
    }
}
