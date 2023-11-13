import * as Y from 'yjs';
import { OctopusScript, OctopusScriptElement, OctopusScriptParagraph} from '../types/OctopusScript';
import { arrayToUint8Array } from '../utils/Uint8ArrayUtils';
import { mapOctopusParagraphToSlateElement, mapOctopusScriptElementToSlateScriptElement, mapOctopusScriptToSlateScript } from '../mappers/SlateScriptMapper';
import { SlateParagraph, SlateScript, SlateScriptElement } from '../types/SlateScript';
import { mapObjectToXMLText, mapSlateScriptToInsertDeltas } from '../mappers/YJSScriptMapper';

/**
 * 
 * @param sharedType 
 * @param elementIndex 
 * @returns 
 */
function getElementByIndexNo(sharedType: Y.XmlText, elementIndex: number, paragraphIndex?: number): Y.Text {
    const yElement = sharedType.toDelta() && sharedType.toDelta().length > elementIndex && sharedType.toDelta()[elementIndex].insert ? sharedType.toDelta()[elementIndex].insert : null;
    const yParagraph: Y.Text = paragraphIndex != null && yElement.toDelta() && yElement.toDelta().length > paragraphIndex && yElement.toDelta()[paragraphIndex].insert ? yElement.toDelta()[paragraphIndex].insert : null;
    console.debug("Shared Type to delta is", sharedType.toDelta(), sharedType.getAttributes());
    console.debug("Delta Y ELement IS", yElement, yElement.getAttributes());
    console.debug("Paragraph Y ELement IS", yParagraph, yParagraph ? yParagraph.getAttributes() : null);
    return yParagraph ? yParagraph : yElement;
}

/**
 * Adds a character onto a given position
 * @param elementIndex 
 * @param position 
 * @param sharedType 
 */
export function addCharacter(sharedType: Y.XmlText, elementIndex: number, paragraphIndex: number, character: string, position: number, format?: Object) {
    //WHEN ADDING TEXTS, shared Type has to be transformed to deltas to pick correct Element for manipulation
    //sharedType is the YXML content of YJS
    const yElement: Y.Text = getElementByIndexNo(sharedType, elementIndex, paragraphIndex);
    if (yElement) {
        console.debug("Adding character to into YJS Doc Element " + elementIndex + ", paragraph " + paragraphIndex + " position " + position);
        yElement.insert(position, character, format);
    }
};

/**
 * 
 * @param sharedType 
 * @param elementIndex 
 * @param paragraphIndex 
 * @param attributeName 
 * @param value 
 */
export function setParagraphAttributes(sharedType: Y.XmlText, elementIndex: number, paragraphIndex: number, attributes: Map<string, string | number | boolean>) {
    //WHEN ADDING TEXTS, shared Type has to be transformed to deltas to pick correct Element for manipulation
    //sharedType is the YXML content of YJS
    const yElement: Y.Text = getElementByIndexNo(sharedType, elementIndex, paragraphIndex);
    if (yElement) {
        console.debug("Setting property of Element " + elementIndex + ", paragraph " + paragraphIndex + " attributes ", attributes);
        Y.transact(sharedType.doc, () => {
            attributes.forEach((value, attributeName) => {
                if (value != null)
                    yElement.setAttribute(attributeName, value);
                else
                    yElement.removeAttribute(attributeName);
            });
        });
    }
};

/**
 * 
 * @param sharedType 
 * @param elementIndex 
 * @param paragraphIndex 
 * @param position 
 * @param length 
 * @param format 
 */
export function formatRange(sharedType: Y.XmlText, elementIndex: number, paragraphIndex: number, position: number, length: number, format: Object) {
    //WHEN ADDING TEXTS, shared Type has to be transformed to deltas to pick correct Element for manipulation
    //sharedType is the YXML content of YJS 
    const yElement: Y.Text = getElementByIndexNo(sharedType, elementIndex, paragraphIndex);
    if (yElement) {
        console.debug("Formatting YJS Doc Element " + elementIndex + ", paragraph " + paragraphIndex + ", position " + position);
        yElement.format(position, length, format);
    }
};

/**
 * Deletes an element
 * @param elementIndex 
 * @param sharedType 
 */
