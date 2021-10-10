<p align="center">
    <img src="https://github.com/rimbu-org/rimbu/raw/main/assets/rimbu_logo.svg" />
</p>

# @rimbu/actor

This package offers state management tools to create stateful logic that can be easily integrated in any framework.

For complete documentation please visit the _[Rimbu Docs](https://rimbu.org)_.

## Installation

### Yarn/NPM

> `yarn add @rimbu/actor`

or

> `npm i @rimbu/actor`

### Deno

Create a file called `rimbu.ts` and add the following:

> ```ts
> export * from 'https://deno.land/x/rimbu/actor/mod.ts';
> ```

Or using a pinned version (`x.y.z`):

> ```ts
> export * from 'https://deno.land/x/rimbu/actor@x.y.z/mod.ts';
> ```

Then import what you need from `rimbu.ts`:

```ts
import { Actor } from './rimbu.ts';
```

Because Rimbu uses complex types, it's recommended to use the `--no-check` flag (your editor should already have checked your code) and to specify a `tsconfig.json` file with the settings described below.

Running your script then becomes:

> `deno run --no-check --config tsconfig.json <your-script>.ts`

## Recommended `tsconfig.json` settings

Rimbu uses advanced and recursive typing, potentially making the TS compiler quite slow. It is recommended to set the following values in the `tsconfig.json` file of your project:

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
import { Actor, Obs } from '@rimbu/actor';

const obs = Obs.create({ count: 0, changes: 0 });

const actor = Actor.create(obs, {
  increase() {
    obs.patchState({ count: (v) => v + 1, changes: (v) => v + 1 }),
  }
  decrease() {
    obs.patchState({ count: (v) => v - 1, changes: (v) => v + 1 }),
  }
});

console.log(actor.state);
// => { count: 0, changes: 0 }
actor.increase()
actor.increase()
actor.decrease()
console.log(actor.state)
// => { count: 1, changes: 3 }
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
