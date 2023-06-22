import { expectType } from 'tsd';
import type { Protected } from '../src/index.mjs';

declare function p<T>(): Protected<T>;

expectType<any>(p<any>());
expectType<never>(p<never>());

expectType<number>(p<number>());
expectType<2>(p<2>());

expectType<string>(p<string>());
expectType<'abc'>(p<'abc'>());

expectType<boolean>(p<boolean>());
expectType<true>(p<true>());
expectType<false>(p<false>());

const sym = Symbol();
expectType<symbol>(p<symbol>());
expectType<typeof sym>(p<typeof sym>());

expectType<(v: number) => string>(p<(v: number) => string>());

expectType<{ readonly a: number }>(p<{ readonly a: number }>());
expectType<{ readonly a: number }>(p<{ a: number }>());

expectType<{ readonly a: { readonly b: number; readonly c: string } }>(
  p<{ a: { b: number; c: string } }>()
);

expectType<readonly []>(p<[]>());
expectType<readonly []>(p<readonly []>());
expectType<readonly number[]>(p<number[]>());
expectType<readonly [number, string]>(p<[number, string]>());
expectType<readonly [number, string]>(p<readonly [number, string]>());

expectType<readonly { readonly a: number }[]>(p<{ a: number }[]>());
expectType<readonly [{ readonly a: number }, { readonly b: string }]>(
  p<[{ a: number }, { b: string }]>()
);

expectType<{ readonly a: readonly { readonly b: number }[] }>(
  p<{ a: { b: number }[] }>()
);

// expectAssignable<Set<string>>(p<Set<string>>());
// expectAssignable<Set<{ readonly a: number }>>(p<Set<{ a: number }>>());
expectType<{ readonly a: number }>([...p<Set<{ a: number }>>()][0]);

// expectAssignable<Map<string, number>>(p<Map<string, number>>());
// expectAssignable<Map<{ readonly a: number }, { readonly b: number }>>(
//   p<Map<{ a: number }, { b: number }>>()
// );
expectType<{ readonly a: number }>(
  [...p<Map<{ a: number }, { b: number }>>()][0][0]
);
expectType<{ readonly b: number }>(
  [...p<Map<{ a: number }, { b: number }>>()][0][1]
);

expectType<Promise<number>>(p<Promise<number>>());
expectType<Promise<{ readonly a: number }>>(p<Promise<{ a: number }>>());

expectType<Boolean>(p<Boolean>());
