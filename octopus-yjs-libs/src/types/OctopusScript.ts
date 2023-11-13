/**
 * Legacy OCTOPUS Script model - see https://confluence.octopus-news.com/display/REU/SF.04.000.01+Script+Object+Model?preview=/153845906/169017790/image-2023-8-15_18-18-45.png
 */

export interface OctopusScript {
    body: OctopusScriptElement[],
    version: number
}

export interface OctopusScriptElement {
    type: OctopusScriptElementType,
    label: string,
    elid: number,
    content?: OctopusScriptParagraph[]
    cuein?: number,
    cueout?: number,
    object?: MosObject
}

interface OctopusScriptAnyParagraph {
    type: string
}

interface OctopusScriptSubElementParagraph extends OctopusScriptAnyParagraph {
    cmdId: number
}

export enum OctopusScriptParagraphType {
    text = "text",
    cg = "cg",
    mos = "mos",
    pres = "pres",
    tag = "tag",
    note = "note"
}

export enum OctopusScriptElementType {
    STUDIO = "STUDIO",
    LIVE = "LIVE",
    JINGLE = "JINGLE",
    VO = "VO",
    VIDEO = "VIDEO",
    LEGACYVIDEO = "LEGACYVIDEO",
    TAPE = "TAPE",
    INSERT = "INSERT",
    BREAK = "BREAK",
    RADIO = "RADIO",
    NOTE = "NOTE",
    VIDEOTEXT = "VIDEOTEXT"
}

export interface OctopusScriptNoteParagraph extends OctopusScriptAnyParagraph {
    text: string,
}

export interface OctopusScriptTextParagraph extends OctopusScriptAnyParagraph {
    text: string,
    bold?: boolean,
    italic?: boolean,
    underline?: boolean,
    dontCount?: boolean,
    ignore?: boolean,
    rtl?: boolean
}

export interface OctopusScriptTagParagraph extends OctopusScriptAnyParagraph {
    text: string,
    dur?: number,
    fontSize?: number,
    foreground: string,
    background: string
}

export interface OctopusScriptPresenterParagraph extends OctopusScriptAnyParagraph {
    user: OctopusScriptSecondaryObject,
}

export interface OctopusScriptCgParagraph extends OctopusScriptSubElementParagraph {
    in?: number,
    out?: number,
    lines: string[],
    template?: OctopusScriptSecondaryObject,
    device?: OctopusScriptSecondaryObject,
    mosdevice?: OctopusScriptSecondaryObject
}

export interface OctopusScriptMosParagraph extends OctopusScriptSubElementParagraph {
    in?: number,
    out?: number,
    cueIn?: number,
    cueOut?: number,
    object?: MosObjectIdentifier
}

export interface OctopusScriptSecondaryObject {
    modified: number,
    objectType: string,
    id: number,
    globalId: string,
    object?: MosObjectIdentifier
}

interface MosObject {
    xml: string
}

interface MosObjectIdentifier {
    objectId: number,
    mosId: string,
    objId: string
}

export interface Clip {
    id?: string,
    name?: string,
    in?: number,
    out?: number,
    object?: MosObjectIdentifier
}

export type OctopusScriptParagraph = OctopusScriptTextParagraph | OctopusScriptTagParagraph | OctopusScriptPresenterParagraph | OctopusScriptCgParagraph | OctopusScriptMosParagraph | OctopusScriptNoteParagraph;