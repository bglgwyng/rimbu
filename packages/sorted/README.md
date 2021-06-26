<p align="center">
    <img src="../../assets/rimbu_logo.svg" />
</p>

# @rimbu/sorted

This package contains the implementation for the `SortedMap` and `SortedSet` types, which form the basis of all Rimbu Sorted collections. The collections use a `Comp` instance that is configurable to determine the equality and order of values/objects.

This package exports the following types:

| Name              | Description                                                                            |
| ----------------- | -------------------------------------------------------------------------------------- |
| `SortedMap<K, V>` | a map with entries of key type K and value type V, where keys are sorted with a `Comp` |
| `SortedSet<T>`    | a set of value type T where items are sorted with a `Comp`                             |

For complete documentation please visit the _[Rimbu Docs](http://rimbu.org)_.

## Installation

All types are exported through [`@rimbu/core`](../core). It is recommended to use this package.

To install separately:

> `yarn add @rimbu/sorted`

or

> `npm i @rimbu/sorted`

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

## Usage

```ts
import { SortedSet } from '@rimbu/sorted';

console.log(SortedSet.of(1, 3, 4, 2, 3).toString());
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
