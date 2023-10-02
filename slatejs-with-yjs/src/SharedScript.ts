import * as Automerge from '@automerge/automerge';
import { OctopusScript } from './types/OctopusScript';

let script;

export function init(initialScript: OctopusScript): OctopusScript{
    script = Automerge.init();
    script = Automerge.change(script, 'Initial Load', (tempScript:OctopusScript) => {
        tempScript.body = initialScript.body;
    });
    console.debug ("Script CRDT initiated, got user ID of " + Automerge.getActorId(script));
    console.log (script)
    return script;
}