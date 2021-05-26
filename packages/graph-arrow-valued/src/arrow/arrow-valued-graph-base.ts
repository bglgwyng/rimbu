import { RelatedTo } from '@rimbu/common';
import { CustomGraphNonValuedBase, ValuedGraphElement } from '@rimbu/graph';
import { Stream, Streamable } from '@rimbu/stream';

export interface ArrowValuedGraphBase<
  N,
  V,
  Tp extends ArrowValuedGraphBase.Types = ArrowValuedGraphBase.Types
> extends CustomGraphNonValuedBase.ValuedGraphBase<N, V, Tp> {
  /**
   * Returns true since this is an arrow (directed) graph instance.
   */
  readonly isDirected: true;
  /**
   * Returns true if the given `node` has no outgoing connections.
   * @typeparam UN - upper node type used to provide sane typing defaults
   * @param node - the node to check
   * @example
   * const g = ArrowValuesGraphSorted.of([1, 2, 'a'], [2, 3, 'b'])
   * g.isSink(1)  // => false
   * g.isSink(3)  // => true
   */
  isSink<UN = N>(node: RelatedTo<N, UN>): boolean;
  /**
   * Returns true if the given `node` has no incoming connections.
   * @typeparam UN - upper node type used to provide sane typing defaults
   * @param node - the node to check
   * @example
   * const g = ArrowValuesGraphSorted.of([1, 2, 'a'], [2, 3, 'b'])
   * g.isSource(1)  // => true
   * g.isSource(3)  // => false
   */
  isSource<UN = N>(node: RelatedTo<N, UN>): boolean;
}

export namespace ArrowValuedGraphBase {
  type NonEmptyBase<N, V, Tp extends ArrowValuedGraphBase.Types> =
    CustomGraphNonValuedBase.ValuedGraphBase.NonEmpty<N, V, Tp> &
      ArrowValuedGraphBase<N, V, Tp>;

  export interface NonEmpty<
    N,
    V,
    Tp extends ArrowValuedGraphBase.Types = ArrowValuedGraphBase.Types
  > extends NonEmptyBase<N, V, Tp>,
      Streamable.NonEmpty<ValuedGraphElement<N, V>> {
    /**
     * Returns a non-empty Stream containing all entries of this collection as tuples of key and value.
     * @example
     * ArrowValuedGraphHashed.of([1, 2, 'a'], [2, 3, 'b']).stream().toArray()
     * // => [[1, 2, 'a'], [2, 3, 'b']]
     */
    stream(): Stream.NonEmpty<ValuedGraphElement<N, V>>;
  }

  export interface Builder<
    N,
    V,
    Tp extends ArrowValuedGraphBase.Types = ArrowValuedGraphBase.Types
  > extends CustomGraphNonValuedBase.ValuedGraphBase.Builder<N, V, Tp> {}

  export interface Context<
    UN,
    Tp extends ArrowValuedGraphBase.Types = ArrowValuedGraphBase.Types
  > extends CustomGraphNonValuedBase.ValuedGraphBase.Context<UN, Tp> {}

  export interface Types
    extends CustomGraphNonValuedBase.ValuedGraphBase.Types {
    readonly normal: ArrowValuedGraphBase<this['_N'], this['_V']>;
    readonly nonEmpty: ArrowValuedGraphBase.NonEmpty<this['_N'], this['_V']>;
    readonly context: ArrowValuedGraphBase.Context<this['_N']>;
    readonly builder: ArrowValuedGraphBase.Builder<this['_N'], this['_V']>;
  }
}
