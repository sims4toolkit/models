import { BinaryEncoder, BinaryDecoder } from "@s4tk/encoding";
import { XmlDocumentNode, XmlElementNode, XmlNode, XmlValueNode } from "@s4tk/xml-dom";
import { readUntilFalsey } from "../../../common/helpers";
import { XmlExtractionOptions } from "../../../common/options";
import { BinaryDataResourceDto } from "../../abstracts/data-resource";
import XmlResource from "../../xml/xml-resource";

/*
' SCUMBUMBO'S NOTES FROM XML EXTRACTOR:
'
' Table 0 stores the basic info for the packed xml document
' Table 1 stores a list of nodes
'    - nodes prior to the the first_element are text
'    - the remaining nodes are xml tags
'    - mValue(0) = offset into child nodes (table 3)
'    - mValue(1) = row number to get text (via table 5)
'    - mValue(2) = offset into attribute nodes (table 4)
' Table 2 stores a list of row numbers storing attribute value,name pairs (via table 5)
' Table 3 stores a list of child nodes
'    - these are offsets back into table 1
'    - a RELOFFSET_NULL offset indicates the end of this node's children
' Table 4 stores a list of attributes
'    - these are offsets into table 2
'    - a RELOFFSET_NULL offset indicates the end of this node's attributes
' Table 5 stores a list of offsets pointing to the actual string data (table 6)
' Table 6 stores a list of null terminated strings
'
' Offsets are not calculated from a fixed position, but are offsets
' from the current file position.
*/

//#region Interfaces

interface DataOffsetObject {
  mDataOffset: number; // int32
}

interface PackedXmlNode {
  /** Reference to text for node. Relative offset into table 5. */
  text: number; // uint32, but parse as int32

  /** Reference for attrs of node. Relative offset into table 4. */
  attrs: DataOffsetObject;

  /** Reference for children of node. Fixed index in table 3. */
  children: DataOffsetObject;
}

interface PackedXmlAttributes {
  /** Reference to string for attr value. Fixed index in table 5.  */
  value: number; // uint32

  /** Reference to string for attr name. Fixed index in table 5.  */
  name: number; // uint32
}

//#endregion Interfaces

/**
 * TODO:
 * 
 * @param binaryModel TODO:
 * @param buffer TODO:
 */
