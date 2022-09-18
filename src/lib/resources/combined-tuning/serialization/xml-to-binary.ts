import { BinaryEncoder } from "@s4tk/encoding";
import { XmlDocumentNode, XmlElementNode, XmlNode } from "@s4tk/xml-dom";
import { Attributes } from "@s4tk/xml-dom/lib/types";
import DataType from "../../../enums/data-type";

//#region Types

type IndexOffsetTuple = [number, number];
type NameValueIndicesTuple = [number, number];
type RefIndicesTable = number[][];
type TextAttrsChildIndicesTuple = [number, number, number];

interface ConstantTableInfo {
  relativeNameOffset: number;
  nameHash: number;
  relativeSchemaOffset: number;
  dataType: DataType;
  rowSize: number;
}

//#endregion Types

//#region Constants

// This string contains the base-64 encoded data for the schemas, columns, and
// string table portion that is common to every binary combined tuning. Yes,
// this is fragile and dumb. But, it's faster and easier than generating these
// buffers programmatically, which would provide the same result.
const SCHEMA_STBL = "/AAAAPNPtCiAkDDRFAAAADgAAAAEAAAANQEAAOR6u/gytrkLDAAAAHAAAAADAAAAQAEAAOASDEeytoqfCAAAAJQAAAACAAAA4AAAAKtDsQEHAAAACAAAAAAAAICyAAAAnPjYfA0AAAAAAAAAAAAAgKwAAAAHr9iBDQAAAAQAAAAAAACAsgAAADtdCKgOAAAADAAAAAAAAIDOAAAA6Be8mQ0AAAAIAAAAAAAAgK8AAAA4+iuxBwAAAAAAAAAAAACAoAAAACslGcgNAAAABAAAAAAAAIC0AAAA3GPtKAcAAAAEAAAAAAAAgJsAAAD0O4svBwAAAAAAAAAAAACAUGFja2VkWG1sRG9jdW1lbnQAZmlyc3RfZWxlbWVudAB0b3BfZWxlbWVudABlbGVtZW50X2NvdW50AHN0cmluZ190YWJsZQBkb2N1bWVudHMAUGFja2VkWG1sTm9kZQB0ZXh0AGF0dHJzAGNoaWxkcmVuAABQYWNrZWRYbWxBdHRyaWJ1dGUAbmFtZQB2YWx1ZQAAAAAA";
const STBL_OFFSET = 252;
const RELOFFSET_NULL = -0x80000000;
const EMPTY_STRING_HASH = 2166136261;
const EMPTY_LIST = [];

const CONSTANT_TABLE_INFO: ConstantTableInfo[] = [
  { // 0
    relativeNameOffset: 0x143,
    nameHash: 3468580057,
    relativeSchemaOffset: 0,
    dataType: DataType.Object,
    rowSize: 20
  },
  { // 1
    relativeNameOffset: 0x16F,
    nameHash: EMPTY_STRING_HASH,
    relativeSchemaOffset: 24,
    dataType: DataType.Object,
    rowSize: 12
  },
  { // 2
    relativeNameOffset: 0x18E,
    nameHash: EMPTY_STRING_HASH,
    relativeSchemaOffset: 48,
    dataType: DataType.Object,
    rowSize: 8
  },
  { // 3
    relativeNameOffset: 0x18F,
    nameHash: EMPTY_STRING_HASH,
    relativeSchemaOffset: RELOFFSET_NULL,
    dataType: DataType.Object,
    rowSize: 4
  },
  { // 4
    relativeNameOffset: 0x190,
    nameHash: EMPTY_STRING_HASH,
    relativeSchemaOffset: RELOFFSET_NULL,
    dataType: DataType.Object,
    rowSize: 4
  },
  { // 5
    relativeNameOffset: 0x191,
    nameHash: EMPTY_STRING_HASH,
    relativeSchemaOffset: RELOFFSET_NULL,
    dataType: DataType.String,
    rowSize: 4
  },
  { // 6
    relativeNameOffset: RELOFFSET_NULL,
    nameHash: EMPTY_STRING_HASH,
    relativeSchemaOffset: RELOFFSET_NULL,
    dataType: DataType.Character,
    rowSize: 1
  },
];

