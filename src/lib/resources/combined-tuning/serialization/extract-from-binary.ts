import { XmlDocumentNode } from "@s4tk/xml-dom";
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

/**
 * TODO:
 * 
 * @param binaryModel TODO:
 * @param buffer TODO:
 * @param options TODO:
 */
export default function extractTuningFromCombinedBinary(
  binaryModel: BinaryDataResourceDto,
  buffer: Buffer,
  options?: XmlExtractionOptions // TODO: actually use these
): XmlResource[] {
  const [
    metaDataTable,         // meta data
    nodeObjectsTable,      // actual node objects
    attributeObjectsTable, // actual attributes data
    nodeRefsTable,         // offsets to node objects (for listing)
    attributeRefsTable,    // offsets to attribute objects (for listing)
    stringRefsTable,       // offsets to null-terminated strings (for listing)
    stringObjectsTable     // actual null-terminated strings
  ] = binaryModel.mTableData;

  const {
    first_element, // index in table 1 (nodeObjectsTable)
    top_element,   // ?
    element_count, // ?
    string_table   // ?
  } = metaDataTable.mRow[0];


}
