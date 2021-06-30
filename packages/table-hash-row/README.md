<p align="center">
    <img src="../../assets/rimbu_logo.svg" />
</p>

# @rimbu/table-hash-row

A `Table` is an immutable 2-dimensional Map, containing row keys and column keys, where a combination of a row and column key can contain one value.

This package contains the hash row implementations of Table. It was mainly split off from the `@rimbu/table` package to reduce build time and memory usage.

This package exports the following types:

| Name                             | Description                                                            |
| -------------------------------- | ---------------------------------------------------------------------- |
| `HashTableHashColumn<R, C, V>`   | a `Table` where the row keys and column keys are hashed                |
| `HashTableSortedColumn<R, C, V>` | a `Table` where the row keys are hashed and the column keys are sorted |

For complete documentation please visit the _[Rimbu Docs](http://rimbu.org)_.

Or [Try Me Out](https://codesandbox.io/s/rimbu-sandbox-d4tbk?previewwindow=console&view=split&editorsize=65&moduleview=1&module=/src/index.ts) in CodeSandBox.

## Installation

All types are exported through [`@rimbu/core`](../core). It is recommended to use this package.

To install separately:

> `yarn add @rimbu/table-hash-row`

or

> `npm i @rimbu/table-hash-row`

### recommended tsconfig settings

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

```ts
import { HashTableHashColumn } from '@rimbu/table-hash-row';

console.log(HashTableHashColumn.of([1, 'a', true], [1, 'b', false]).toString());
```

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
