import { XmlDocumentNode, XmlNode } from "@s4tk/xml-dom";
import type { XmlExtractionOptions } from "../../../common/options";
import XmlResource from "../../xml/xml-resource";

/**
 * TODO:
 * 
 * @param dom TODO:
 * @param options TODO:
 */
export default function extractTuningFromCombinedXml(
  dom: XmlDocumentNode,
  options?: XmlExtractionOptions
): XmlResource[] {
  const root = dom.child;
  if (root.tag !== "combined")
    throw new Error(`Exected root node to have tag <combined>, but got ${root.tag}`);

  // index nodes
  const nodeIndex = new Map<string, XmlNode>();
  const gNode = root.children.find(child => child.tag === "g");
  if (!gNode) throw new Error("Expected combined tuning to have a <g> node.");
  gNode.children.forEach(child => {
    nodeIndex.set(child.attributes.x, child);
    delete child.attributes.x;
  });

  function resolveNode(node: XmlNode): XmlNode {
    node.children?.forEach((child, i) => {
      if (child.tag === "r") {
        let ref = nodeIndex.get(child.attributes.x);

        if (child.name) {
          ref = ref.clone();
          ref.name = child.name;
        }

        node.children[i] = ref; // FIXME: is this safe?
      } else {
        resolveNode(child);
      }
    });

    return node;
  }

  // resolve indexed nodes
  gNode.children.forEach(resolveNode);

  // extract tunings
  const extractedTuning: XmlResource[] = [];
  root.children.filter(child => child.tag === "R").forEach(resTypeNode => {
    const resType = resTypeNode.name;
    if (!resType) throw new Error(`Expected <R> node to have an "n" attribute.`);
    const resources = resTypeNode.children.map(node =>
      new XmlResource(new XmlDocumentNode(resolveNode(node))));
    extractedTuning.push(...resources);
  });

  return extractedTuning;
}
