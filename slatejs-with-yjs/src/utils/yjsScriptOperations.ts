import * as Y from 'yjs';
import { OctopusScriptElement } from '../types/OctopusScript';

/**
 * 
 * @param sharedType 
 * @param elementIndex 
 * @returns 
 */
function getElementByIndexNo(sharedType: Y.XmlText, elementIndex: number, paragraphIndex?: number):Y.Text {
    const yElement = sharedType.toDelta() && sharedType.toDelta().length > elementIndex && sharedType.toDelta()[elementIndex].insert ? sharedType.toDelta()[elementIndex].insert : null;
    const yParagraph: Y.Text = paragraphIndex != null && yElement.toDelta() && yElement.toDelta().length > paragraphIndex && yElement.toDelta()[paragraphIndex].insert ? yElement.toDelta()[paragraphIndex].insert : null;
    console.log("Shared Type to delta is" , sharedType.toDelta());
    console.log("Delta Y ELement IS" , yElement);
    console.log("Paragraph Y ELement IS" , yParagraph);    
    return yParagraph ? yParagraph : yElement;
}

/**
 * Adds a character onto a given position
 * @param elementIndex 
 * @param position 
 * @param sharedType 
 */
export function addCharacter(sharedType: Y.XmlText, elementIndex: number, paragraphIndex:number, character: string, position: number, format?: Object) {
    //WHEN ADDING TEXTS, shared Type has to be transformed to deltas to pick correct Element for manipulation
    //sharedType is the YXML content of YJS
    const yElement: Y.Text = getElementByIndexNo(sharedType, elementIndex, paragraphIndex);
    if (yElement){
        console.debug("Adding character to into YJS Doc Element " + elementIndex + ", position " + position);
        yElement.insert(position, character, format);
    }
};

export function formatRange(sharedType: Y.XmlText, elementIndex: number, paragraphIndex: number, position: number, length: number, format: Object) {
    //WHEN ADDING TEXTS, shared Type has to be transformed to deltas to pick correct Element for manipulation
    //sharedType is the YXML content of YJS 
    const yElement: Y.Text = getElementByIndexNo(sharedType, elementIndex, paragraphIndex);
    if (yElement){
        console.debug("Adding character to into YJS Doc Element " + elementIndex + ", position " + position);
        yElement.format(position, length, format);
    }
};

/**
 * Deletes an element
 * @param elementIndex 
 * @param sharedType 
 */
export function deleteElement (sharedType: Y.XmlText, elementIndex: number) {
    //The element are then the top level deltas.
    if(sharedType.length > elementIndex) {
        console.debug("Removing Element from YJS Doc" + elementIndex);
        sharedType.delete(elementIndex,1);
    }
};

export function deleteCharacter(sharedType: Y.XmlText, elementIndex: number, paragraphIndex: number, position: number, length: number = 1) {
    //WHEN ADDING TEXTS, shared Type has to be transformed to deltas to pick correct Element for manipulation
    //sharedType is the YXML content of YJS 
    const yElement: Y.Text = getElementByIndexNo(sharedType, elementIndex, paragraphIndex);
    if (yElement){
        console.debug("Removing character from YJS Doc Element " + elementIndex + ", position " + position + ", length " + length );
        yElement.delete(position,length);
    }
};

export function deleteParagraph(sharedType: Y.XmlText, elementIndex: number, paragraphIndex: number) {
    //WHEN ADDING TEXTS, shared Type has to be transformed to deltas to pick correct Element for manipulation
    //sharedType is the YXML content of YJS 
    const yElement: Y.Text = getElementByIndexNo(sharedType, elementIndex);
    if (yElement){
        console.debug("Removing paragraph from YJS Doc Element " + elementIndex + ", position " + paragraphIndex );
        yElement.delete(paragraphIndex,1);
    }
};

/**
 * 
 * @param sharedType 
 * @param element 
 * @param index 
 */
export function addElement (sharedType: Y.XmlText, element: OctopusScriptElement, index: number) {            
    const yElement: Y.XmlText = new Y.XmlText();
    Object.keys(element).forEach((key)=>{
        yElement.setAttribute(key, element[key]);
    });
    element.content.reverse().forEach((paragraph)=>{
        let formattingObject = {}; 
        Object.keys(paragraph).forEach((key)=>{
            if (key != "text") formattingObject[key] = paragraph[key];
        }); 
        yElement.insert(0, paragraph.text ? paragraph.text : "", formattingObject);
    })
   sharedType.applyDelta([{insert: yElement}]);
};

/**
 * 
 * @param sharedType 
 * @param elementIndex 
 * @param attributeName 
 * @param value 
 */

export function setElementAttribute (sharedType: Y.XmlText, elementIndex:number, attributeName: string, value: string | number | boolean) {            
    const yElement: Y.Text = sharedType.toDelta() && sharedType.toDelta().length > elementIndex && sharedType.toDelta()[elementIndex].insert ? sharedType.toDelta()[elementIndex].insert : null;
    if (yElement){
        console.debug("Changing attribute of YJS Doc Element " + elementIndex + ", attr " + attributeName + ", value " + value );
        yElement.setAttribute(attributeName, value);
    }
};