# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2022/02/02
### Changed
- Export SimData cells as individual classes rather than an object.
- Renamed `TuningResourceType.Street` to `TuningResourceType.Tuning`.
- Renamed `SimDataGroup.Street` to `SimDataGroup.Tuning`.
- Made all async methods awaitable.
- Make flags optional on SimDataSchemaColumn constructor.
### Added
- Added various types/interfaces to API in `@s4tk/models/types`.
- Added `cloneKeys` and `cloneResources` options to `Package.create()` options.
- Wrote JSON docs for website.

## [0.1.1] - 2022/01/29
### Added
- Added `StringTableLocale.getLocale()` function.

## [0.1.0] - 2022/01/29
### Added
- First release.