export function deleteElement(sharedType: Y.XmlText, elementIndex: number) {
    //The element are then the top level deltas.
    if (sharedType.length > elementIndex) {
        console.debug("Removing Element from YJS Doc" + elementIndex);
        sharedType.delete(elementIndex, 1);
    }
};

/**
 * 
 * @param sharedType 
 * @param elementIndex 
 * @param paragraphIndex 
 * @param position 
 * @param length 
 */
export function deleteCharacter(sharedType: Y.XmlText, elementIndex: number, paragraphIndex: number, position: number, length: number = 1) {
    //WHEN ADDING TEXTS, shared Type has to be transformed to deltas to pick correct Element for manipulation
    //sharedType is the YXML content of YJS 
    const yElement: Y.Text = getElementByIndexNo(sharedType, elementIndex, paragraphIndex);
    if (yElement) {
        console.debug("Removing character from YJS Doc Element " + elementIndex + ", position " + position + ", length " + length);
        yElement.delete(position, length);
    }
};

export function deleteParagraph(sharedType: Y.XmlText, elementIndex: number, paragraphIndex: number) {
    //WHEN ADDING TEXTS, shared Type has to be transformed to deltas to pick correct Element for manipulation
    //sharedType is the YXML content of YJS 
    const yElement: Y.Text = getElementByIndexNo(sharedType, elementIndex);
    if (yElement) {
        console.debug("Removing paragraph from YJS Doc Element " + elementIndex + ", position " + paragraphIndex);
        yElement.delete(paragraphIndex, 1);
    }
};

/**
 * 
 * @param sharedType 
 * @param element 
 * @param index 
 */
export function addElement(sharedType: Y.XmlText, element: OctopusScriptElement, index: number) {
    const yElement: Y.XmlText = new Y.XmlText();
    Object.keys(element).forEach((key) => {
        yElement.setAttribute(key, element[key]);
    });
    
    let slateElement: SlateScriptElement = mapOctopusScriptElementToSlateScriptElement(element);    
    sharedType.applyDelta([{retain: index}, { insert: mapObjectToXMLText(slateElement) }]);
};

export function addParagraph(sharedType: Y.XmlText, elementIndex: number, paragraph: OctopusScriptParagraph, index: number) {

    const yElement: Y.Text = getElementByIndexNo(sharedType, elementIndex);
    let formattingObject = {};
    Object.keys(paragraph).forEach((key) => {
        if (key != "text") formattingObject[key] = paragraph[key];
    });

    let slateParagraph: SlateParagraph = mapOctopusParagraphToSlateElement(paragraph);    
    yElement.applyDelta([{ retain: index }, { insert: mapObjectToXMLText(slateParagraph)}]);
};

/**
 * 
 * @param sharedType 
 * @param elementIndex 
 * @param attributeName 
 * @param value 
 */

export function setElementAttributes(sharedType: Y.XmlText, elementIndex: number, attributes: Map<string, string | number | boolean>) {
    const yElement: Y.Text = sharedType.toDelta() && sharedType.toDelta().length > elementIndex && sharedType.toDelta()[elementIndex].insert ? sharedType.toDelta()[elementIndex].insert : null;
    if (yElement) {

        console.debug("Changing attribute of YJS Doc Element " + elementIndex + ", attrs ", attributes);
        Y.transact(sharedType.doc, () => {
            attributes.forEach((value, attributeName) => {
                if (value != null)
                    yElement.setAttribute(attributeName, value);
                else
                    yElement.removeAttribute(attributeName);
            });
        });
    }
};

export function initializeSharedTypeFromOctopusScript(sharedType: Y.XmlText, octopusScript: OctopusScript) {

    let slateScript = mapOctopusScriptToSlateScript(octopusScript);
    const yJSScriptDeltas = mapSlateScriptToInsertDeltas(slateScript as SlateScript);
    console.info("Initially calculated insert deltas are:", yJSScriptDeltas);
    sharedType.applyDelta(yJSScriptDeltas);
}

/**
 * 
 * @param sharedType 
 * @param changeArray 
 */
export function updateSharedTypeFromAS(sharedType: Y.XmlText, changeArray: []) {
    Y.applyUpdate(sharedType.doc, arrayToUint8Array(changeArray));
}
