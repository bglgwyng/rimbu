import type { OmitStrong } from '@rimbu/common';
import { SortedMap } from '@rimbu/sorted';
import type { Stream, Streamable } from '@rimbu/stream';
import { MultiSetBase, MultiSetContext } from '../../multiset-custom';

/**
 * A type-invariant immutable MultiSet of value type T.
 * In the MultiSet, each value can occur multiple times.
 * @typeparam T - the value type
 * * The `SortedMultiSet` uses the contexts' `SortedMap` `mapContext` to sort
 * the values.
 * @example
 * const s1 = SortedMultiSet.empty<string>()
 * const s2 = SortedMultiSet.of('a', 'b', 'a', 'c')
 */
export interface SortedMultiSet<T>
  extends MultiSetBase<T, SortedMultiSet.Types> {}

export namespace SortedMultiSet {
  type NonEmptyBase<T> = MultiSetBase.NonEmpty<T, SortedMultiSet.Types> &
    SortedMultiSet<T>;

  /**
   * A type-invariant immutable MultiSet of value type T.
   * In the MultiSet, each value can occur multiple times.
   * @typeparam T - the value type
   * * The `SortedMultiSet` uses the contexts' `SortedMap` `mapContext` to sort
   * the values.
   */
  export interface NonEmpty<T> extends NonEmptyBase<T>, Streamable.NonEmpty<T> {
    stream(): Stream.NonEmpty<T>;
  }

  /**
   * A context instance for an `SortedMultiSet` that acts as a factory for every instance of this
   * type of collection.
   * @typeparam UT - the upper value type bound for which the context can be used
   */
  export interface Context<UT>
    extends MultiSetBase.Context<UT, SortedMultiSet.Types> {
    readonly typeTag: 'SortedMultiSet';
  }

  /**
   * A mutable `SortedMultiSet` builder used to efficiently create new immutable instances.
   * @typeparam T - the value type
   */
  export interface Builder<T>
    extends MultiSetBase.Builder<T, SortedMultiSet.Types> {}

  export interface Types extends MultiSetBase.Types {
    normal: SortedMultiSet<this['_T']>;
    nonEmpty: SortedMultiSet.NonEmpty<this['_T']>;
    context: SortedMultiSet.Context<this['_T']>;
    builder: SortedMultiSet.Builder<this['_T']>;
    countMap: SortedMap<this['_T'], number>;
    countMapNonEmpty: SortedMap.NonEmpty<this['_T'], number>;
    countMapContext: SortedMap.Context<this['_T']>;
  }
}

interface TypesImpl extends SortedMultiSet.Types {
  context: MultiSetContext<this['_T'], 'SortedMultiSet', any>;
}

function createContext<UT>(options?: {
  countMapContext?: SortedMap.Context<UT>;
}): SortedMultiSet.Context<UT> {
  return new MultiSetContext<UT, 'SortedMultiSet', TypesImpl>(
    'SortedMultiSet',
    options?.countMapContext ?? SortedMap.defaultContext()
  );
}

const _defaultContext: SortedMultiSet.Context<any> = createContext();

const _contextHelpers = {
  /**
   * Returns a new HashMultiSet context instance based on the given `options`.
   * @typeparam UT - the upper element type for which the context can create instances
   * @param options - (optional) an object containing the following properties:
   * * countMapContext - (optional) the map context to use for key to count mapping
   */
  createContext,
  /**
   * Returns the default context for HashMultiSet.
   * @typeparam UT - the upper element type for which the context can create instances
   */
  defaultContext<UT>(): SortedMultiSet.Context<UT> {
    return _defaultContext;
  },
};

type Export = OmitStrong<
  SortedMultiSet.Context<any>,
  '_types' | 'typeTag' | 'isValidElem' | 'countMapContext'
> &
  typeof _contextHelpers;

export const SortedMultiSet: Export = {
  ..._defaultContext,
  ..._contextHelpers,
};
