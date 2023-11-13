/**
 * Functions rendering Slate JS's Elements and Texts  
 */

import { ReactElement } from "react";
import { SlateTextWrapperParagraph, SlateScriptElement, SlateTagParagraph, SlateTextNode, SlateNoteParagraph, SlateCgParagraph, SlatePresenterParagraph, SlateMosParagraph } from "octopus-yjs-libs/src/types/SlateScript";

/**
 * Renders STUDIO Element - header and wrapping its content children
 * @param studio - SlateJs CustomElement Object
 * @param children - child elements of the studio - see SlateScript.ts
 * @returns Rendered studio Element as HTML - the parent wrapper element of the studio content
 */

export function renderStudio(studio: SlateScriptElement, children): ReactElement {
  return (
    <div style={{ border: "1px solid black" }}>
      <div style={{ border: "1px solid black", userSelect: "none" }} contentEditable={false}>{studio.label}</div>
      {children}
    </div>
  )
}

export function renderTextWrappingParagraph(element: SlateTextWrapperParagraph, children): ReactElement {
  console.log("Rendering Text Wrapper for", children)
  return (
    <span>{children}</span>
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
    <div contentEditable={false} style={{ cursor: "not-allowed", display: "inline-block"}}>
      <div {...attributes} contentEditable={false} style={{ cursor: "not-allowed", display: "inline-block", background: tag.background, color: tag.foreground }}>{tag.tagText}</div>
    </div>
  )
}

export function renderNote(note: SlateNoteParagraph, children, attributes): ReactElement {
  return (
    <div style={{ padding: "5px" }}>
      <div contentEditable={false} style={{ height: "20px", backgroundColor: "#E4BE3F" }}>NOTE</div>
      <div contentEditable={false} style={{ backgroundColor: "#EEE6C9" }}><span className="slate-ignored" contentEditable={true}>THIS IS EDITABLE BUT NOT INTO SLATE</span></div>
      <span {...attributes} style={{ display: "block", backgroundColor: "#EEE6C9", color: "black" }}>{children}</span>
    </div>
  )
}


export function renderCg(cg: SlateCgParagraph, children, attributes): ReactElement {
  console.log("Rendering CG for", cg)

  return (
    <div style={{ padding: "5px" }}>
      <div contentEditable={false} style={{ height: "20px", backgroundColor: "#232944", color: "white" }}>CG</div>
      <div contentEditable={false} style={{ backgroundColor: "#F4F5FA" }}>{cg.lines[0]}</div>
      <span {...attributes} style={{ display: "block", backgroundColor: "#F4F5FA", color: "black" }}>{children}</span>
    </div>
  )
}

export function renderMos(mos: SlateMosParagraph, children, attributes): ReactElement {
  return (
    <div style={{ padding: "5px" }}>
      <div contentEditable={false} style={{ height: "20px", backgroundColor: "#6B3CBF" }}>{mos.object.mosId}</div>
      <div contentEditable={false} style={{ backgroundColor: "#F4F5FA" }}><span className="slate-ignored" contentEditable={true}>{mos.object.objId}</span></div>
      <span {...attributes} style={{ display: "block", backgroundColor: "#F4F5FA", color: "black" }}>{children}</span>
    </div>
  )
}

export function renderPresenter(pres: SlatePresenterParagraph, children, attributes): ReactElement {
  return (
    /** TOTO JE TROCHU PROBLEM. Ten kurzor tam furt lezie, jak je to inline element ... je potreba to osetrit rucne .. :( */
    <div contentEditable={false} style={{ cursor: "not-allowed", display: "inline-block"}}>
      <div {...attributes} contentEditable={false} style={{ cursor: "not-allowed", display: "inline-block", background: "black", color: "white" }}>{pres.user.id}</div>
    </div>
  )
}


/**
 * Renders Text - a content of an element 
 * @param paragraph - SlateJS CustomText Object
 * @returns - decorated Text as HTML
 */

export function renderText(paragraph: SlateTextNode, children, attributes): ReactElement {
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


