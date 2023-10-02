import * as Automerge from '@automerge/automerge';
import { BaseEditor, Operation } from "slate";
import { ReactEditor } from "slate-react";
import { OctopusScript } from './types/OctopusScript';
import { AutomergeChangelog } from './SharedChangeLog';
import { Emitter, EventType } from 'mitt';

export const withOperationsCatcher = (editor : BaseEditor & ReactEditor, automergeChangelog: AutomergeChangelog, emitter: Emitter<Record<EventType, unknown>> | null)=> {
  const { onChange } = editor

  editor.onChange = change => {
    const symbols = Object.getOwnPropertySymbols(change.operation);
    console.log("SYMBOLS", symbols)    
    const remote = symbols.length != 0;
    console.log ("REMOTE ? - asked by " + automergeChangelog.getActorId() + " - " + remote);

    if(remote == true) {
        console.log ("REMOTE CHANGE BEING REPLAYED. OPERATION " + change.operation.type + " will not be processed by " + automergeChangelog.getActorId());
    }
    if (emitter && change && remote == false) {
        console.log ("Change operation caught, adding it tom myChangeLog:", change.operation, automergeChangelog.getActorId());
        automergeChangelog.addOperation (change.operation);
        console.log ("Trigerring event from UserId" + automergeChangelog.getActorId());
        emitter.emit(automergeChangelog.getActorId(), automergeChangelog.getOperations());
    }
    onChange(change);
  }

  return editor
}