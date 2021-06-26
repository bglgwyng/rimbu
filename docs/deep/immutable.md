# Immutable

TypeScript offers some helper types to prevent users from changing properties in objects. These are mainly the `readonly` keyword and the `Readonly<T>` type. However, they require diligence to apply properly:

```ts
const obj: Readonly<{
  a: number;
  b: { c: boolean; d: number[] };
}> = {
  a: 1,
  b: { c: true },
  d: [1],
};

obj.a = 2; // => compiler error
obj.b.c = false; // => no error!
obj.d.push(5); // => no error!
```

To create plain JS objects that can be considered immutable in TypeScript, Rimbu offers the `Immutable` function and type:

```ts
import { Immutable } from '@rimbu/core';

const obj = Immutable({
  a: 1,
  b: { c: true },
  d: [1],
});
obj.a = 2; // => compiler error
obj.b.c = false; // => compiler error
obj.d.push(5); // => compiler error
```

Like `Readonly`, `Immutable` does not have any effect on the object itself, but only instructs the compiler that all its properties and nested properties are read-only, plus it has some intelligence about arrays and collections.

## Examples

[Open with type inference](https://codesandbox.io/s/rimbu-sandbox-d4tbk?previewwindow=console&view=split&editorsize=65&moduleview=1&module=/src/deep/immutable.ts ':target blank :class=btn')

[Immutable](https://codesandbox.io/embed/rimbu-sandbox-d4tbk?previewwindow=console&view=split&editorsize=65&codemirror=1&moduleview=1&module=/src/deep/immutable.ts ':include :type=iframe width=100% height=450px')
