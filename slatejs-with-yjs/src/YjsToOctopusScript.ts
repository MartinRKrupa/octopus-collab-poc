import * as Y from 'yjs';
import { OctopusScript } from './types/OctopusScript';

interface Operation {
    path:number[],
    offset: number | null,
    type: "add"|"remove"|"set_attribute"
    attributes: {[k:string]:any}
}
/*
function getOctopusPath(
    sharedRoot: Y.XmlText,
    scriptRoot: OctopusScript,
    yText: Y.XmlText
  ): number[] {

    const yNodePath = [yText];
    while (yNodePath[0] !== sharedRoot) {
      const { parent: yParent } = yNodePath[0];
  
      if (!yParent) {
        throw new Error("yText isn't a descendant of root element");
      }
  
      if (!(yParent instanceof Y.XmlText)) {
        throw new Error('Unexpected y parent type');
      }
  
      yNodePath.unshift(yParent);
    }
  
    if (yNodePath.length < 2) {
      return [];
    }
  
    let slateParent = scriptRoot;
    return yNodePath.reduce<number[]>((path, yParent, idx) => {
      const yChild = yNodePath[idx + 1];
      if (!yChild) {
        return path;
      }
  
      let yOffset = 0;
      const currentDelta = yTextToInsertDelta(yParent);
      for (const element of currentDelta) {
        if (element.insert === yChild) {
          break;
        }
  
        yOffset += typeof element.insert === 'string' ? element.insert.length : 1;
      }
  
      if (Text.isText(slateParent)) {
        throw new Error('Cannot descent into slate text');
      }
  
      const [pathOffset] = yOffsetToSlateOffsets(slateParent, yOffset);
      slateParent = slateParent.children[pathOffset];
      return path.concat(pathOffset);
    }, []);
  }

export function translateYTextEventToOctopusEvent(
    sharedRoot: Y.XmlText,
    octopusScript: OctopusScript,
    event: Y.YTextEvent,
    path: number[]
  ): Operation[] {
    const { target, changes } = event;
    const delta = event.delta;
  
    if (!(target instanceof Y.XmlText)) {
      throw new Error('Unexpected target node type');
    }

    const octopusPath = getOctopusPath(sharedRoot, octopusScript, target);
  
    const ops: Operation[] = [];
    const targetElement = octopusScript.body[path[0]];
  
    const keyChanges = Array.from(changes.keys.entries());
    console.log ("keyChanges are " , keyChanges);
    if (path.length > 0 && keyChanges.length > 0) {
      const newProperties = Object.fromEntries(
        keyChanges.map(([key, info]) => [
          key,
          info.action === 'delete' ? null : target.getAttribute(key),
        ])
      );
  
      const properties = Object.fromEntries(
        keyChanges.map(([key]) => [key, targetElement[key]])
      );
  
      ops.push({ type: 'set_attribute', attributes: properties, path: path, offset:null });
    }
  
    if (delta.length > 0) {
      ops.push(...applyDelta(targetElement, slatePath, delta));
    }
    return ops;
  }
  */