import * as Y from "yjs";

const docs = new Map<string, Y.Doc>();
const refCounts = new Map<string, number>();

export function getYDoc(roomId: string): Y.Doc {
  let doc = docs.get(roomId);
  if (!doc) {
    doc = new Y.Doc();
    docs.set(roomId, doc);
    refCounts.set(roomId, 0);
  }
  refCounts.set(roomId, (refCounts.get(roomId) ?? 0) + 1);
  return doc;
}

export function releaseYDoc(roomId: string): void {
  const count = (refCounts.get(roomId) ?? 1) - 1;
  if (count <= 0) {
    const doc = docs.get(roomId);
    doc?.destroy();
    docs.delete(roomId);
    refCounts.delete(roomId);
  } else {
    refCounts.set(roomId, count);
  }
}

export function getFileText(doc: Y.Doc, fileId: string): Y.Text {
  return doc.getText(fileId);
}
