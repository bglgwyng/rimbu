import type { HashMap } from '../../../hashed/mod.ts';
import type { SortedMap } from '../../../sorted/mod.ts';
import type {
  HashTableHashColumn,
  HashTableSortedColumn,
  SortedTableHashColumn,
  SortedTableSortedColumn,
} from '../../../table/mod.ts';
import type { TableBase } from '../../../table/custom/index.ts';

export interface HashTableHashColumnCreators
  extends TableBase.Factory<HashTableHashColumn.Types> {
  /**
   * Returns a new HashTableHashColumn context instance based on the given `options`.
   * @typeparam UR - the upper row key type for which the context can create instances
   * @typeparam UC - the upper column key type for which the context can create instances
   * @param options - (optional) an object containing the following properties:<br/>
   * - rowContext - (optional) the map context to use to map row keys to columns<br/>
   * - columnContext - (optional) the map context to use to map column keys to values
   */
  createContext<UR, UC>(options?: {
    rowContext?: HashMap.Context<UR>;
    columnContext?: HashMap.Context<UC>;
  }): HashTableHashColumn.Context<UR, UC>;
  /**
   * Returns the default context for HashTableHashColumns.
   * @typeparam UR - the upper row key type for which the context can create instances
   * @typeparam UC - the upper column key type for which the context can create instances
   */
  defaultContext<UR, UC>(): HashTableHashColumn.Context<UR, UC>;
}

export interface HashTableSortedColumnCreators
  extends TableBase.Factory<HashTableSortedColumn.Types> {
  /**
   * Returns a new HashTableSortedColumn context instance based on the given `options`.
   * @typeparam UR - the upper row key type for which the context can create instances
   * @typeparam UC - the upper column key type for which the context can create instances
   * @param options - (optional) an object containing the following properties:<br/>
   * - rowContext - (optional) the map context to use to map row keys to columns<br/>
   * - columnContext - (optional) the map context to use to map column keys to values
   */
  createContext<UR, UC>(options?: {
    rowContext?: HashMap.Context<UR>;
    columnContext?: SortedMap.Context<UC>;
  }): HashTableSortedColumn.Context<UR, UC>;
  /**
   * Returns the default context for HashTableSortedColumns.
   * @typeparam UR - the upper row key type for which the context can create instances
   * @typeparam UC - the upper column key type for which the context can create instances
   */
  defaultContext<UR, UC>(): HashTableSortedColumn.Context<UR, UC>;
}

export interface SortedTableHashColumnCreators
  extends TableBase.Factory<SortedTableHashColumn.Types> {
  /**
   * Returns a new SortedTableHashColumn context instance based on the given `options`.
   * @typeparam UR - the upper row key type for which the context can create instances
   * @typeparam UC - the upper column key type for which the context can create instances
   * @param options - (optional) an object containing the following properties:<br/>
   * - rowContext - (optional) the map context to use to map row keys to columns<br/>
   * - columnContext - (optional) the map context to use to map column keys to values
   */
  createContext<UR, UC>(options?: {
    rowContext?: SortedMap.Context<UR>;
    columnContext?: HashMap.Context<UC>;
  }): SortedTableHashColumn.Context<UR, UC>;
  /**
   * Returns the default context for SortedTableHashColumns.
   * @typeparam UR - the upper row key type for which the context can create instances
   * @typeparam UC - the upper column key type for which the context can create instances
   */
  defaultContext<UR, UC>(): SortedTableHashColumn.Context<UR, UC>;
}

export interface SortedTableSortedColumnCreators
  extends TableBase.Factory<SortedTableSortedColumn.Types> {
  /**
   * Returns a new HashTableHashColumn context instance based on the given `options`.
   * @typeparam UR - the upper row key type for which the context can create instances
   * @typeparam UC - the upper column key type for which the context can create instances
   * @param options - (optional) an object containing the following properties:<br/>
   * - rowContext - (optional) the map context to use to map row keys to columns<br/>
   * - columnContext - (optional) the map context to use to map column keys to values
   */
  createContext<UR, UC>(options?: {
    rowContext?: SortedMap.Context<UR>;
    columnContext?: SortedMap.Context<UC>;
  }): SortedTableSortedColumn.Context<UR, UC>;
  /**
   * Returns the default context for SortedTableSortedColumns.
   * @typeparam UR - the upper row key type for which the context can create instances
   * @typeparam UC - the upper column key type for which the context can create instances
   */
  defaultContext<UR, UC>(): SortedTableSortedColumn.Context<UR, UC>;
}
