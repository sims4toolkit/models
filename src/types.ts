import type { BinaryFileReadingOptions, PackageFileReadingOptions, ResourceFilter, XmlExtractionOptions } from "./lib/common/options";
import type ResourceEntry from "./lib/packages/resource-entry";
import type { ResourceKey, ResourceKeyPair } from "./lib/packages/types";
import type StringEntry from "./lib/resources/stbl/string-entry";
import type Resource from "./lib/resources/resource";
import type { WritableModelCreationOptions, WritableModelFromOptions } from "./lib/base/writable-model";
import type { RawResourceCreationOptions } from "./lib/resources/raw/raw-resource";
import type { SimDataResourceCreationOptions } from "./lib/resources/simdata/simdata-resource";
import type { XmlResourceFromOptions } from "./lib/resources/xml/xml-resource";

export {
  // options
  BinaryFileReadingOptions,
  PackageFileReadingOptions,
  XmlExtractionOptions,
  WritableModelCreationOptions,
  WritableModelFromOptions,
  RawResourceCreationOptions,
  SimDataResourceCreationOptions,
  XmlResourceFromOptions,
  // other structs
  Resource,
  ResourceEntry,
  ResourceFilter,
  ResourceKey,
  ResourceKeyPair,
  StringEntry,
}
