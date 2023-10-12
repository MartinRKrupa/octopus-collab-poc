import {Editor, Range} from 'slate';

/**
 * Shows/hides current plus button at the position of a caret
 * @param show - wheether show or hide 
 * @param plusRef - reference to plus button.
 */

export function togglePlusButton(show: boolean, plusRef) {
    const plusElem = plusRef;

    if (show) {
        const selObj = window.getSelection();
        const selRange = selObj.getRangeAt(0);
        const boundingRect = selRange.getBoundingClientRect();
        plusElem.style.left = plusElem.parentElement.offsetLeft + "px";
        plusElem.style.top = boundingRect.top + boundingRect.height + "px";
        plusElem.style.display = "block";
    }
    else plusElem.style.display = "none";
}

/**
 * This function calculates whether a plus button should be shown under cursor ... it should can be called on every KEY UP
 * @param editor 
 * @param selection 
 * @returns 
 */
export function shouldPlusButtonShow(editor, selection):boolean {
    // Get start and end, modify it as we move along.
    if (!selection)
        return false;

    let [start, end] = Range.edges(selection);
    // Move forward along until I hit a different tree depth
    const after = Editor.after(editor, end, {
        unit: 'character',
    });
    
    const charAfter = after && Editor.string(editor, { anchor: end, focus: after });
    const afterIsOK = (!after || (after && charAfter && charAfter.length && charAfter == '\n'));

    // Move backwards
    const before = Editor.before(editor, start, {
        unit: 'character',
    });

    const charBefore = before && Editor.string(editor, { anchor: before, focus: start });
    const beforeIsOk = (!before || before && charBefore && charBefore.length && charBefore[0] == '\n');

    return beforeIsOk && afterIsOK;
}