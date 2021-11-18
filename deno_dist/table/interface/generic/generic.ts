import type { RMap } from '../../../collection-types/mod.ts';
import type { Streamable } from '../../../stream/mod.ts';
import type { TableBase } from '../../table-custom.ts';

/**
 * A type-invariant immutable Table of row key type R, column key type C, and value type V.
 * In the Table, a combination of a row and column key has exactly one value.
 * @typeparam R - the row key type
 * @typeparam C - the column key type
 * @typeparam V - the value type
 * @example
 * const t1 = HashTableHashColumn.empty<number, string, boolean>()
 * const t2 = HashTableHashColumn.of([1, 'a', true], [2, 'a', false])
 */
export interface Table<R, C, V> extends TableBase<R, C, V, Table.Types> {}

export namespace Table {
  /**
   * A non-empty type-invariant immutable Table of row key type R, column key type C, and value type V.
   * In the Table, a combination of a row and column key has exactly one value.
   * @typeparam R - the row key type
   * @typeparam C - the column key type
   * @typeparam V - the value type
   * @example
   * const t1 = HashTableHashColumn.empty<number, string, boolean>()
   * const t2 = HashTableHashColumn.of([1, 'a', true], [2, 'a', false])
   */
  export interface NonEmpty<R, C, V>
    extends TableBase.NonEmpty<R, C, V, Table.Types>,
      Streamable.NonEmpty<[R, C, V]> {}

  /**
   * A context instance for Table implementations that acts as a factory for every instance of this
   * type of collection.
   * @typeparam UR - the upper row key type bound for which the context can be used
   * @typeparam UC - the upper column key type bound for which the context can be used
   */
  export interface Context<UR, UC>
    extends TableBase.Context<UR, UC, Table.Types> {}

  /**
   * A mutable Table builder used to efficiently create new immutable instances.
   * @typeparam R - the row key type
   * @typeparam C - the column key type
   * @typeparam V - the value type
   */
  export interface Builder<R, C, V>
    extends TableBase.Builder<R, C, V, Table.Types> {}

  export interface Types extends TableBase.Types {
    readonly normal: Table<this['_R'], this['_C'], this['_V']>;
    readonly nonEmpty: Table.NonEmpty<this['_R'], this['_C'], this['_V']>;
    readonly context: Table.Context<this['_R'], this['_C']>;
    readonly builder: Table.Builder<this['_R'], this['_C'], this['_V']>;
  }
}

export const Table = {
  /**
   * Returns a new Table context instance based on the given `options`.
   * @typeparam UR - the upper row key type for which the context can create instances
   * @typeparam UC - the upper column key type for which the context can create instances
   * @param options - an object containing the following properties:
   * * rowContext - the map context to use to map row keys to columns
   * * columnContext - the map context to use to map column keys to values
   */
  createContext<UR, UC>(options: {
    rowContext: RMap.Context<UR>;
    columnContext: RMap.Context<UC>;
  }): Table.Context<UR, UC> {
    return null as any;
    // return new TableContext<UR, UC, 'Table', any>(
    //   'Table',
    //   options.rowContext,
    //   options.columnContext
    // );
  },
};
