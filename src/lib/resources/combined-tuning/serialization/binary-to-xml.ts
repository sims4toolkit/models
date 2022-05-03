import { XmlDocumentNode, XmlNode } from "@s4tk/xml-dom";
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

  function getRowFromPosition(position: number): any {
    const tableIndex = getTableIndexFromPosition(position);
    const tableInfo = binaryModel.mTable[tableIndex];
    const rowIndex = (position - (tableInfo.startof_mnRowOffset + tableInfo.mnRowOffset)) / tableInfo.mnRowSize;
    return getRowFromIndicies(tableIndex, rowIndex);
  }

  function toSignedInt32(uint32: number): number {
    // TODO:
  }

  function unpackNodeAndChildren(packedNode: PackedXmlNode, position: number): XmlNode {
    // TODO:
  }

  function unpackChildren() {

  }

  return;
}
