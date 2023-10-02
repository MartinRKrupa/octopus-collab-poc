import * as Automerge from '@automerge/automerge';
import { OctopusScript } from './types/OctopusScript';
import { Operation } from 'slate';

export class AutomergeChangelog {

    private operations: Automerge.next.Doc<any>;
    private isInitializedWithSomeData: boolean = false;
    private lastProcessedOperationChangeIndex: number = -1;

    constructor(){
        this.init();
    }

    public init(){
        this.operations = Automerge.init();
        console.debug ("ChangeLog CRDT initiated, got user ID of " + Automerge.getActorId(this.operations));
        console.log (this.operations)
        this.lastProcessedOperationChangeIndex = -1;
        return this.operations;

    }

    public getOperations(){
        return this.operations;
    }

    public getActorId(): string{
        return Automerge.getActorId(this.operations);
    }

    private getOperationChangeIndex(operationIndex){
        const op = this.getOperations().list[operationIndex];
        const symbols = Object.getOwnPropertySymbols(op);
        return Number((op[symbols[0]]).split("@")[0]);    
    }

    private getLastOperationChangeIndex (): number{
        return this.getOperationChangeIndex[this.getOperations().list.length - 1];
    }

    private setLastOperationIndex (lastProcessedOperation) {
        this.lastProcessedOperationChangeIndex = lastProcessedOperation;
    }

    public addOperation (operation: Operation){  
        
        if (!this.isInitializedWithSomeData) {
            this.operations = Automerge.change (this.operations, "OPERATION " + operation.type, ops => {            
                ops.list = [];
            });
            this.isInitializedWithSomeData = true;
        }  

        this.operations = Automerge.change (this.operations, "OPERATION " + operation.type, ops => {            
            ops.list.push(operation);
        });
        console.log ("Adding operation " + operation.type + " for automerge obj " + Automerge.getActorId(this.operations) + " on position of " + this.operations.list.length);

        console.log ("ALL CHANGES");
        console.log (Automerge.getAllChanges(this.operations));

        this.lastProcessedOperationChangeIndex = this.getLastOperationChangeIndex();
    }

    public mergeChanges (incomingOperations: Automerge.next.Doc<any>){
        //NOTE: first merge initializes data just as well;
        if (!this.isInitializedWithSomeData) 
            this.isInitializedWithSomeData = true;        
        console.log ("IncomingOperations", incomingOperations, "CurrentDoc:", this.operations);
        this.operations = Automerge.merge(this.operations, incomingOperations);
        console.log ("Merging remote changes from " + Automerge.getActorId(incomingOperations)+ ", final result is: ");
        console.log (this.operations);
    }

    public getUnprocessedOperations(): Operation[]{
        
        let unprocessedOps = [];
        const curChangeList = this.getOperations().list;
        curChangeList.forEach ((val,index) => {
            if (this.getOperationChangeIndex(index) > this.lastProcessedOperationChangeIndex) {
                console.log("NOT PROCESSED: ", val);
                unprocessedOps.push(val);
            }
            else {
                console.log("ALREADY PROCESSED, skipping: ", val, this.getOperationChangeIndex(index), this.lastProcessedOperationChangeIndex);
            }
        });
        return unprocessedOps;
    }

}

