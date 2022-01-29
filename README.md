# Sims 4 Toolkit - Models (@s4tk/models)

## Overview

This project contains the models, enums, and other structures required for reading and writing Sims 4 package files and the resources they contain.

**PLEASE NOTE**: Proper documentation for this package will be provided when the Sims 4 Toolkit website has been completed. Please be patient, because this will take a little while to finish. For now, reference this README's Documentation section for a basic introduction, and feel free to browse the [source code on GitHub](https://github.com/sims4toolkit/models.git) as needed. Every class, type, and function has thorough documentation available in the comments, and this should be enough to understand how the library works for now.

## Installation

Install the package as a dependency from npm with the following command:

```sh
npm i @s4tk/models
```

## Disclaimers

Sims 4 Toolkit (S4TK) is a collection of creator-made modding tools for [The Sims 4](https://www.ea.com/games/the-sims). "The Sims" is a registered trademark of [Electronic Arts, Inc](https://www.ea.com/). (EA). Sims 4 Toolkit is not affiliated with or endorsed by EA.

All S4TK software is currently considered to be in its pre-release stage. Use at your own risk, knowing that breaking changes are likely to happen.

## Documentation (WIP)

**PLEASE NOTE**: This documentation is by no means complete. The Sims 4 Toolkit website is being worked on, so please be patient. If you need additional documentation, feel free to check out the [source code on GitHub](https://github.com/sims4toolkit/models.git) for now.

### Models

#### Packages

```ts
import { Package } from "@s4tk/models"; // ESM
const { Package } = require("@s4tk/models"); // CJS
```

Create a new package with `Package.create()`.

Read an existing package with `Package.from(buffer)` or `Package.fromAsync(buffer)`.

Extract resources from an existing package with `Package.extractResources(buffer)` or `Package.extractResourcesAsync(buffer)`.

Write a package with its `buffer` property, or get its buffer asynchronously with `getBufferAsync()`.

For more info about the behavior and params, see the docs in the [source code](https://github.com/sims4toolkit/models/blob/main/src/lib/packages/package.ts).

#### Resources

##### SimDataResource

```ts
import { SimDataResource } from "@s4tk/models"; // ESM
const { SimDataResource } = require("@s4tk/models"); // CJS
```

Create a new SimData with `SimDataResource.create()`.

Read an existing SimData binary with `SimDataResource.from(buffer)` or `SimDataResource.fromAsync(buffer)`.

Read an existing SimData XML with `SimDataResource.fromXml(string | buffer)` or `SimDataResource.fromXmlAsync(string | buffer)`.

Write a SimData with its `buffer` property, or get its buffer asynchronously with `getBufferAsync()`.

For more info about the behavior and params, see the docs in the [source code](https://github.com/sims4toolkit/models/blob/main/src/lib/resources/simdata/simdata-resource.ts).

##### StringTableResource

```ts
import { StringTableResource } from "@s4tk/models"; // ESM
const { StringTableResource } = require("@s4tk/models"); // CJS
```

Create a new string table with `StringTableResource.create()`.

Read an existing string table binary with `StringTableResource.from(buffer)` or `StringTableResource.fromAsync(buffer)`.

Write a string table with its `buffer` property, or get its buffer asynchronously with `getBufferAsync()`.

For more info about the behavior and params, see the docs in the [source code](https://github.com/sims4toolkit/models/blob/main/src/lib/resources/stbl/stbl-resource.ts).

##### XmlResource (Tuning)

```ts
import { XmlResource } from "@s4tk/models"; // ESM
const { XmlResource } = require("@s4tk/models"); // CJS
```

Create a new XML resource with `XmlResource.create()`.

Read an existing XML resource with `XmlResource.from(buffer)` or `XmlResource.fromAsync(buffer)`.

Write an XML resource with its `buffer` property, or get its buffer asynchronously with `getBufferAsync()`.

For more info about the behavior and params, see the docs in the [source code](https://github.com/sims4toolkit/models/blob/main/src/lib/resources/xml/xml-resource.ts).

### Enums

#### BinaryResourceType

```ts
import { BinaryResourceType } from "@s4tk/models/enums"; // ESM
const { BinaryResourceType } = require("@s4tk/models/enums"); // CJS
```

View the enum values in the [source code](https://github.com/sims4toolkit/models/blob/main/src/lib/enums/binary-resources.ts).

#### DataType

```ts
import { DataType } from "@s4tk/models/enums"; // ESM
const { DataType } = require("@s4tk/models/enums"); // CJS
```

View the enum values in the [source code](https://github.com/sims4toolkit/models/blob/main/src/lib/enums/data-type.ts).

#### EncodingType

```ts
import { EncodingType } from "@s4tk/models/enums"; // ESM
const { EncodingType } = require("@s4tk/models/enums"); // CJS
```

View the enum values in the [source code](https://github.com/sims4toolkit/models/blob/main/src/lib/enums/encoding-type.ts).

#### SimDataGroup

```ts
import { SimDataGroup } from "@s4tk/models/enums"; // ESM
const { SimDataGroup } = require("@s4tk/models/enums"); // CJS
```

View the enum values in the [source code](https://github.com/sims4toolkit/models/blob/main/src/lib/enums/simdata-groups.ts).

#### StringTableLocale

```ts
import { StringTableLocale } from "@s4tk/models/enums"; // ESM
const { StringTableLocale } = require("@s4tk/models/enums"); // CJS
```

View the enum values in the [source code](https://github.com/sims4toolkit/models/blob/main/src/lib/enums/stbl-locales.ts).

#### TuningResourceType

```ts
import { TuningResourceType } from "@s4tk/models/enums"; // ESM
const { TuningResourceType } = require("@s4tk/models/enums"); // CJS
```

View the enum values in the [source code](https://github.com/sims4toolkit/models/blob/main/src/lib/enums/tuning-resources.ts).