export default function convertCombinedBinaryToXml(
  binaryModel: BinaryDataResourceDto,
  buffer: Buffer,
): XmlDocumentNode {
  const decoder = new BinaryDecoder(buffer);
  const RELOFFSET_NULL = -0x80000000; // sometimes it'll be positive

  const [
    metaDataTable,         // 0 - meta data
    nodeObjectsTable,      // 1 - actual node objects
    attributeObjectsTable, // 2 - actual attributes data
    nodeRefsTable,         // 3 - offsets to node objects (for listing)
    attributeRefsTable,    // 4 - offsets to attribute objects (for listing)
    stringRefsTable,       // 5 - offsets to null-terminated strings (for listing)
    stringObjectsTable     // 6 - actual null-terminated strings
  ] = binaryModel.mTableData;

  const {
    first_element, // index in table 1 (nodeObjectsTable)
    top_element,   // ?
    element_count, // ?
    string_table   // ?
  } = metaDataTable.mRow[0];

  // maps table indices to their starting index
  const tableDataOffsets: number[] = [];
  binaryModel.mTable.forEach(table => {
    const position = table.startof_mnRowOffset + table.mnRowOffset;
    const padding = -position & 15;
    tableDataOffsets.push(position + padding);
  });

  // maps indices from table 1 into actual XML nodes
  const xmlNodes: Map<number, XmlNode> = new Map();

  function getTableIndexFromPosition(position: number): number {
    for (let i = 0; i < binaryModel.mTable.length; i++) {
      const tableStart = tableDataOffsets[i];
      if (tableStart <= position) {
        const { mnRowCount, mnRowSize } = binaryModel.mTable[i];
        const tableEnd = tableStart + (mnRowCount * mnRowSize);
        if (position < tableEnd) return i;
      }
    }

    throw new Error(`Unable to identify table from position: ${position}`);
  }

  function getRowFromIndicies(tableIndex: number, rowIndex: number): any {
    const tableInfo = binaryModel.mTable[tableIndex];
    const tableData = binaryModel.mTableData[tableIndex];
    if (tableInfo.mnSchemaOffset === RELOFFSET_NULL) {
      return tableData.mValue[rowIndex];
    } else {
      return tableData.mRow[rowIndex];
    }
  }

  function getTableAndRowIndicesFromPosition(position: number): any {
    const tableIndex = getTableIndexFromPosition(position);
    const tableInfo = binaryModel.mTable[tableIndex];
    const rowIndex = (position - (tableInfo.startof_mnRowOffset + tableInfo.mnRowOffset)) / tableInfo.mnRowSize;
    return [tableInfo, rowIndex];
  }

  function getRowFromPosition(position: number): any {
    const [tableIndex, rowIndex] = getTableAndRowIndicesFromPosition(position);
    return getRowFromIndicies(tableIndex, rowIndex);
  }

  // fun fact: code below this line was written on an airplane

  // FIXME: Very verbose and involved for no reason, just do the bit math
  const intConverterBuffer = Buffer.alloc(4);
  const intConverterEncoder = new BinaryEncoder(intConverterBuffer);
  const intConverterDecoder = new BinaryDecoder(intConverterBuffer);
  function toSignedInt32(uint32: number): number {
    intConverterEncoder.seek(0);
    intConverterEncoder.uint32(uint32);
    intConverterDecoder.seek(0);
    return intConverterDecoder.int32();
  }

  function getText(stringRefPosition: number): string {
    // FIXME: readUntilFalsey?
    const stringRef: DataOffsetObject = getRowFromPosition(stringRefPosition);
    const stringStart = stringRefPosition + stringRef.mDataOffset;
    decoder.seek(stringStart);
    return decoder.string();
  }

  function unpackNodeAndChildren(position: number): XmlNode {
    const [tableIndex, rowIndex] = getTableAndRowIndicesFromPosition(position);
    const row: PackedXmlNode = getRowFromIndicies(tableIndex, rowIndex);

    let tag: string;
    const textOffset = toSignedInt32(row.text);
    if (textOffset !== RELOFFSET_NULL)
      tag = getText(position + textOffset);

    const childIndex = row.children.mDataOffset;

    let attributes: { [key: string]: string; };
    let attrsPosition = row.attrs.mDataOffset;
    if (attrsPosition !== RELOFFSET_NULL) {
      attributes = {};
      const startOfTable = tableDataOffsets[tableIndex];
      const rowOffset = (rowIndex * binaryModel.mTable[tableIndex].mnRowSize);
      attrsPosition += startOfTable + rowOffset + 4; // 4 for text value, uint32
      const [, firstAttrIndex] = getTableAndRowIndicesFromPosition(attrsPosition);
      readUntilFalsey<DataOffsetObject>(
        attributeRefsTable.mValue,
        firstAttrIndex,
        value => value.mDataOffset !== RELOFFSET_NULL
      ).forEach(({ mDataOffset }) => {
        // TODO: get actual attribute data and add to attributes obj
      });
    }

    if ((childIndex === RELOFFSET_NULL) && !attributes) {
      if (rowIndex < first_element.mDataOffset) { // FIXME: < or <= ?
        return new XmlValueNode(tag);
      } else {
        return new XmlElementNode({ tag });
      }
    } else {
      return new XmlElementNode({
        tag,
        children: unpackChildren(childIndex),
        attributes
      });
    }
  }

  function unpackChildren(childIndex: number): XmlNode[] {
    // TODO:
  }

  return;
}
