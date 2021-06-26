<p align="center">
    <img src="../../assets/rimbu_logo.svg" />
</p>

# @rimbu/graph-arrow-valued

This package contains the implementations for the ArrowValuedGraph type. It was mainly split off to a seperate package from the `@rimbu/graph` package to descrease build time and memory usage.

This package exports the following types:

| Name                           | Description                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `ArrowValuedGraph<N, V>`       | a generic directed valued graph with nodes of type N, and edge values of type V |
| `ArrowValuedGraphHashed<N, V>` | a valued directed graph with hashed nodes of type N, and edge values of type V  |
| `ArrowvaluedGraphSorted<N, V>` | a valued directed graph with sorted nodes of type N, and edge values of type V  |

## Installation

All types are exported through [`@rimbu/core`](../core). It is recommended to use this package.

To install separately:

> `yarn add @rimbu/graph-arrow-valued`

or

> `npm i @rimbu/graph-arrow-valued`

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
