<p align="center">
    <img src="../../assets/rimbu_logo.svg" />
</p>

# @rimbu/table

A `Table` is an immutable 2-dimensional Map, containing row keys and column keys, where a combination of a row and column key can contain one value.

This package exports the following main types:

| Name                    | Description                                                         |
| ----------------------- | ------------------------------------------------------------------- |
| `Table<R, C, V>`        | a generic `Table` with row keys R, column keys C, and values V      |
| `VariantTable<R, C, V>` | a type-variant `Table` with row keys R, column keys C, and values V |

For complete documentation please visit the _[Rimbu Docs](http://rimbu.org)_.

## Installation

All types are exported through [`@rimbu/core`](../core). It is recommended to use this package.

To install separately:

> `yarn add @rimbu/table`

or

. `npm i @rimbu/table`

### recommended tsconfig settings

Rimbu uses advanced and recursive typing, potentially making the TypeScript compiler quite slow in some cases, or causing infinite recursion. It is recommended to set the following values in the `tsconfig.json` file of your project:

```json
{
  //  ...
  "compilerOptions": {
    // ...
    "skipLibCheck": true,
    "noStrictGenericChecks": true
  }
}
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
