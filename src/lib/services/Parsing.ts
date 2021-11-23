// import type { Tag } from "../models/tunables/TunableNodes";


// const parser = new XMLParser({
//   ignoreAttributes: false,
//   attributeNamePrefix: "",
//   commentPropName: "#comment",
//   preserveOrder: true,
//   textNodeName: "#value"
// });

// interface XMLNode {
//   tag?: Tag;
//   isComment?: boolean;
//   attrs?: { [key: string]: string; };
//   children: XMLNode[];
// }

// /**
//  * Converts a node from fast-xml-parser into one that can be used in tuning.
//  * 
//  * @param fxpNode FXP node to convert
//  */
// function convertFXP(fxpNode: object): XMLNode {
//   const node: XMLNode = { children: [] };

//   for (const key in fxpNode) {
//     switch (key) {
//       case "attributes":
//         node.attrs = fxpNode[key] as { [key: string]: string; };
//         break;
//       case "#value":
//         return fxpNode[key];
//       case "#comment":
//         node.isComment = true;
//         node.children.push(convertFXP(fxpNode[key][0]));
//         return node;
//       default:
//         node.tag = key as Tag;
//     }
//   }

//   fxpNode[node.tag].forEach((childNode: object) => {
//     node.children.push(convertFXP(childNode));
//   });

//   return node;
// }

// /**
//  * Parses an XML string into data that can be loaded into tuning.
//  * 
//  * @param xml XML string to parse
//  */
// export function parseXML(xml: string): XMLNode[] {
//   const nodes: object[] = parser.parse(xml); // will return an array
//   return nodes.map(convertFXP);
// }
