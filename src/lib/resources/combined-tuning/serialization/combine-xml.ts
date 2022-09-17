import { XmlDocumentNode, XmlElementNode } from "@s4tk/xml-dom";
import { RecycledNodeRef, RecycledNodesCache } from "@s4tk/xml-dom/lib/types";
import XmlResource from "../../xml/xml-resource";

/**
 * Combines the given tunings into one combined tuning document.
 * 
 * @param tunings List of tunings to combine
 * @param group Group of tunings
 * @param refSeed Seed to use for reference IDs
 */
export default function combineTunings(
  tunings: XmlResource[],
  group: number,
  refSeed: bigint
): XmlDocumentNode {
  refSeed = resolveRefSeed(group, refSeed);
  const documents: XmlDocumentNode[] = [];
  let recylingCache: RecycledNodesCache;

  tunings.forEach(tuning => {
    const result = XmlDocumentNode.fromRecycled(tuning.content, {
      ignoreComments: true,
      recycledNodesCache: recylingCache,
      recycledNodesSeed: refSeed
    });

    documents.push(result.doc);
    recylingCache = result.recyclingCache;
  });

  return createCombinedDocument(documents, recylingCache);
}

//#region Helpers

function resolveRefSeed(
  group: number,
  refSeed: bigint
): bigint {
  if (refSeed <= 256_000_000)
    throw new Error("Reference seed must be greater than 256 million.");
  refSeed *= 0x00000100000001B3n; // fnv64 prime
  refSeed %= 0x10000000000000000n; // fnv64 max
  refSeed ^= BigInt(group);
  refSeed <<= 18n; // reserve 18 bits for 262,144 nodes
  refSeed &= 0xFFFFFFFFFFFFFFFFn; // keep at 64 bits
  return refSeed;
}

function createCombinedDocument(
  documents: XmlDocumentNode[],
  recyclingCache: RecycledNodesCache
): XmlDocumentNode {
  const nodesToAbstract: RecycledNodeRef<XmlElementNode>[] = [];
  recyclingCache.elements.forEach(nodeRef => {
    if (nodeRef.refs > 1) {
      if (nodeRef.node.tag !== "T" && nodeRef.node.tag !== "E") {
        nodesToAbstract.push(nodeRef);
      } else if (nodeRef.node.innerValue && Buffer.byteLength(nodeRef.node.innerValue as string) > 20) {
        nodesToAbstract.push(nodeRef);
      }
    }
  });

  const gNode = new XmlElementNode({
    tag: "g",
    attributes: {
      s: "merged"
    }
  });

  nodesToAbstract.forEach(nodeRef => {
    const childClone = new XmlElementNode({
      tag: nodeRef.node.tag,
      attributes: Object.assign({}, nodeRef.node.attributes),
      children: nodeRef.node.children // intentionally not cloned
    });

    // FIXME: make sure names aren't repeated

    delete childClone.attributes.n;
    childClone.attributes.x = nodeRef.id;
    gNode.addChildren(childClone);
  });

  nodesToAbstract.forEach(({ node, id }) => {
    node.tag = "r";
    node.children = [];
    for (const attrKey in node.attributes)
      if (attrKey !== "n") delete node.attributes[attrKey];
    node.attributes.x = id;
  });

  const combinedTuningDoc = new XmlDocumentNode(new XmlElementNode({
    tag: "combined",
    children: [gNode]
  }));

  const typeMap = new Map<string, XmlElementNode[]>();
  documents.forEach(doc => {
    const type = doc.child.attributes.i ?? "tun";
    if (!typeMap.has(type)) typeMap.set(type, []);
    const docArr = typeMap.get(type);
    docArr.push(doc.child as XmlElementNode);
  });

  typeMap.forEach((docs, type) => {
    const rNode = new XmlElementNode({
      tag: "R",
      attributes: {
        n: type
      },
      children: docs
    });

    combinedTuningDoc.child.addChildren(rNode);
  });

  return combinedTuningDoc;
}

//#endregion Helpers
