import * as Y from 'yjs';
import { OctopusScript, OctopusScriptElement, OctopusScriptParagraph} from '../types/OctopusScript';
import { arrayToUint8Array } from '../utils/Uint8ArrayUtils';
import { mapOctopusParagraphToSlateElement, mapOctopusScriptElementToSlateScriptElement, mapOctopusScriptToSlateScript } from '../mappers/SlateScriptMapper';
import { SlateParagraph, SlateScript, SlateScriptElement } from '../types/SlateScript';
import { mapObjectToXMLText, mapSlateScriptToInsertDeltas } from '../mappers/YJSScriptMapper';

/**
 * According to provided elementIndex and eventually a paragraphIndex, returns a sharedType's Y.XMLText object of either SlateScriptElement or SlateParagraph. 
 * It's a helper function used to execute further change operations on the Y.XMLText object
 * @param sharedType - YJS Document carrying Slate's Document encoded as Y.XMLText  
 * @param elementIndex - index of element to look for in the sharedType 
 * @param paragraphIndex - index of paragraph within the element to look for in the sharedType
 * @returns - Y.XMLText of a Paragraph if elementIndex and paragraphIndex were provided. If only elementIndex was provided, then Y.XMLText of an Element is returned 
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
 * Adds a character/string onto a given position
 * @param sharedType - YJS Document carrying Slate's Document encoded as Y.XMLText  
 * @param elementIndex - 0 based index of afffected script element
 * @param paragraphIndex - 0 based index of afffected script paragraph
 * @param position - 0 based index of position within the paragraph's text onto which character would be inserted
 * @param character - character/string to insert
 * @param format - Object of any attributes and their values to be applied to the text paragraph. e.g {bold:true}
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
 * Sets attributes of a script's paragraph. This is a Slate document, so it's not intended for the Text nodes if text paragragraphs. For formatting the text use formatRange function
 * @param sharedType - YJS Document carrying Slate's Document encoded as Y.XMLText 
 * @param elementIndex - 0 based index of afffected script element
 * @param paragraphIndex - 0 based index of afffected script paragraph
 * @param attributes - Map of <name=>value> name of the attribute to set / remove. If value is null, the attibute is removed.
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
 * Formats a text node (or a part of it) in a text Paragraph
 * @param sharedType - YJS Document carrying Slate's Document encoded as Y.XMLText 
 * @param elementIndex - 0 based index of afffected script element
 * @param paragraphIndex - 0 based index of afffected script paragraph
 * @param position - 0 based index of position within the paragraph's text from which format would be applied 
 * @param length - number of characters in the paragraph onto which format would be applied starting at the position
 * @param format - Object of any attributes and their values to be applied to the text paragraph. e.g {bold:true}
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
 * Deletes an element from a shared type
 * @param sharedType - YJS Document carrying Slate's Document encoded as Y.XMLText 
 * @param elementIndex - 0 based index of afffected script element
 */
export function deleteElement(sharedType: Y.XmlText, elementIndex: number) {
    //The element are then the top level deltas.
    if (sharedType.length > elementIndex) {
        console.debug("Removing Element from YJS Doc" + elementIndex);
        sharedType.delete(elementIndex, 1);
    }
};

/**
 * Deletes character(s) from a text node of a text paragraph
 * @param sharedType - YJS Document carrying Slate's Document encoded as Y.XMLText 
 * @param elementIndex - 0 based index of afffected script element
 * @param paragraphIndex - 0 based index of afffected script paragraph
 * @param position -  0 based index of position within the paragraph's text from which the delete starts 
 * @param length - number of characters in the paragraph to remove from the position
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

/**
 * Deletes a paragraph from an element of a sharedObject
 * @param sharedType - YJS Document carrying Slate's Document encoded as Y.XMLText 
 * @param elementIndex - 0 based index of afffected script element
 * @param paragraphIndex - 0 based index of afffected script paragraph
 */
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
 * Transforms Octopus Element into Slate's Element and inserts it into YJS Document as a change
 * @param sharedType - YJS Document carrying Slate's Document encoded as Y.XMLText 
 * @param element - Octopus Script Element Object
 * @param index - position to insert an element onto - a 0 - based index
 */
export function addElement(sharedType: Y.XmlText, element: OctopusScriptElement, index: number) {
    const yElement: Y.XmlText = new Y.XmlText();
    Object.keys(element).forEach((key) => {
        yElement.setAttribute(key, element[key]);
    });
    
    let slateElement: SlateScriptElement = mapOctopusScriptElementToSlateScriptElement(element);    
    sharedType.applyDelta([{retain: index}, { insert: mapObjectToXMLText(slateElement) }]);
};

/**
 * Transforms Octopus Paragraph into Slate's Paragraph and inserts it into YJS Document as a change
 * @param sharedType - YJS Document carrying Slate's Document encoded as Y.XMLText 
 * @param elementIndex - 0 based index of afffected script element
 * @param paragraph -Object of  Octopus Script Paragraph to insert 
 * @param index - position to insert an paragraph into within an element - a 0 - based index
 */
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
 * Sets attributes of a script's element.
 * @param sharedType - YJS Document carrying Slate's Document encoded as Y.XMLText 
 * @param elementIndex - 0 based index of afffected script element
 * @param attributes - Map of <string, string | number | boolean> for attributes and their values to be set on the element. If value is null, the attribute is removed.
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

/**
 * Transforms Octopus Script into Slate's Script and inserts it into YJS Document as a change
 * @param sharedType - YJS Document carrying Slate's Document encoded as Y.XMLText 
 * @param octopusScript - Object of  Octopus Script to insert 
 */
export function initializeSharedTypeFromOctopusScript(sharedType: Y.XmlText, octopusScript: OctopusScript) {

    let slateScript = mapOctopusScriptToSlateScript(octopusScript);
    const yJSScriptDeltas = mapSlateScriptToInsertDeltas(slateScript as SlateScript);
    console.info("Initially calculated insert deltas are:", yJSScriptDeltas);
    sharedType.applyDelta(yJSScriptDeltas);
}

/**
 * Applies updates retrieved from the outside world onto the shared YJS Document
 * @param sharedType - YJS Document carrying Slate's Document encoded as Y.XMLText 
 * @param changeArray - byte array carrying the changes. See https://docs.yjs.dev/api/document-updates 
 */
export function updateSharedTypeFromAS(sharedType: Y.XmlText, changeArray: []) {
    Y.applyUpdate(sharedType.doc, arrayToUint8Array(changeArray));
}
