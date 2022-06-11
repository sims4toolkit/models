import type { BinaryFileReadingOptions, PackageFileReadingOptions, ResourceFilter, XmlExtractionOptions } from "./lib/common/options";
import type ResourceEntry from "./lib/packages/resource-entry";
import type { ResourceKey, ResourceKeyPair, ResourcePosition } from "./lib/packages/types";
import type StringEntry from "./lib/resources/stbl/string-entry";
import type Resource from "./lib/resources/resource";
import type { WritableModelCreationOptions, WritableModelFromOptions } from "./lib/base/writable-model";
import type { RawResourceCreationOptions } from "./lib/resources/raw/raw-resource";
import type { SimDataResourceCreationOptions } from "./lib/resources/simdata/simdata-resource";
import type { XmlResourceFromOptions } from "./lib/resources/xml/xml-resource";
import type { DdsImageResourceCreationOptions } from "./lib/resources/dds-image/dds-image-resource";

export {
  // options
  BinaryFileReadingOptions,
  DdsImageResourceCreationOptions,
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
  ResourcePosition,
  StringEntry,
}
