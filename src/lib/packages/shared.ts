import type Resource from "../resources/resource";

/**
 * A DTO for package models (DBPFs).
 */
export interface DbpfDto {
  header: DbpfHeader;
  entries: ResourceEntryDto[];  
}

/**
 * An object containing the header values for a DBPF.
 */
export interface DbpfHeader {
  fileVersion?: Version; // uint32; should be 2.1
  userVersion?: Version; // uint32
  creationTime?: number; // uint32
  updatedTime?: number; // uint32
  unused1?: number; // uint32
  unused2?: number; // uint32
  unused3?: number[]; // uint32[3]
  unused4?: number; // uint32; must be 3
  unused5?: number[]; // uint32[6]
  flags?: number; // uint32
}

/**
 * A version in a DBPF header.
 */
interface Version {
  major: number; // uint32
  minor: number; // uint32
}

/**
 * A wrapper for a resource to track its metadata within a DBPF.
 */
export interface ResourceEntryDto {
  key: ResourceKeyDto;
  resource: Resource;
  buffer?: Buffer;
}

/**
 * The (ideally) unique identifier for a resource.
 */
export interface ResourceKeyDto {
  type: number;
  group: number;
  instance: bigint;
}
