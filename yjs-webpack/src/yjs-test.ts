import * as Y from 'yjs';
import {getTestScript} from "octopus-yjs-libs/data/TestScript";
import * as yOps from "octopus-yjs-libs/api/YJsScriptOperations"
import { YJsScriptChangeListener } from 'octopus-yjs-libs/api/YJsScriptChangeListener';


export function testYJS(){
    // Yjs documents are collections of shared objects that sync automatically.
    const ydoc = new Y.Doc()
    //Dummy data
    const mockOctopusScript = getTestScript();
    // Create a sharedType of Y.XmlText
    const sharedOctopusScript = ydoc.get("content", Y.XmlText) as Y.XmlText;
    //Listen to changes
    const changeListener: YJsScriptChangeListener = new YJsScriptChangeListener(sharedOctopusScript, (changes)=>{
        console.log("Observed some changes on the shared document", changes);
    })

    //Apply some changes - initialize shared type from the script. See change log in console ;
    yOps.initializeSharedTypeFromOctopusScript(sharedOctopusScript, mockOctopusScript);    
}