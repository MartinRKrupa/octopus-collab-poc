/**
 * Slate Editor Object model
 * Tried to keep it as close to Legacy Script Object model - see Script.ts
 */
import { Editor, Node } from 'slate'
import { ReactEditor } from 'slate-react'
import * as OS from './OctopusScript'

export type CustomEditor = Editor & ReactEditor

export interface SlateScriptElement extends OS.OctopusScriptElement {  
  children: SlateParagraph[];
}

/**
 * This is an additional wrapping paragraph for the "text". 
 */
export type SlateTextWrapperParagraph = {
  type: string,
  children: SlateTextParagraph[]
}

export interface SlateTextParagraph extends OS.OctopusScriptTextParagraph {} 
export interface SlateTagParagraph {
  type: string,
  tagText: string,
  dur?: number,
  fontSize?: number,
  foreground: string,
  background: string,
  children: [{text:string}]
}
export interface SlateNoteParagraph {
  type: string,
  noteText: string,
  children: [{text:string}]
}

export interface SlatePresenterParagraph extends OS.OctopusScriptPresenterParagraph{}
export interface SlateCgParagraph extends OS.OctopusScriptCgParagraph{}
export interface SlateMosParagraph extends OS.OctopusScriptMosParagraph{}

export type SlateParagraph = (SlateTextWrapperParagraph | SlateTagParagraph | SlateNoteParagraph | SlatePresenterParagraph | SlateCgParagraph | SlateMosParagraph);

export type CustomElement = SlateScriptElement;
export type CustomText = SlateTextParagraph;
export type SlateScript = CustomElement[];
