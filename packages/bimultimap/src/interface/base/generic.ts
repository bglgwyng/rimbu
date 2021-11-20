import type { MultiMap } from '@rimbu/multimap';
import type { Streamable } from '@rimbu/stream';
import { BiMultiMapBase, BiMultiMapContext } from '../../bimultimap-custom';

/**
 * A type-invariant immutable bi-directional MultiMap where keys and values have a
 * many-to-many mapping.
 * @typeparam K - the key type
 * @typeparam V - the value type
 */
export interface BiMultiMap<K, V>
  extends BiMultiMapBase<K, V, BiMultiMap.Types> {}

export namespace BiMultiMap {
  /**
   * A non-empty type-invariant immutable bi-directional MultiMap where keys and values have a
   * many-to-many mapping.
   * @typeparam K - the key type
   * @typeparam V - the value type
   */
  export interface NonEmpty<K, V>
    extends BiMultiMapBase.NonEmpty<K, V, BiMultiMap.Types>,
      Streamable.NonEmpty<[K, V]> {}

  /**
   * The BiMultiMap's Context instance that serves as a factory for all related immutable instances and builders.
   */
  export interface Context<UK, UV>
    extends BiMultiMapBase.Context<UK, UV, BiMultiMap.Types> {}

  /**
   * A mutable `BiMultiMap` builder used to efficiently create new immutable instances.
   * @typeparam K - the key type
   * @typeparam V - the value type
   */
  export interface Builder<K, V>
    extends BiMultiMapBase.Builder<K, V, BiMultiMap.Types> {}

  export interface Types extends BiMultiMapBase.Types {
    readonly context: BiMultiMap.Context<this['_K'], this['_V']>;
    readonly normal: BiMultiMap<this['_K'], this['_V']>;
    readonly nonEmpty: BiMultiMap.NonEmpty<this['_K'], this['_V']>;
    readonly builder: BiMultiMap.Builder<this['_K'], this['_V']>;
  }
}

export const BiMultiMap = {
  /**
   * Returns a new BiMultiMap context instance based on the given `options`.
   * @typeparam UK - the upper key type for which the context can create instances
   * @typeparam UV - the upper value type for which the context can create instances
   * @param options - an object containing the following properties:
   * * keyValueMultiMapContext - the map context to use for key value multimaps
   * * valueKeyMultiMapContext - the set context to use for value key multimaps
   */
  createContext<UK, UV>(options: {
    keyValueMultiMapContext: MultiMap.Context<UK, UV>;
    valueKeyMultiMapContext: MultiMap.Context<UV, UK>;
  }): BiMultiMap.Context<UK, UV> {
    return new BiMultiMapContext<UK, UV, 'BiMultiMap', any>(
      'BiMultiMap',
      options.keyValueMultiMapContext,
      options.valueKeyMultiMapContext
    );
  },
};
