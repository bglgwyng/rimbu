import type { ArrowGraphHashed, ArrowGraphSorted } from '../../../../graph/mod.ts';
import type { GraphBase } from '../../../../graph/custom/index.ts';
import type { HashMap, HashSet } from '../../../../hashed/mod.ts';
import type { SortedMap, SortedSet } from '../../../../sorted/mod.ts';

export interface ArrowGraphHashedCreators
  extends GraphBase.Factory<ArrowGraphHashed.Types> {
  /**
   * Returns a new ArrowValuedGraphHashed context instance based on the given `options`.
   * @typeparam UN - the upper node type for which the context can create instances
   * @param options - (optional) an object containing the following properties:<br/>
   * - linkMapContext - (optional) the map context to use to maintain link maps<br/>
   * - linkConnectionsContext - (optional) the set context to use to maintain link connections
   */
  createContext<UN>(options?: {
    linkMapContext?: HashMap.Context<UN>;
    linkConnectionsContext?: HashSet.Context<UN>;
  }): ArrowGraphHashed.Context<UN>;
  /**
   * Returns the default context for this type of graph.
   * @typeparam UN - the upper node type that the context should accept
   */
  defaultContext<UN>(): ArrowGraphHashed.Context<UN>;
}

export interface ArrowGraphSortedCreators
  extends GraphBase.Factory<ArrowGraphSorted.Types> {
  /**
   * Returns a new ArrowValuedGraphSorted context instance based on the given `options`.
   * @typeparam UN - the upper node type for which the context can create instances
   * @param options - (optional) an object containing the following properties:<br/>
   * - linkMapContext - (optional) the map context to use to maintain link maps<br/>
   * - linkConnectionsContext - (optional) the set context to use to maintain link connections
   */
  createContext<UN>(options?: {
    linkMapContext?: SortedMap.Context<UN>;
    linkConnectionsContext?: SortedSet.Context<UN>;
  }): ArrowGraphSorted.Context<UN>;
  /**
   * Returns the default context for this type of graph.
   * @typeparam UN - the upper node type that the context should accept
   */
  defaultContext<UN>(): ArrowGraphSorted.Context<UN>;
}
