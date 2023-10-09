export function uint8ArrayToArray(arr: Uint8Array) {
    const retVal = [];
    arr.forEach((val, i) => { retVal[i] = val });
    return retVal;
}

export function arrayToUint8Array(arr: []): Uint8Array {
    const retVal: Uint8Array = new Uint8Array(arr);
    return retVal;
}