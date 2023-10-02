import * as React from "react";
import * as Automerge from '@automerge/automerge';
import { useState, useMemo, useCallback } from "react";
import { Editor, BaseEditor, createEditor, InsertNodeOperation, Node, NodeOperation, Operation, TextOperation, Transforms, Range, Descendant } from "slate";
import { isHotkey } from 'is-hotkey';
import { Editable, ReactEditor, Slate, withReact } from "slate-react";
import "./styles.css";
import { OctopusScript } from "./types/OctopusScript";
import { getTestScript, getSlateTestStudioElement } from "./data/TestScript";
import { CustomElement, CustomText, SlateScript } from "./types/SlateScript";
import * as ScriptRenderers from "./ScriptRenderers";
import * as OctopusScriptMapper from "./mappers/OctopusScriptMapper";
import { ScriptEditor } from "./ScriptEditor";

export const App = () => {

  return (
    <div>
      <ScriptEditor />
      <div style={{height:120, lineHeight:4}}>A DRUHA INSTANCE</div>
      <ScriptEditor />
    </div>
  )
}