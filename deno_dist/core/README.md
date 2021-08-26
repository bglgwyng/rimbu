<p align="center">
    <img src="https://github.com/rimbu-org/rimbu/raw/main/assets/rimbu_logo.svg" />
</p>

# @rimbu/core

This package exports all the Rimbu collections, plus the contents of the `@rimbu/common` package. Its aim is to provide an easy to use access point for the collections.

For complete documentation please visit the _[Rimbu Docs](http://rimbu.org)_.

Or [Try Me Out](https://codesandbox.io/s/rimbu-sandbox-d4tbk?previewwindow=console&view=split&editorsize=65&moduleview=1&module=/src/index.ts) in CodeSandBox.

## Installation

To get started with the immutable collections, which are exported through `@rimbu/core`, you can use the following.

### Yarn/NPM

For yarn:

> `yarn add @rimbu/core`

For npm:

> `npm i @rimbu/core`

### Deno

Create a file called `rimbu.ts` and add the following:

> ```ts
> export * from 'https://deno.land/x/rimbu/core/mod.ts';
> ```

Or using a pinned version (`x.y.z`):

> ```ts
> export * from 'https://deno.land/x/rimbu/core@x.y.z./mod.ts';
> ```

Then import what you need from `rimbu.ts`:

```ts
import { HashMap } from './rimbu.ts';
```

Because Rimbu uses complex types, it's recommended to use the `--no-check` flag (your editor should already have checked your code) and to specify a `tsconfig.json` file with the settings described below.

Running your script then becomes:

> `deno run --no-check --config tsconfig.json <your-script>.ts`

## Recommended `tsconfig.json` settings

Rimbu uses advanced and recursive typing, potentially making the TypeScript compiler quite slow in some cases, or causing infinite recursion. It is recommended to set the following values in the `tsconfig.json` file of your project:

```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "noStrictGenericChecks": true
  }
}
```

## Usage

Using direct imports:

```ts
import { List, Stream, SortedMap } from '@rimbu/core';

const list = List.of(1, 3, 2, 4, 2);

const stream = Stream.from(list).map((v) => [v, String(v * 2)]);

const map = SortedMap.from(stream);

console.log(map.toArray());
// => [[1, '2'], [2, '4'], [3, '6'], [4, '8']]
```

The same code using the `Create` menu-object:

```ts
import Rimbu from '@rimbu/core';

const list = Rimbu.Create.List.of(1, 3, 2, 4, 2);

const stream = Rimbu.Create.Stream.from(list).map((v) => [v, String(v * 2)]);

const map = Rimbu.Create.Map.Sorted.from(stream);

console.log(map.toArray());
// => [[1, '2'], [2, '4'], [3, '6'], [4, '8']]
```

## Contents

This package exports everything from the following packages:

| Name                                           | Description                                                                                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [@rimbu/bimap](../bimap)                       | a bidirectional map in which keys and values have a one-to-one mapping                                                                       |
| [@rimbu/bimultimap](../bimultimap)             | a bidirectional multimap in which keys and values have a many-to-many mapping                                                                |
| [@rimbu/collection-types](../collection-types) | definitions for many of the generic collection types, used to derive more specific implementations                                           |
| [@rimbu/common](../common)                     | contains public types and functions that are used throughout the whole library                                                               |
| [@rimbu/deep](../deep)                         | offers tools to use handle plain JS objects as immutable objects. library                                                                    |
| [@rimbu/graph](../graph)                       | provides various graph implementations to represent data in forms of nodes and edges                                                         |
| [@rimbu/hashed](../hashed)                     | provides a HashMap and HashSet implementation, using hash functions to efficiently retrieve keys                                             |
| [@rimbu/list](../list)                         | provides the List datastructure containing an ordered sequence of elements that can be manipulated and accessed randomly in an efficient way |
| [@rimbu/multimap](../multimap)                 | provides a map in which keys and values have a one-to-many mapping                                                                           |
| [@rimbu/multiset](../multiset)                 | provides a set in which elements can occur multiple times                                                                                    |
| [@rimbu/ordered](../ordered)                   | provides the OrderedSet and OrderedMap collections, that keep insertion order                                                                |
| [@rimbu/sorted](../sorted)                     | provides a SortedMap and SortedSet implementation, using compare functions to efficiently keep the elements sorted                           |
| [@rimbu/stream](../stream)                     | contains methods to easily manipulate sequences of data                                                                                      |
| [@rimbu/table](../table)                       | provides various Table data structures where a combination of a row key and column key maps to a single value.                               |

## Author

[Arvid Nicolaas](https://github.com/vitoke)

## Contributing

Feel very welcome to contribute to further improve Rimbu. Please read our [Contributing guide](../../CONTRIBUTING.md).

## Contributors

<img src = "https://contrib.rocks/image?repo=vitoke/iternal"/>

Made with [contributors-img](https://contrib.rocks).

## License

Licensed under the MIT License, Copyright © 2020-present Arvid Nicolaas.

See [LICENSE](./LICENSE) for more information.
