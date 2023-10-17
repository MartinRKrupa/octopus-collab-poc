/**
 * Slate Editor Object model
 * Tried to keep it as close to Legacy Script Object model - see Script.ts
 */
import { Editor, Node } from 'slate'
import { ReactEditor } from 'slate-react'

export type CustomEditor = Editor & ReactEditor

export type SlateStudioElement = {
  type: string,
  label: string,
  elid: number,
  children: (SlateTextWrapperParagraph | SlateTagParagraph | SlateNoteParagraph )[];
}

export type SlateTextWrapperParagraph = {
  type: string,
  children: SlateTextParagraph[]
}

export type SlateTextParagraph = {
  pid: string,
  type: string,
  text: string,
  bold?: boolean,
  italic?: boolean,
  underline?: boolean,
  dontCount?: boolean,
  ignore?: boolean,
  rtl?: boolean
  }

export type SlateTagParagraph = {
  pid: string,
  type: string,
  elementText: string,
  dur?: number,
  fontSize?: number,
  foreground: string,
  background: string,
  children: [{text:string}]
}

export type SlateNoteParagraph = {
  pid: string,
  type: string,
  elementText: string,
  children: [{text:string}]
}

export type CustomElement = SlateStudioElement;
export type CustomText = SlateTextParagraph;
export type SlateScript = CustomElement[];
