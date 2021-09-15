import type { Stream, Streamable } from '../../stream/mod.ts';
import type { ValuedGraphElement } from '../internal.ts';
import type { ValuedGraphBase } from './valued-graph-custom.ts';

/**
 * An type-invariant immutable valued graph.
 * @typeparam N - the node type
 * @typeparam V - the connection value type
 */
export interface ValuedGraph<N, V>
  extends ValuedGraphBase<N, V, ValuedGraph.Types> {}

export namespace ValuedGraph {
  /**
   * A non-empty type-invariant immutable valued graph.
   * @typeparam N - the node type
   * @typeparam V - the connection value type
   */
  export interface NonEmpty<N, V>
    extends ValuedGraphBase.NonEmpty<N, V, ValuedGraph.Types>,
      Omit<ValuedGraph<N, V>, keyof ValuedGraphBase.NonEmpty<any, any, any>>,
      Streamable.NonEmpty<ValuedGraphElement<N, V>> {
    stream(): Stream.NonEmpty<ValuedGraphElement<N, V>>;
  }

  /**
   * A mutable `ValuedGraph` builder used to efficiently create new immutable instances.
   * @typeparam N - the node type
   * @typeparam V - the connection value type
   */
  export interface Builder<N, V>
    extends ValuedGraphBase.Builder<N, V, ValuedGraph.Types> {}

  /**
   * The ValuedGraph's Context instance that serves as a factory for all related immutable instances and builders.
   * @typeparam UN - the upper type limit for node types for which this context can create instances
   */
  export interface Context<UN>
    extends ValuedGraphBase.Context<UN, ValuedGraph.Types> {}

  export interface Types extends ValuedGraphBase.Types {
    readonly normal: ValuedGraph<this['_N'], this['_V']>;
    readonly nonEmpty: ValuedGraph.NonEmpty<this['_N'], this['_V']>;
    readonly builder: ValuedGraph.Builder<this['_N'], this['_V']>;
    readonly context: ValuedGraph.Context<this['_N']>;
  }
}
