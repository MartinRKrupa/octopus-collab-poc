import * as Automerge from '@automerge/automerge';
import { OctopusScript } from './types/OctopusScript';

export class AutomergeScript {
    private script: Automerge.next.Doc<OctopusScript>

    public init(initialScript: OctopusScript): OctopusScript{
        this.script = Automerge.init();
        this.script = Automerge.change(this.script, 'Initial Load', (tempScript:OctopusScript) => {
            tempScript.body = initialScript.body;
        });
        console.debug ("Script CRDT initiated, got user ID of " + Automerge.getActorId(this.script));
        console.log (this.script)
        return this.script;
    }

    public getScript(){
        return this.script;
    }
}

