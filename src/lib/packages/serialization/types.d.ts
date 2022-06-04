import type { ResourceKey } from "../types";

interface DbpfHeader {
  mnIndexRecordEntryCount: number;
  mnIndexRecordPositionLow: number;
  mnIndexRecordPosition: bigint;
}

interface DbpfFlags {
  constantTypeId?: number;
  constantGroupId?: number;
  constantInstanceIdEx?: number;
}

interface IndexEntry {
  key: ResourceKey;
  mnPosition: number;
  mnSize: number;
  mnCompressionType?: number;
  mnSizeDecompressed: number;
}
