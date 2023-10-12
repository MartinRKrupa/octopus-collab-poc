/**
 * Functions rendering Slate JS's Elements and Texts  
 */

import React, { ReactElement } from "react";
import {SlateStudioElement, SlateTagParagraph, SlateTextParagraph} from "./types/SlateScript";

/**
 * Renders STUDIO Element - header and wrapping its content children
 * @param studio - SlateJs CustomElement Object
 * @param children - child elements of the studio - see SlateScript.ts
 * @returns Rendered studio Element as HTML - the parent wrapper element of the studio content
 */

export function renderStudio(studio: SlateStudioElement, children):ReactElement{
    return (
        <div style={{ border: "1px solid black" }}>
          <div style={{ border: "1px solid black", userSelect: "none" }} contentEditable={false}>{studio.label}</div>
          {children}
        </div>
      )
}

/**
 * Renders TAG - a content of a parent (e.g.STUDIO) element 
 * @param tag - SlateJS CustomText Object
 * @returns - rendered Tag Element as HTML
 */

export function renderTag(tag: SlateTagParagraph, children, attributes): ReactElement {
    return (
      /** TOTO JE TROCHU PROBLEM. Ten kurzor tam furt lezie, jak je to inline element ... je potreba to osetrit rucne .. :( */
        <div {...attributes} contentEditable={false} style={{ cursor:"not-allowed", display: "inline-block", background: tag.background, color: tag.foreground }}>{children}</div>
    )
}

export function renderNote(tag: SlateTagParagraph, children, attributes): ReactElement {
  return (
    <div style={{padding:"5px"}}>
      <div contentEditable={false} style={{height:"20px", backgroundColor:"#CCCCCC" }}>NOTE</div>
      <div contentEditable={false} style={{backgroundColor:"#CCCCCC" }}><span className="slate-ignored" contentEditable={true}>THIS IS EDITABLE BUT NOT INTO SLATE</span></div>

      <span {...attributes} style={{ display: "block", backgroundColor: "#DDDDDD", color: "black" }}>{children}</span>
    </div>
  )
}


/**
 * Renders Text - a content of an element 
 * @param paragraph - SlateJS CustomText Object
 * @returns - decorated Text as HTML
 */

export function renderText(paragraph: SlateTextParagraph, children, attributes): ReactElement {
    if (paragraph.bold) {
        children = <strong>{children}</strong>
      }
  
      if (paragraph.italic) {
        children = <em>{children}</em>
      }
  
      if (paragraph.underline) {
        children = <u>{children}</u>
      }
  
      return <span {...attributes}>{children}</span>
  
}


