# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.13] - 2024/03/10
### Added
- Add BusinessRule value to TuningResourceType enum.

## [0.6.12] - 2024/02/06
### Fixed
- Fix issue with serializing SimData with adjacent booleans.

## [0.6.11] - 2023/10/20
### Added
- Add object SimData group.
- Add some missing binary resource types (still incomplete).

## [0.6.10] - 2023/10/01
### Added
- Add in missing tuning types and SimData groups ([by MycroftJr](https://github.com/sims4toolkit/models/pull/13)).

## [0.6.9] - 2023/07/19
### Changed
- 'n' attribute now appears first in all nodes extracted from combined tuning.

## [0.6.8] - 2023/07/06
### Changed
- Updated dependency on @s4tk/xml-dom to resolve vulnerabilities and fix minor bug.

## [0.6.7] - 2023/05/08
### Changed
- XmlResource.dom.root now finds the first child that is an element node, rather
  than just the first child. This is a breaking change, and is for compatibility
  with XML files that have a comment on top.
- Update dependency on @s4tk/images to resolve vulnerabilities.

## [0.6.6] - 2023/03/19
### Added
- Add `minify` argument to all `getBuffer()` methods.
- Add `merge()` method to Package class.
- Add `merge()` method to StringTableResource class.
- Add `DevelopmentalMilestone` tuning type and SimData group.
### Changed
- Update dependencies on @s4tk/xml-dom and @s4tk/images.
- CombinedTuningResource's `clone()`, `equals()`, and `getBuffer()` methods are now implemented.
- `CombinedTuningResource.isXml()` is now true, since XML is the only supported format.
- Minor optimization when loading resources in packages.
### Fixed
- Unhandled exceptions will no longer output squish.js to the console.

## [0.6.5] - 2022/08/07
### Changed
- Update dependency on @s4tk/xml-dom.

## [0.6.4] - 2022/07/29
### Changed
- Update dependency on @s4tk/images.

## [0.6.3] - 2022/07/29
### Added
- Add Whim to TuningResourceType enum.

## [0.6.2] - 2022/07/12
### Added
- Add plugin registry.
### Removed
- Remove dependency on BufferFromFile, use [@s4tk/plugin-bufferfromfile](https://www.npmjs.com/package/@s4tk/plugin-bufferfromfile) instead.

## [0.6.1] - 2022/07/12
### Fixed
- Fix critical issue with SimData padding.

## [0.6.0] - 2022/06/22
### Added
- Add DeletedResource model.
- Add ObjectDefinitionResource model and associated types.
- Add ObjectDefinition to BinaryResourceType.
- Add OBJDEF and Null to EncodingType.
- Add Clan and ClanValue to TuningResourceType and SimDataGroup.
### Changed
- Packages can now read deleted entries with an option.

## [0.5.1] - 2022/06/12
### Added
- Add `readBinaryDataModel()` to SimData and CombinedTuning.
### Fixed
- Correct typos in documentation.

## [0.5.0] - 2022/06/10
### Added
- Add DdsImageResource model (for both DDS and DST image resources).
### Changed
- StaticResources are now editable with `replaceContent()`.

## [0.4.5] - 2022/06/09
### Changed
- Update dependencies on other S4TK packages.
### Fixed
- Updated documentation & fix some typos.
- Fix minor issue with SimData/Combined Tuning.

## [0.4.4] - 2022/06/05
### Changed
- Remove unnecessary properties from ResourcePosition.
### Fixed
- Streaming packages now works on Windows.

## [0.4.3] - 2022/06/04
### Added
- Add `getLocaleCode()` to StringTableLocale.
- Add `indexResources()` to Package.
- Add optional `key` attribute to ResourcePosition.

## [0.4.2] - 2022/06/04
### Added
- Add `limit` to PackageFileReadingOptions.
- Add `all()` to TuningResourceType, SimDataGroup, and BinaryResourceType.
- Add `parseAttr()` and `getAttr()` to TuningResourceType.
- Add `TuningResourceType.Street`.
- Add `Package.streamResources()` and `Package.fetchResources()`.
- Add `ResourcePosition` for use with `Package.fetchResources()`.

## [0.4.1] - 2022/06/01
### Added
- Add `toTuning()` method to CombinedTuningResource.

## [0.4.0] - 2022/05/30
### Added
- Re-add CombinedTuningResource model, this time with an implementation.
- Add `XmlExtractionOptions` for use with CombinedTuningResource.
- Add `BinaryResourceType.DdsImage`.
- Add `EncodingType.DDS`.
- Add `all()` and `getInstanceBase()` functions to StringTableLocale enum.
- Add generics to `Package` and `ResourceEntry` to ease typing.
- Add `toJsonObject()` method to StringTableResource.
- Add `replaceEntries()` method to MappedModel.
### Changed
- RawResource now inherits from StaticResource.
- SimDataResource now inherits from DataResource.
- All MappedModelEntry objects now keep track of their own ID.

## [0.3.0] - 2022/04/26
### Changed
- Replace compression code with @s4tk/compression package.
- Replace cached buffers with CompressedBuffer objects from @s4tk/compression.
- Split FileReadingOptions into BinaryFileReadingOptions and PackageFileReadingOptions.
- ResourceEntry no longer extends WritableModel and does not store a buffer.
- ResourceKeyPair can no longer contain a buffer.
- WritableModel (and all descending classes, including Packages and Resources)
  - Replace static create() methods in ALL subclasses with constructors.
  - Update optional arguments for all static from() methods.
  - Remove properties: buffer, isCached, saveBuffer.
  - Add properties: defaultCompressionType, hasBufferCache.
  - Add methods: getBuffer(), getCompressedBuffer(), getCompressedBufferAsync().
  - Update number of args for getBufferAsync().
  - No longer track if each model should cache its buffers; pass a boolean to the new buffer getter methods to determine if it should be saved.
- Package
  - Remove options to clone keys and resources on initialization.
  - No longer prevent buffer cacheing, because I'm not your father.
  - Remove properties: saveCompressedBuffers, saveDecompressedBuffers.
- Resource
  - Remove properties: compressionType, isCompressed, sizeDecompressed.
- RawResource
  - Remove properties: plainText.
  - Add methods: fromAsync().
### Removed
- Temporarily remove CombinedTuning model.
### Added
- Add create() method to Cell class.

## [0.2.2] - 2022/02/15
### Added
- Added all remaining SimDataGroup types to enum.
- Support reading and writing SimData version 0x100.
### Changed
- Temporarily stopped parsing DeletedRecords in packages (option will be added).
- Sort columns by offset when reading SimData binary.
- Make SimData's string table order parity S4S's order.
- Write SimData object tables in order of schemas.
- No longer sort schema columns alphabetically when writing SimData XML.
- SimData equality now depends on schemas having columns in the same order.
### Fixed
- SimData Booleans now occupy 4 bytes.
- Undo "fix" from 0.2.1 that incorrectly sorted SimData columns alphabetically.
- Fix null byte padding of SimData schemas and their columns.
- Fix issue serializing vectors with >2 objects in SimData.
### Removed
- Removed SimDataGroup.Tuning from enum.

## [0.2.1] - 2022/02/13
### Changed
- Forced SimData > XML to sort columns alphabetically.
### Fixed
- SimData columns are now written in the correct sorted order.

## [0.2.0] - 2022/02/05
### Added
- Support reading the "Internal Compression" compression type.
- Created `CompressionType` enum and added to API.
- Added `compressionType`, `isCompressed`, and `sizeDecompressed` to the resource interface.
- Added new resource properties to RawResource.
- Added `decompressRawResources` to file reading options.
### Changed
- Changed optional property in `RawResource.from()` to an object that contains more options.
- Improved error messages for resources that are raw due to compression.
### Fixed
- Raw resources now know whether they are compressed or not, and what kind of compression they use. They should no longer be double-compressed when using a compression type other than ZLIB.

## [0.1.2] - 2022/02/04
### Added
- Added various types/interfaces to API in `@s4tk/models/types`.
- Added `cloneKeys` and `cloneResources` options to `Package.create()` options.
- Wrote JSON docs for website.
### Changed
- Export SimData cells as individual classes rather than an object.
- Renamed `TuningResourceType.Street` to `TuningResourceType.Tuning`.
- Renamed `SimDataGroup.Street` to `SimDataGroup.Tuning`.
- Made all async methods awaitable.
- Make flags optional on SimDataSchemaColumn constructor.

## [0.1.1] - 2022/01/29
### Added
- Added `StringTableLocale.getLocale()` function.

## [0.1.0] - 2022/01/29
### Added
- First release.
