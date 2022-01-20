import type Resource from "../resources/resource";

/**
 * A DTO for package models (DBPFs).
 */
export interface DbpfDto {
  header: DbpfHeader;
  entries: ResourceKeyPair[];  
}

/**
 * An object containing the header values for a DBPF.
 */
export interface DbpfHeader {
  fileVersion?: DbpfVersion; // uint32; should be 2.1
  userVersion?: DbpfVersion; // uint32
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
interface DbpfVersion {
  major: number; // uint32
  minor: number; // uint32
}

export interface ResourceKeyPair {
  key: ResourceKey;
  value: Resource;
}

/**
 * The (ideally) unique identifier for a resource.
 */
export interface ResourceKey {
  type: number;
  group: number;
  instance: bigint;
}
