import * as Y from 'yjs'

export function testYJS(){
    // Yjs documents are collections of
    // shared objects that sync automatically.
    const ydoc = new Y.Doc()
    console.log("YJS Doc A created");
    // Define a shared Y.Map instance
    const ymap = ydoc.getMap()
    ymap.set('keyA', 'valueA')
    console.log("YJS keyA set to ValA");
    console.log(ymap.toJSON());

    // Create another Yjs document (simulating a remote user)
    // and create some conflicting changes
    const ydocRemote = new Y.Doc()
    console.log("YJS Doc B created");

    const ymapRemote = ydocRemote.getMap()
    ymapRemote.set('keyB', 'valueB')
    console.log("YJS keyB set to ValB");
    console.log(ymapRemote.toJSON());

    // Merge changes from remote
    const update = Y.encodeStateAsUpdate(ydocRemote)
    Y.applyUpdate(ydoc, update)
    console.log("Docs A and B were merged");

    // Observe that the changes have merged
    console.log(ymap.toJSON()) // => { keyA: 'valueA', keyB: 'valueB' }
}