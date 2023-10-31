/**
 * Legacy OCTOPUS Script model
 */

export interface OctopusScriptTextParagraph {
    type: string,
    text: string,
    bold?: boolean,
    italic?: boolean,
    underline?: boolean,
    dontCount?: boolean,
    ignore?: boolean,
    rtl?: boolean
}

export interface OctopusScriptTagParagraph {
    type: string,
    text: string,
    dur?: number,
    fontSize?: number,
    foreground: string,
    background: string
}
export type OctopusScriptParagraph = OctopusScriptTextParagraph | OctopusScriptTagParagraph;

export interface OctopusScriptElement {
    type: string,
    label: string,
    elid: number,
    content: OctopusScriptParagraph[]
}

export interface OctopusScript {
    body: OctopusScriptElement[]
}
