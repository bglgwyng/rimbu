import type { Streamable } from '@rimbu/stream';
import type { VariantMapBase } from '../custom-base';

/**
 * A type-variant immutable Map of key type K, and value type V.
 * In the Map, each key has exactly one value, and the Map cannot contain
 * duplicate keys.
 * @typeparam K - the key type
 * @typeparam V - the value type
 * @note Type-variance means that both the key and value types
 * can be widened in a type-safe way without casting.
 * @note As a consequence of being variant, the type does not contain methods that (can) add new elements
 * to the collection.
 */
export interface VariantMap<K, V>
  extends VariantMapBase<K, V, VariantMap.Types> {}

export namespace VariantMap {
  /**
   * A non-empty type-variant Map of key type K, and value type V.
   * In the Map, each key has exactly one value, and the Map cannot contain
   * duplicate keys.
   * @typeparam K - the key type
   * @typeparam V - the value type
   * @note Type-variance means that both the key and value types
   * can be widened in a type-safe way without casting.
   * @note As a consequence of being variant, the type does not contain methods that (can) add new elements
   * to the collection.
   */
  export interface NonEmpty<K, V>
    extends VariantMapBase.NonEmpty<K, V, VariantMap.Types>,
      Streamable.NonEmpty<readonly [K, V]> {}

  export interface Types extends VariantMapBase.Types {
    readonly normal: VariantMap<this['_K'], this['_V']>;
    readonly nonEmpty: VariantMap.NonEmpty<this['_K'], this['_V']>;
  }
}
