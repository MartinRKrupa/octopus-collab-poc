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
  children: SlateTextParagraph[] | SlateTagParagraph[]
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
  children: CustomText[]
  }

export type SlateTagParagraph = {
  pid: string,
  type: string,
  text: string,
  dur?: number,
  fontSize?: number,
  foreground: string,
  background: string
  children: CustomText[]
}
    
export type CustomElement = SlateStudioElement;
export type CustomText = SlateTextParagraph | SlateTagParagraph;
export type SlateScript = CustomElement[];
