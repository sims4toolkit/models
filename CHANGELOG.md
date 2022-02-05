# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2022/02/05

### Added
- Support reading the "Internal Compression" compression type.
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
