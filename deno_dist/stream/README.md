<p align="center">
    <img src="https://github.com/rimbu-org/rimbu/raw/main/assets/rimbu_logo.svg" />
</p>

[![npm version](https://badge.fury.io/js/@rimbu%2Fstream.svg)](https://www.npmjs.com/package/@rimbu/stream) [![Deno](https://shield.deno.dev/x/rimbu)](http://deno.land/x/rimbu)

![Licence](https://img.shields.io/github/license/rimbu-org/rimbu)

# @rimbu/stream

Welcome to `@rimbu/stream`! A `Stream` is an Iterable-like structure that represents a source capable of streaming values upon request. The source can be a materialized object (e.g., an Array) or a calculated sequence (e.g., Fibonacci numbers). Unlike an Iterable, a Stream offers numerous methods to transform the values produced before consumption, without needing to materialize intermediate instances.

### Key Features:

- **Flexible Sources**: Stream values from various sources, whether materialized or calculated.
- **Transformation Methods**: Modify the stream's values on-the-fly without creating intermediate objects.
- **Efficient Iteration**: Optimized for performance, providing faster iteration capabilities.

### Exported Types:

| Name              | Description                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| `FastIterable<T>` | An Iterable that supports faster iterating than the `Iterable` type.                                    |
| `FastIterator<T>` | An Iterator that supports faster iterating than the `Iterator` type.                                    |
| `Stream<T>`       | An Iterable-like structure that represents a source that can produce values of type `T` when requested. |
| `Streamable<T>`   | An interface requiring that an object has a `.stream()` method.                                         |
| `StreamSource<T>` | A convenience type that covers all types that can be automatically converted to a `Stream`.             |

### Documentation

For complete documentation, please visit the [Stream page](https://rimbu.org/docs/collections/stream) in the [Rimbu Docs](https://rimbu.org), or directly explore the [Rimbu Stream API Docs](https://rimbu.org/api/rimbu/stream).

### Try It Out

Experience `@rimbu/stream` in action! [Try Out Rimbu](https://codesandbox.io/s/github/vitoke/rimbu-sandbox/tree/main?previewwindow=console&view=split&editorsize=65&moduleview=1&module=/src/index.ts) on CodeSandBox.

## Installation

### Compabitity

- [`Node` ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?logo=node.js&logoColor=white)](https://nodejs.org)
- [`Deno` ![Deno JS](https://img.shields.io/badge/deno%20js-000000?logo=deno&logoColor=white)](https://deno.com/runtime)
- [`Bun` ![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logoColor=white)](https://bun.sh/)
- `Web` ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?logoColor=white)

### Package Managers

**Yarn:**

```sh
yarn add @rimbu/stream
```

**npm:**

```sh
npm install @rimbu/stream
```

**Bun:**

```sh
bun add @rimbu/stream
```

### Deno Setup

Create or edit `import_map.json` in your project root:

```json
{
  "imports": {
    "@rimbu/": "https://deno.land/x/rimbu@x.y.z/"
  }
}
```

_Replace `x.y.z` with the desired version._

In this way you can use relative imports from Rimbu in your code, like so:

```ts
import { List } from '@rimbu/core/mod.ts';
import { HashMap } from '@rimbu/hashed/mod.ts';
```

Note that for sub-packages, due to conversion limitations it is needed to import the `index.ts` instead of `mod.ts`, like so:

```ts
import { HashMap } from '@rimbu/hashed/map/index.ts';
```

To run your script (let's assume the entry point is in `src/main.ts`):

`deno run --import-map import_map.json src/main.ts`

## Usage

```ts
import { Stream } from '@rimbu/stream';

console.log(Stream.range({ start: 10, amount: 15 }).toArray());
```

## Author

Created and maintained by [Arvid Nicolaas](https://github.com/vitoke).

## Contributing

We welcome contributions! Please read our [Contributing guide](https://github.com/rimbu-org/rimbu/blob/main/CONTRIBUTING.md).

## Contributors

<img src = "https://contrib.rocks/image?repo=rimbu-org/rimbu"/>

_Made with [contributors-img](https://contrib.rocks)._

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) for details.
