import { RMap } from '@rimbu/collection-types';
import { OmitStrong } from '@rimbu/common';
import { HashMap } from '@rimbu/hashed';
import { SortedMap } from '@rimbu/sorted';
import { Streamable } from '@rimbu/stream';
import { TableBase, TableContext } from '../../../table-custom';

/**
 * A type-invariant immutable Table of row key type R, column key type C, and value type V.
 * In the Table, a combination of a row and column key has exactly one value.
 * * The SortedTableHashColumn uses a SortedMap to map row keys to column.
 * * The SortedTableHashColumn uses HashMaps to map column keys to values.
 * @typeparam R - the row key type
 * @typeparam C - the column key type
 * @typeparam V - the value type
 * @example
 * const t1 = SortedTableHashColumn.empty<number, string, boolean>()
 * const t2 = SortedTableHashColumn.of([1, 'a', true], [2, 'a', false])
 */
export type SortedTableHashColumn<R, C, V> = TableBase<R, C, V, SortedTableHashColumn.Types>

export namespace SortedTableHashColumn {
  /**
   * A non-empty type-invariant immutable Table of row key type R, column key type C, and value type V.
   * In the Table, a combination of a row and column key has exactly one value.
   * * The SortedTableHashColumn uses a SortedMap to map row keys to column.
   * * The SortedTableHashColumn uses HashMaps to map column keys to values.
   * @typeparam R - the row key type
   * @typeparam C - the column key type
   * @typeparam V - the value type
   * @example
   * const t1 = SortedTableHashColumn.empty<number, string, boolean>()
   * const t2 = SortedTableHashColumn.of([1, 'a', true], [2, 'a', false])
   */
  export interface NonEmpty<R, C, V>
    extends TableBase.NonEmpty<R, C, V, SortedTableHashColumn.Types>,
      Streamable.NonEmpty<[R, C, V]> {}

  export interface Context<UR, UC>
    extends TableBase.Context<UR, UC, SortedTableHashColumn.Types> {
    readonly typeTag: 'SortedTableHashColumn';
  }

  export type Builder<R, C, V> = TableBase.Builder<R, C, V, SortedTableHashColumn.Types>

  export interface Types extends TableBase.Types {
    normal: SortedTableHashColumn<this['_R'], this['_C'], this['_V']>;
    nonEmpty: SortedTableHashColumn.NonEmpty<
      this['_R'],
      this['_C'],
      this['_V']
    >;
    row: HashMap<this['_C'], this['_V']>;
    rowNonEmpty: HashMap.NonEmpty<this['_C'], this['_V']>;
    rowMap: SortedMap<this['_R'], HashMap.NonEmpty<this['_C'], this['_V']>> &
      SortedMap<this['_R'], RMap.NonEmpty<this['_C'], this['_V']>>;
    rowMapNonEmpty: SortedMap.NonEmpty<
      this['_R'],
      HashMap.NonEmpty<this['_C'], this['_V']>
    > &
      SortedMap.NonEmpty<this['_R'], RMap.NonEmpty<this['_C'], this['_V']>>;
    context: SortedTableHashColumn.Context<this['_R'], this['_C']>;
    builder: SortedTableHashColumn.Builder<this['_R'], this['_C'], this['_V']>;
    rowContext: SortedMap.Context<this['_R']>;
    columnContext: HashMap.Context<this['_C']>;
  }
}

interface TypesImpl extends SortedTableHashColumn.Types {
  context: TableContext<this['_R'], this['_C'], 'SortedTableHashColumn', any>;
}

function createContext<UR, UC>(options?: {
  rowContext?: SortedMap.Context<UR>;
  columnContext?: HashMap.Context<UC>;
}): SortedTableHashColumn.Context<UR, UC> {
  return new TableContext<UR, UC, 'SortedTableHashColumn', TypesImpl>(
    'SortedTableHashColumn',
    options?.rowContext ?? SortedMap.defaultContext(),
    options?.columnContext ?? HashMap.defaultContext()
  );
}

const _defaultContext: SortedTableHashColumn.Context<any, any> =
  createContext();

const _contextHelpers = {
  /**
   * Returns a new SortedTableHashColumn context instance based on the given `options`.
   * @typeparam UR - the upper row key type for which the context can create instances
   * @typeparam UC - the upper column key type for which the context can create instances
   * @param options - (optional) an object containing the following properties:
   * * rowContext - (optional) the map context to use to map row keys to columns
   * * columnContext - (optional) the map context to use to map column keys to values
   */
  createContext,
  /**
   * Returns the default context for SortedTableHashColumns.
   * @typeparam UR - the upper row key type for which the context can create instances
   * @typeparam UC - the upper column key type for which the context can create instances
   */
  defaultContext<UR, UC>(): SortedTableHashColumn.Context<UR, UC> {
    return _defaultContext;
  },
};

type Export = OmitStrong<
  SortedTableHashColumn.Context<any, any>,
  '_types' | 'columnContext' | 'rowContext' | 'typeTag'
> &
  typeof _contextHelpers;

export const SortedTableHashColumn: Export = {
  ..._defaultContext,
  ..._contextHelpers,
};
