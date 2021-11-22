# S4TK Package Interface

[Sims 4 Toolkit (S4TK)](https://sims4toolkit.com) is an upcoming desktop application for editing tuning mods for The Sims 4.

S4TK Package Interface is what powers S4TK's ability to read and write DBPFs (i.e. package files) and the resources within them. It is similar in concept to [Sims 4 Package Interface (S4PI)](https://github.com/s4ptacle/Sims4Tools), a .NET library created to achieve the same goal, except it is available for Node.js and only supports the resource types that S4TK does (Tuning, SimData, and String Tables).

To avoid confusion with NPM packages and JavaScript's keyword `package`, all references to Sims 4 Packages will use the acronym "DBPF", which stands for "Database Packed File".

## Getting Started

TODO: Documentation

## Troubleshooting

If you encounter any issues using the `import { x } from '@s4tk/core';` syntax, try using `const { x } = require('@s4tk/core');` (it depends on your project settings which works).

## Tech Stack

The library is written entirely in TypeScript, but is distributed as JavaScript with TypeScript declaration files.

Units tests are written in JavaScript, using [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/).

## Disclaimer

The Sims 4™ is a registered trademark of Electronic Arts Inc. (EA).

Sims 4 Toolkit is independently made and is not affiliated with or endorsed by EA.
