import type { OmitStrong } from '../../../../common/mod.ts';
import { SortedMap, SortedSet } from '../../../../sorted/mod.ts';
import type { Stream, Streamable } from '../../../../stream/mod.ts';
import { MultiMapBase, MultiMapContext } from '../../../multimap-custom.ts';

/**
 * A type-invariant immutable MultiMap of key type K, and value type V.
 * In the MultiMap, each key has at least one value.
 * @typeparam K - the key type
 * @typeparam V - the value type
 * * The `SortedMultiMapSortedValue` uses the contexts' `SortedMap` `keyContext` to hash
 * the keys
 * * The `SortedMultiMapSortedValue` uses the contexts' `SortedSet` `valueContext` to collect
 * the values for each key.
 * @example
 * const m1 = SortedMultiMapSortedValue.empty<number, string>()
 * const m2 = SortedMultiMapSortedValue.of([1, 'a'], [1, 'b'], [2, 'a'])
 */
export interface SortedMultiMapSortedValue<K, V>
  extends MultiMapBase<K, V, SortedMultiMapSortedValue.Types> {}

export namespace SortedMultiMapSortedValue {
  /**
   * A non-empty type-invariant immutable MultiMap of key type K, and value type V.
   * In the MultiMap, each key has at least one value.
   * @typeparam K - the key type
   * @typeparam V - the value type
   * * The `SortedMultiMapSortedValue` uses the contexts' `SortedMap` `keyContext` to hash
   * the keys
   * * The `SortedMultiMapSortedValue` uses the contexts' `SortedSet` `valueContext` to collect
   * the values for each key.
   */
  export interface NonEmpty<K, V>
    extends MultiMapBase.NonEmpty<K, V, SortedMultiMapSortedValue.Types>,
      Omit<
        SortedMultiMapSortedValue<K, V>,
        keyof MultiMapBase.NonEmpty<any, any, any>
      >,
      Streamable.NonEmpty<[K, V]> {
    stream(): Stream.NonEmpty<[K, V]>;
  }

  /**
   * A context instance for an `SortedMultiMapSortedValue` that acts as a factory for every instance of this
   * type of collection.
   * @typeparam UK - the upper key type bound for which the context can be used
   * @typeparam UV - the upper value type bound for which the context can be used
   */
  export interface Context<UK, UV>
    extends MultiMapBase.Context<UK, UV, SortedMultiMapSortedValue.Types> {
    readonly typeTag: 'SortedMultiMapSortedValue';

    /**
     * The `SortedMap` context used to create HashMaps to the key to value maps.
     */
    readonly keyMapContext: SortedMap.Context<UK>;
    /**
     * The `SortedSet` context used to create HashSets for the value sets.
     */
    readonly keyMapValuesContext: SortedSet.Context<UV>;
  }

  /**
   * A mutable `SortedMultiMapSortedValue` builder used to efficiently create new immutable instances.
   * @typeparam K - the key type
   * @typeparam V - the value type
   */
  export interface Builder<K, V>
    extends MultiMapBase.Builder<K, V, SortedMultiMapSortedValue.Types> {}

  export interface Types extends MultiMapBase.Types {
    readonly normal: SortedMultiMapSortedValue<this['_K'], this['_V']>;
    readonly nonEmpty: SortedMultiMapSortedValue.NonEmpty<
      this['_K'],
      this['_V']
    >;
    readonly context: SortedMultiMapSortedValue.Context<this['_K'], this['_V']>;
    readonly builder: SortedMultiMapSortedValue.Builder<this['_K'], this['_V']>;
    readonly keyMap: SortedMap<this['_K'], SortedSet.NonEmpty<this['_V']>>;
    readonly keyMapNonEmpty: SortedMap.NonEmpty<
      this['_K'],
      SortedSet.NonEmpty<this['_V']>
    >;
    readonly keyMapContext: SortedMap.Context<this['_K']>;
    readonly keyMapValuesContext: SortedSet.Context<this['_V']>;
    readonly keyMapValues: SortedSet<this['_V']>;
    readonly keyMapValuesNonEmpty: SortedSet.NonEmpty<this['_V']>;
  }
}

function createContext<K, V>(options?: {
  keyMapContext?: SortedMap.Context<K>;
  keyMapValuesContext?: SortedSet.Context<V>;
}): SortedMultiMapSortedValue.Context<K, V> {
  return new MultiMapContext<K, V, 'SortedMultiMapSortedValue', any>(
    'SortedMultiMapSortedValue',
    options?.keyMapContext ?? SortedMap.defaultContext(),
    options?.keyMapValuesContext ?? SortedSet.defaultContext()
  );
}

const _defaultContext: SortedMultiMapSortedValue.Context<any, any> =
  createContext();

const _contextHelpers = {
  /**
   * Returns a new SortedMultiMapSortedValue context instance based on the given `options`.
   * @typeparam UK - the upper key type for which the context can create instances
   * @typeparam UV - the upper value type for which the context can create instances
   * @param options - (optional) an object containing the following properties:
   * * keyMapContext - (optional) the map context to use for key to valueset mappings
   * * keyMapValuesContext - (optional) the set context to use for value sets
   */
  createContext,
  /**
   * Returns the default context for HashMultiMapHashValue.
   * @typeparam UK - the upper key type for which the context can create instances
   * @typeparam UV - the upper value type for which the context can create instances
   */
  defaultContext<UK, UV>(): SortedMultiMapSortedValue.Context<UK, UV> {
    return _defaultContext;
  },
};

type Export = OmitStrong<
  SortedMultiMapSortedValue.Context<any, any>,
  'keyMapContext' | 'typeTag' | 'keyMapValuesContext'
> &
  typeof _contextHelpers;

export const SortedMultiMapSortedValue: Export = {
  ..._defaultContext,
  ..._contextHelpers,
};
