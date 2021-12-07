# Sims 4 Toolkit Core Library

[Sims 4 Toolkit (S4TK)](https://sims4toolkit.com) is a collection of Node.js libraries and developer tools for creating Sims 4 mods.

This repository contains the core code that other S4TK libraries and programs depend on, such as the interfaces and models for DBPFs (package files) and the resources within them (tuning, SimData, and String Tables). It is similar in concept to [Sims 4 Package Interface (S4PI)](https://github.com/s4ptacle/Sims4Tools), a .NET library created to achieve the same goal, except it is available for Node.js and specializes in select resource types (currently, these include Tuning, SimData, and String Tables).

## Getting Started

Install S4TK Core Library as a dependency in your Node.js project with `npm i @s4tk/core`.

The library is written entirely in TypeScript, but is published to npm as JavaScript with TS declarations. Development in either language is perfectly fine, but it is recommended that you use TypeScript for its type safety, since you will be working with models for binary files where types matter.

## Documentation

Complete documentation for the library can be found at [sims4toolkit.com](https://sims4toolkit.com), and if you would like to see some example usage, feel free to view the tests.

## Contributing

All Sims 4 Toolkit repos are open source, including this one. If you would like to contribute to the project, feel free to open an issue or make a pull request. Please follow the below guidelines when doing so.

### Opening Issues

Before submitting an issue, ask yourself:

- Am I using the latest version of the library?
- \[Features\] Did I search the documentation to see if this feature already exists?

1. Prefix your title with something like "BUG" or "FEATURE" to indicate the kind of issue you're opening. Doing so will help me organize and prioritize issues.
2. Be descriptive in your title, but not overly so (like the subject of an email).
3. Be as descriptive as you can be in the body of your issue. If you think something is broken, why? Does it do something contradictory to what the documentation says? Does it behave unexpectedly?

### Pull Requests

Pull requests must meet ALL the following criteria, or they will be rejected.

1. All source code must be written in TypeScript, and use of `any` and `@ts-ignore` should be minimal. This project uses TypeScript for a reason, so it should be used properly.
2. Everything that is exposed through the API needs to have comprehensive unit tests written with Mocha and Chai in JavaScript. You are free to use whichever Chai syntax you prefer, but `expect` is recommended to keep things consistent.
3. All existing tests and the ones you wrote must be passing.
4. Avoid adding new dependencies. If you feel that you need to add a dependency, you must explain why you are adding it and what value it brings to the project. Dependencies with vulnerabilities, even minor ones, will not be accepted into the project under any circumstances\*.

\* = S4TK Core Library is used by S4TK Desktop, which is an application that users install on their computer. It has an internet connection to check for updates, and it also has access to their file system. Therefore, security is incredibly important and will _not_ be overlooked.

## Tech Stack

The library is written entirely in TypeScript, but is distributed as JavaScript with TypeScript declaration files.

Units tests are written in JavaScript, using [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/).

## Disclaimer

The Sims 4™ is a registered trademark of Electronic Arts Inc. (EA).

Sims 4 Toolkit is independently made and is not affiliated with or endorsed by EA.
