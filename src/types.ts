import type { BinaryFileReadingOptions, PackageFileReadingOptions, ResourceFilter } from "./lib/common/options";
import type ResourceEntry from "./lib/packages/resource-entry";
import type { ResourceKey, ResourceKeyPair } from "./lib/packages/types";
import type StringEntry from "./lib/resources/stbl/string-entry";
import type Resource from "./lib/resources/resource";
import type { WritableModelCreationOptions } from "./lib/base/writable-model";
import type { RawResourceCreationOptions } from "./lib/resources/raw/raw-resource";
import type { SimDataResourceCreationOptions, SimDataResourceFromOptions } from "./lib/resources/simdata/simdata-resource";
import type { StblResourceFromOptions } from "./lib/resources/stbl/stbl-resource";
import type { XmlResourceFromOptions } from "./lib/resources/xml/xml-resource";

export {
  // options
  BinaryFileReadingOptions,
  PackageFileReadingOptions,
  WritableModelCreationOptions,
  RawResourceCreationOptions,
  SimDataResourceCreationOptions,
  SimDataResourceFromOptions,
  StblResourceFromOptions,
  XmlResourceFromOptions,
  // other structs
  Resource,
  ResourceEntry,
  ResourceFilter,
  ResourceKey,
  ResourceKeyPair,
  StringEntry,
}
