import { XmlDocumentNode } from "@s4tk/xml-dom";
import { XmlExtractionOptions } from "../../../common/options";
import { BinaryDataResourceDto } from "../../abstracts/data-resource";
import XmlResource from "../../xml/xml-resource";

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
  // TODO:

  const {
    first_element,
    top_element,
    element_count,
    string_table
  } = binaryModel.mTableData[0].mRow[0];
}