//#endregion Constants

//#region Helpers

const getAttrKeyString = (pair: NameValueIndicesTuple) => `${pair[0]}=${pair[1]}`;
const getPaddingForAlignment = (index: number, mask: number) => -index & mask;

//#endregion Helpers

/**
 * TODO:
 * 
 * @param dom TODO:
 */
export default function combinedXmlToBinary(dom: XmlDocumentNode): Buffer {
  //#region Variables

  // tables 5 & 6 (referenced by 1 & 2)
  let stringsCount = 0;
  let stringsByteLength = 0;
  const stringMap = new Map<string, IndexOffsetTuple>();

  // table 2 (referenced by 4)
  const attrPairsTable: NameValueIndicesTuple[] = [];
  const attrPairsIndexMap = new Map<string, number>();

  // table 4 (referenced by 1)
  let attrListsTableLength = 0;
  const attrListsTable: RefIndicesTable = [];
  const attrListsIndexMap = new Map<string, number>();

  // table 1 (referenced by 3)
  const valueNodesTable: number[] = [];
  const valueNodesIndexMap = new Map<string, number>();
  const elementNodesTable: TextAttrsChildIndicesTuple[] = [];
  const elementNodesIndexMap = new Map<string, number>();

  // table 3 (referenced by 1)
  let childNodesTableLength = 0;
  const childNodesTable: RefIndicesTable = [];
  const childNodesIndexMap = new Map<string, number>();

  //#endregion Variables

  //#region Functions

  /**
   * Adds the given string to stringMap, if it doesn't already exist, and
   * returns a tuple containing its index in table 5 and offset in table 6. The
   * offset into table 6 is relative to the starting index of table 6.
   * 
   * @param string String to process
   * @returns Tuple containing index in table 5 and offset in table 6
   */
  function addToStringMap(string: string): IndexOffsetTuple {
    if (stringMap.has(string)) return stringMap.get(string);
    const value: IndexOffsetTuple = [stringsCount++, stringsByteLength];
    stringMap.set(string, value);
    stringsByteLength += Buffer.byteLength(string) + 1;
    return value;
  }

  /**
   * Adds the given attributes to maps for tables 2 and 4, and returns a string
   * that represents the concatenation of them. This string is the same one
   * used as a key in `attrListsIndexMap`.
   * 
   * @param attrs Attributes to process
   * @returns String that uniquely identifies the set of attributes
   */
  function addToAttrMap(attrs: Attributes): string {
    const allAttrKeys: string[] = [];

    // attr pairs - building table 2
    for (const name in attrs) {
      const value = attrs[name];
      const [nameIndex] = addToStringMap(name);
      const [valueIndex] = addToStringMap(value);
      const nameValuePair: NameValueIndicesTuple = [nameIndex, valueIndex];
      const key = getAttrKeyString(nameValuePair);
      allAttrKeys.push(key);
      if (!attrPairsIndexMap.has(key)) {
        attrPairsIndexMap.set(key, attrPairsTable.length);
        attrPairsTable.push(nameValuePair);
      }
    }

    // attr lists - building table 4
    allAttrKeys.sort(); // order doesn't matter, might as well save space
    const attrListKey = allAttrKeys.join(",");
    if (!attrListsIndexMap.has(attrListKey)) {
      attrListsIndexMap.set(attrListKey, attrListsTableLength);
      const attrIndexList = allAttrKeys.map(key => attrPairsIndexMap.get(key));
      attrListsTable.push(attrIndexList);
      attrListsTableLength += attrIndexList.length + 1; // +1 for null
    }

    return attrListKey;
  }

  /**
   * Processes a node, which is either an element or a value. If it's a value,
   * the value is guaranteed to be a string and it will be added to the string
   * map. If it's an element, its tag and attributes will be added to the string
   * map, and its children will be recursively processed.
   * 
   * Its index will be returned. If it is a value node, the index will be its
   * exact position in table 1. If it is an element node, the index will be
   * relative to the position of the first element, which is equal to the
   * number of value nodes.
   * 
   * @param node Node to process
   * @returns Node's index (may or may not be relative)
   */
  function processNodeAndChildren(node: XmlNode): number {
    if (node.tag) { // element node
      const [tagIndex] = addToStringMap(node.tag);

      const attrListKey = addToAttrMap(node.attributes);

      const childrenIndices = node.hasChildren
        // don't sort, child order matters
        ? node.children.map(processNodeAndChildren)
        : EMPTY_LIST;

      const childrenKey = childrenIndices.join(",");

      if (!childNodesIndexMap.has(childrenKey)) {
        childNodesTable.push(childrenIndices);
        childNodesIndexMap.set(childrenKey, childNodesTableLength);
        childNodesTableLength += childrenIndices.length + 1; // +1 for null
      }

      const nodeKey = `${node.tag};${attrListKey};${childrenKey}`;

      if (!elementNodesIndexMap.has(nodeKey)) {
        elementNodesTable.push([
          tagIndex,
          attrListsIndexMap.get(attrListKey),
          childNodesIndexMap.get(childrenKey)
        ]);

        elementNodesIndexMap.set(nodeKey, elementNodesIndexMap.size);
      }

      return elementNodesIndexMap.get(nodeKey);
    } else { // value node (guaranteed to be string)
      const [valueIndex] = addToStringMap(node.value as string);

      if (!valueNodesIndexMap.has(node.value as string)) {
        valueNodesTable.push(valueIndex);
        valueNodesIndexMap.set(node.value as string, valueNodesIndexMap.size);
      }

      return valueNodesIndexMap.get(node.value as string);
    }
  }

  //#endregion Functions

  //#region Preparing for Buffers

  const topElementRelativeIndex = processNodeAndChildren(dom.child);

  const tableStartingIndices: number[] = [];
  const tableLengths: number[] = (() => {
    let currentIndex = 240;
    const tableLengths: number[] = [];

    const nextLength = (length: number) => {
      tableStartingIndices.push(currentIndex);
      currentIndex += length;
      const padding = getPaddingForAlignment(currentIndex, 15);
      currentIndex += padding;
      tableLengths.push(length + padding);
    };

    nextLength(20); // 0
    nextLength((valueNodesTable.length + elementNodesTable.length) * 12); // 1
    nextLength(attrPairsTable.length * 8); // 2
    nextLength(childNodesTableLength * 4); // 3
    nextLength(attrListsTableLength * 4); // 4
    nextLength(stringsCount * 4); // 5
    nextLength(stringsByteLength); // 6

    return tableLengths;
  })();

  const metaData = {
    firstElement: 0, // FIXME:
    topElement: 0, // FIXME:
    elementCount: elementNodesTable.length,
    stringTable: {
      offset: 0, // FIXME:
      count: stringsCount
    }
  };

  //#endregion Preparing for Buffers

  //#region Buffer Generation

  const schemaStblBuffer = Buffer.from(SCHEMA_STBL, "base64");

  const tableDataBuffer = (() => {
    const bufferLength = tableLengths.reduce((sum, n) => sum + n, 0);
    const encoder = BinaryEncoder.alloc(bufferLength);

    // TODO: implement

    return encoder.buffer;
  })();

  const tableInfoBuffer = (() => {
    const encoder = BinaryEncoder.alloc(208); // 7 infos * 28 bytes + 12 padding

    // TODO: implement

    return encoder.buffer;
  })();

  const headerBuffer = (() => {
    const encoder = BinaryEncoder.alloc(32);
    encoder.charsUtf8("DATA"); // magic
    encoder.uint32(0x101); // version
    encoder.int32(24); // table offset
    encoder.int32(7); // num tables
    encoder.int32(encoder.tell() + tableInfoBuffer.length + tableDataBuffer.length); // schema offset
    encoder.int32(3); // num schemas
    encoder.uint32(0xFFFFFFFF); // unused
    // last 4 bytes intentionally blank
    return encoder.buffer;
  })();

  //#endregion Buffer Generation

  return Buffer.concat([
    headerBuffer,
    tableInfoBuffer,
    tableDataBuffer,
    schemaStblBuffer
  ]);
}
