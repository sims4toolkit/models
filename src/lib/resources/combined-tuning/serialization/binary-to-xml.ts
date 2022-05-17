import { BinaryDecoder } from "@s4tk/encoding";
import { XmlDocumentNode, XmlElementNode, XmlNode, XmlValueNode } from "@s4tk/xml-dom";
import { readUntilFalsey } from "../../../common/helpers";
import { XmlExtractionOptions } from "../../../common/options";
import { BinaryDataResourceDto } from "../../abstracts/data-resource";

//#region Types & Interfaces

const RELOFFSET_NULL = -0x80000000;

type CombinedTuningTables = [
  { // 0 - meta data
    mRow: PackedXmlDocument[];
  },
  { // 1 - nodes
    mRow: PackedXmlNode[];
  },
  { // 2 - attrs
    mRow: PackedXmlAttributes[];
  },
  { // 3 - node refs
    mValue: DataOffsetObject[];
  },
  { // 4 - attr refs
    mValue: DataOffsetObject[];
  },
  { // 5 - string refs
    mValue: DataOffsetObject[];
  },
  { // 6 - characters
    mValue: string[];
  }
];

interface DataOffsetObject {
  /** Index from which relative offset is defined. */
  startof_mDataOffset: number; // uint32

  /** Relative offset to data. */
  mDataOffset: number; // int32
}

interface PackedXmlDocument {
  /** Offset to first node that is an element. All nodes before it are text. */
  first_element: DataOffsetObject;

  /** Offset to element node that is at the top of the tree. */
  top_element: DataOffsetObject;

  /** Number of element nodes. */
  element_count: DataOffsetObject;

  /** Offset to string table. */
  string_table: {
    startof_mDataOffset: number;
    mDataOffset: number;
    mCount: number;
  };
}

interface PackedXmlNode {
  /** Index of string in table 5. */
  text: number; // uint32

  /** Offset to first attr pair in table 4. */
  attrs: DataOffsetObject;

  /** Offset to first child node in table 3. */
  children: DataOffsetObject;
}

interface PackedXmlAttributes {
  /** Index of string in table 5.  */
  value: number; // uint32

  /** Index of string in table 5.  */
  name: number; // uint32
}

//#endregion Types & Interfaces

//#region Helpers

/**
 * Returns true if the given ref is null.
 * 
 * @param ref Object to check if null
 */
function isNull(ref: DataOffsetObject): boolean {
  return ref.mDataOffset === RELOFFSET_NULL;
}

/**
 * Returns an absolute position from a relative offset object. If the offset
 * if RELOFFSET_NULL, then RELOFFSET_NULL is returned.
 * 
 * @param ref Object to get position of
 */
function getPosition(ref: DataOffsetObject): number {
  if (isNull(ref)) return RELOFFSET_NULL;
  return ref.mDataOffset + ref.startof_mDataOffset;
}

//#endregion Helpers

/**
 * Converts a binary DATA model into combined tuning XML.
 * 
 * @param binaryModel Parsed binary model
 * @param buffer Original buffer containing the binary data
 */
export default function convertCombinedBinaryToXml(
  binaryModel: BinaryDataResourceDto,
  buffer: Buffer,
  options?: XmlExtractionOptions
): XmlDocumentNode {
  //#region Variables

  const decoder = new BinaryDecoder(buffer);

  const [
    metaTable,
    nodeTable,
    attrTable,
    nodeRefsTable,
    attrRefsTable,
    stringRefsTable,
    // intentionally excluding string table
  ] = binaryModel.mTableData as CombinedTuningTables;

  const {
    first_element,
    top_element,
    // intentionally excluding element_count & string_table
  } = metaTable.mRow[0];

  const firstElementPosition = getPosition(first_element);

  // maps table indices to their starting index
  const tableDataOffsets: number[] = [];
  binaryModel.mTable.forEach(table => {
    const position = table.startof_mnRowOffset + table.mnRowOffset;
    const padding = -position & 15;
    tableDataOffsets.push(position + padding);
  });

  //#endregion Variables

  //#region Functions

  function rowIndexAt(position: number, tableIndex: number) {
    const tableStart = tableDataOffsets[tableIndex];
    const tableInfo = binaryModel.mTable[tableIndex];
    return (position - tableStart) / tableInfo.mnRowSize;
  }

  function getText(textRow: number): string {
    const textRef = stringRefsTable.mValue[textRow];
    return decoder.savePos<string>(() => {
      decoder.seek(getPosition(textRef));
      return decoder.string();
    });
  }

  function getAttributes(firstAttrPosition: number): { [key: string]: string; } {
    const result: { [key: string]: string; } = {};

    readUntilFalsey(
      attrRefsTable.mValue,
      rowIndexAt(firstAttrPosition, 4),
      ref => !isNull(ref)
    ).forEach(attrData => {
      const attrPosition = getPosition(attrData);
      const rowIndex = rowIndexAt(attrPosition, 2);
      const { name, value } = attrTable.mRow[rowIndex];
      result[getText(name)] = getText(value);
    });

    return result;
  }

  function readChildren(firstChildPosition: number): XmlNode[] {
    return readUntilFalsey(
      nodeRefsTable.mValue,
      rowIndexAt(firstChildPosition, 3),
      ref => !isNull(ref)
    ).map(childData => {
      const childPosition = getPosition(childData);
      return readNodeAndChildren(childPosition);
    });
  }

  function readNodeAndChildren(position: number): XmlNode {
    let nodeData = nodeTable.mRow[rowIndexAt(position, 1)];
    let text = getText(nodeData.text);

    if (isNull(nodeData.attrs) && isNull(nodeData.children)) {
      if (position >= firstElementPosition)
        return new XmlElementNode({ tag: text });

      if (options?.commentMap?.has(text))
        // FIXME: use an actual comment node
        text += `<!--${options.commentMap.get(text)}-->`;

      return new XmlValueNode(text);
    }

    const nodeArguments: {
      tag: string;
      attributes?: { [key: string]: string; };
      children?: XmlNode[];
    } = { tag: text };

    if (!isNull(nodeData.attrs))
      nodeArguments.attributes = getAttributes(getPosition(nodeData.attrs));

    if (!isNull(nodeData.children))
      nodeArguments.children = readChildren(getPosition(nodeData.children));

    return new XmlElementNode(nodeArguments);
  }

  //#endregion Functions

  const root = readNodeAndChildren(getPosition(top_element));
  return new XmlDocumentNode(root);
}
