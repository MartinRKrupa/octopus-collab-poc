import { BaseEditor } from "slate";
import { ReactEditor } from "slate-react";
import { Emitter, EventType } from 'mitt';
import * as Y from 'yjs';

export const withOperationsCatcher = (editor : BaseEditor & ReactEditor, sharedType: Y.XmlText, emitter: Emitter<Record<EventType, unknown>> | null, remote)=> {
  const { onChange } = editor
  
  editor.onChange = (change) => {
    console.log("CATCHING CHANGE");
    if (change !=null){
      console.log ("REMOTE ? - asked by " + sharedType.doc.clientID + " - " + remote.current);
      console.log ("CHANGE IN PROGRESS. CHANGE ", change);  
    }
    onChange(change);
  }

  return editor
}