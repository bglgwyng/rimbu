import { RMap, RSet } from '@rimbu/collection-types';
import { Stream, Streamable } from '@rimbu/stream';
import type { GraphElement } from '../../internal';
import type { EdgeGraphBase } from '../graph-custom';
import { GraphContext } from '../graph-custom';

/**
 * An type-invariant immutable edge (undirected) graph.
 * @typeparam N - the node type
 */
export interface EdgeGraph<N> extends EdgeGraphBase<N, EdgeGraph.Types> {}

export namespace EdgeGraph {
  type NonEmptyBase<N> = EdgeGraphBase.NonEmpty<N, EdgeGraph.Types> &
    EdgeGraph<N>;

  /**
   * A non-empty type-invariant immutable edge (undirected) graph.
   * @typeparam N - the node type
   */
  export interface NonEmpty<N>
    extends NonEmptyBase<N>,
      Streamable.NonEmpty<GraphElement<N>> {
    /**
     * Returns a non-empty `Stream` containing all graph elements of this collection as single tuples for isolated nodes
     * and 2-valued tuples of nodes for connections.
     * @example
     * EdgeGraphHashed.of([1], [2, 3]).stream().toArray()  // => [[1], [2, 3]]
     */
    stream(): Stream.NonEmpty<GraphElement<N>>;
  }

  /**
   * A mutable `EdgeGraph` builder used to efficiently create new immutable instances.
   * @typeparam N - the node type
   */
  export interface Builder<N>
    extends EdgeGraphBase.Builder<N, EdgeGraph.Types> {}

  /**
   * The EdgeGraph's Context instance that serves as a factory for all related immutable instances and builders.
   * @typeparam UN - the upper type limit for node types for which this context can create instances
   */
  export interface Context<UN>
    extends EdgeGraphBase.Context<UN, EdgeGraph.Types> {}

  export interface Types extends EdgeGraphBase.Types {
    readonly normal: EdgeGraph<this['_N']>;
    readonly nonEmpty: EdgeGraph.NonEmpty<this['_N']>;
    readonly context: EdgeGraph.Context<this['_N']>;
    readonly builder: EdgeGraph.Builder<this['_N']>;
  }
}

interface TypesImpl extends EdgeGraph.Types {
  readonly context: GraphContext<this['_N'], string, false, any>;
}

export const EdgeGraph = {
  /**
   * Returns a new EdgeGraph context instance based on the given `options`.
   * @typeparam UN - the upper node type for which the context can create instances
   * @param options - an object containing the following properties:
   * * linkMapContext - the map context to use to maintain link maps
   * * linkConnectionsContext - the set context to use to maintain link connection maps
   */
  createContext<UN>(options: {
    linkMapContext: RMap.Context<UN>;
    linkConnectionsContext: RSet.Context<UN>;
  }): EdgeGraph.Context<UN> {
    return new GraphContext<UN, 'EdgeGraph', false, TypesImpl>(
      false,
      'EdgeGraph',
      options.linkMapContext,
      options.linkConnectionsContext
    );
  },
};
