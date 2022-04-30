import { RimbuError } from '@rimbu/base';
import type { ArrayNonEmpty } from '@rimbu/common';
import { Immutable, Literal } from './internal';

/**
 * Type to determine the allowed input type for the `match` functions.
 * @typeparam T - the input type
 * @typeparam P - the parant type
 * @typeparam R - the root type
 */
export type Match<T> = MatchHelper<T, T, T>;

type MatchHelper<T, P, R> = T extends Literal.Obj
  ? Match.MatchObj<T, P, R>
  : T extends readonly any[]
  ? Match.MatchArray<T, P, R>
  : Match.Compare<T, P, R>;

export namespace Match {
  /**
   * Type to determine the allowed input type for `match` functions given an object type T.
   * @typeparam T - the input type, being an object
   * @typeparam P - the parant type
   * @typeparam R - the root type
   */
  export type MatchObj<T, P, R> = (
    | Match.Compare<T, P, R>
    | { [K in keyof T]?: MatchHelper<T[K], T, R> }
  ) &
    Literal.NoIterable;

  /**
   * Type representing at least one Match object for type T
   * @typeparam T - the target type
   */
  export type Multi<T> = ArrayNonEmpty<Match<T>>;

  /**
   * Type representing matchers for values that are not objects or arrays
   * @typeparam T - the input type
   * @typeparam P - the parant type
   * @typeparam R - the root type
   */
  export type Compare<T, P, R> =
    | Literal.Value<T>
    | ((
        value: Immutable<T>,
        parent: Immutable<P>,
        root: Immutable<R>
      ) => boolean);

  /**
   * Type representing allowed matchers for arrays
   * @typeparam T - the array type
   * @typeparam P - the parent type
   * @typeparam R - the root type
   */
  export type MatchArray<T extends readonly any[], P, R> = (
    | Match.Compare<T, P, R>
    | {
        [K in { [K2 in keyof T]: K2 }[keyof T]]?: MatchHelper<T[K], T, R>;
      }
  ) &
    Literal.NoIterable;

  /**
   * Returns true if the given `value` matches all of the given objects in the `matchers` array.
   * @typeparam T - the type of the object to match
   * @param value - the value to match
   * @param matchers - one or more `Match` objects
   * @example
   * ```ts
   * matchAll({ g: { h: 'abc' }})({ g: { h: 'a' }}) => false
   * matchAll({ g: { h: 'abc' }})({ g: { h: v => v.length > 1 }}) => true
   * ```
   */
  export function all<T>(value: T): (...matchers: Match.Multi<T>) => boolean {
    return (...matchers): boolean => {
      for (const matcher of matchers) {
        if (!matchSingle<any, any, any>(value, matcher, value, value)) {
          return false;
        }
      }

      return true;
    };
  }

  /**
   * Returns true if the given `value` matches any of the given objects in the `matchers` array.
   * @typeparam T - the type of the object to match
   * @param value - the value to match
   * @param matchers - one or more `Match` objects
   * @example
   * ```ts
   * matchAny({ g: { h: 'abc' }})({ g: { h: 'a' }}, { g: { h: v => v.length < 2 }}) => false
   * matchAny({ g: { h: 'abc' }})({ g: { h: 'a' }}, { g: { h: v => v.length > 1 }}) => true
   * ```
   */
  export function any<T>(value: T): (...matchers: Match.Multi<T>) => boolean {
    return (...matchers): boolean => {
      for (const matcher of matchers) {
        if (matchSingle<any, any, any>(value, matcher, value, value)) {
          return true;
        }
      }

      return false;
    };
  }

  /**
   * Returns a function that takes a value of type T, and returns true if the value matches all the
   * given `matches` array of Match instances.
   * @typeparam T - the type of the object to match
   * @typeparam T2 - the type to use for the Match, should be equal to T
   * @param matches - at least one Match instance to perform on a given `value`
   * @example
   * ```ts
   * type Person = { name: string, age: number }
   * const m = Match.createAll<Person>({ age: v => v > 20 }, { name: v => v.length > 2 })
   *
   * console.log(m({ name: 'abc', age: 10 }))
   * // => false
   * console.log(m({ name: 'abc', age: 20 }))
   * // => true
   * console.log(m({ name: 'a', age: 20 }))
   * // => false
   * ```
   */
  export function createAll<T, T2 extends T = T>(
    ...matches: Match.Multi<T2>
  ): (value: T) => boolean {
    return (value): boolean => Match.all<any>(value)(...matches);
  }

  /**
   * Returns a function that takes a value of type T, and returns true if the value matches any of the
   * given `matches` array of Match instances.
   * @typeparam T - the type of the object to match
   * @typeparam T2 - the type to use for the Match, should be equal to T
   * @param matches - at least one Match instance to perform on a given `value`
   * @example
   * ```ts
   * type Person = { name: string, age: number }
   * const m = Match.createAny<Person>({ age: v => v > 20 }, { name: v => v.length > 2 })
   *
   * console.log(m({ name: 'abc', age: 10 }))
   * // => true
   * console.log(m({ name: 'abc', age: 20 }))
   * // => true
   * console.log(m({ name: 'a', age: 20 }))
   * // => true
   * console.log(m({ name: 'a', age: 10 }))
   * // => false
   * ```
   */
  export function createAny<T, T2 extends T = T>(
    ...matches: Match.Multi<T2>
  ): (value: T) => boolean {
    return (value): boolean => Match.any<any>(value)(...matches);
  }
}

function matchSingle<T, P, R>(
  value: Immutable<T>,
  matcher: MatchHelper<T, P, R>,
  parent: Immutable<P>,
  root: Immutable<R>
): boolean {
  if (typeof matcher === 'function') {
    return matcher(value, parent, root);
  }

  if (null === value || undefined === value || typeof value !== 'object') {
    if (typeof matcher !== 'object' || null === matcher) {
      return (matcher as any) === value;
    }
    if (Literal.isLiteral(matcher)) {
      return Literal.getValue(matcher) === value;
    }
    return (matcher as any) === value;
  }

  if (Array.isArray(matcher)) {
    RimbuError.throwInvalidUsageError(
      'Do not use arrays directly in match object, but use Literal.of(array) instead due to type limittions.'
    );
  }

  if (typeof matcher !== 'object') RimbuError.throwInvalidStateError();

  if (null === matcher) return false;

  if (Literal.isLiteral(matcher)) {
    return Literal.getValue(matcher) === value;
  }

  const valueIsArray = Array.isArray(value);

  // check if plain object
  if (!valueIsArray && !Literal.isPlainObject(value)) {
    return (matcher as any) === value;
  }

  for (const key in matcher as any) {
    if (!(key in value)) return false;

    const matchKey = (matcher as any)[key];

    if (undefined === matchKey) {
      RimbuError.throwInvalidUsageError(
        'Do not use undefined directly in match objects, but use Literal.of(undefined) instead due to type limitations.'
      );
    }

    const result = matchSingle<any, any, any>(
      (value as any)[key],
      matchKey,
      value,
      root
    );
    if (!result) return false;
  }

  return true;
}
