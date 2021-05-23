import { CustomBase } from '@rimbu/collection-types';
import { RelatedTo, ToJSON, TraverseState } from '@rimbu/common';
import { Stream, StreamSource } from '@rimbu/stream';
import {
  GraphBase,
  GraphTypesContextImpl,
  WithGraphValues,
} from '../../graph-custom';
import { GraphElement, Link } from '../../internal';

export class GraphNonEmpty<
    N,
    Tp extends GraphTypesContextImpl,
    TpG extends WithGraphValues<Tp, N, unknown> = WithGraphValues<
      Tp,
      N,
      unknown
    >
  >
  extends CustomBase.NonEmptyBase<GraphElement<N>>
  implements GraphBase.NonEmpty<N, Tp>
{
  constructor(
    readonly isDirected: boolean,
    readonly context: WithGraphValues<Tp, N, unknown>['context'],
    readonly linkMap: TpG['linkMapNonEmpty'],
    readonly connectionSize: number
  ) {
    super();
  }

  copy(
    linkMap: TpG['linkMapNonEmpty'],
    connectionSize: number
  ): TpG['nonEmpty'] {
    if (linkMap === this.linkMap && connectionSize === this.connectionSize)
      return this as any;
    return this.context.createNonEmpty<N>(linkMap as any, connectionSize);
  }

  copyE(
    linkMap: TpG['linkMap'],
    connectionSize: number
  ): WithGraphValues<Tp, N, unknown>['normal'] {
    if (linkMap.nonEmpty()) return this.copy(linkMap, connectionSize);
    return this.context.empty();
  }

  assumeNonEmpty: any;

  asNormal(): any {
    return this;
  }

  forEach(
    f: (node: N, index: number, halt: () => void) => void,
    state?: TraverseState
  ): void {
    this.linkMap.streamKeys().forEach(f, state);
  }

  stream(): Stream.NonEmpty<GraphElement<N>> {
    return this.linkMap.stream().flatMap(([node, targets]) => {
      if (!targets.nonEmpty()) return [[node]];
      return targets
        .stream()
        .map((target) => [node, target] as GraphElement<N>);
    });
  }

  get nodeSize(): number {
    return this.linkMap.size;
  }

  streamNodes(): Stream.NonEmpty<N> {
    return this.linkMap.streamKeys();
  }

  streamConnections(): Stream<WithGraphValues<Tp, N, unknown>['link']> {
    return this.linkMap
      .stream()
      .flatMap(([node1, targets]) =>
        targets.stream().map((node2) => [node1, node2] as [N, N])
      );
  }

  hasNode<UN = N>(node: RelatedTo<N, UN>): boolean {
    return this.linkMap.hasKey(node);
  }

  hasConnection<UN = N>(
    node1: RelatedTo<N, UN>,
    node2: RelatedTo<N, UN>
  ): boolean {
    const targets = this.linkMap.get(node1);

    return targets?.has(node2) ?? false;
  }

  getConnectionStreamFrom<UN = N>(node1: RelatedTo<N, UN>): Stream<Link<N>> {
    const targets = this.linkMap.get(node1);

    if (undefined === targets) return Stream.empty();

    return targets.stream().map((node2) => [node1, node2] as [N, N]);
  }

  getConnectionStreamTo<UN = N>(node: RelatedTo<N, UN>): any {
    if (this.isDirected) {
      return this.linkMap.stream().collect(([source, targets], _, skip) => {
        if (!targets?.has(node)) return skip;
        return [source, node];
      });
    }

    const targets = this.linkMap.get(node);

    if (undefined === targets) return Stream.empty();

    return targets.stream().map((node1) => [node1, node]);
  }

  getConnectionsFrom<UN = N>(node1: RelatedTo<N, UN>): TpG['linkConnections'] {
    return this.linkMap.get(
      node1,
      this.context.linkConnectionsContext.empty<N>()
    );
  }

  isSink<UN = N>(node: RelatedTo<N, UN>): boolean {
    const targets = this.linkMap.get(node);

    return targets?.isEmpty ?? false;
  }

  isSource<UN = N>(node: RelatedTo<N, UN>): boolean {
    return (
      this.linkMap.hasKey(node) &&
      this.linkMap.streamValues().every((targets) => !targets.has(node))
    );
  }

  addNode(node: N): WithGraphValues<Tp, N, unknown>['nonEmpty'] {
    return this.copy(
      this.linkMap
        .modifyAt(node, { ifNew: this.context.linkConnectionsContext.empty })
        .assumeNonEmpty(),
      this.connectionSize
    );
  }

  addNodes(nodes: StreamSource<N>): TpG['nonEmpty'] {
    const builder = this.toBuilder();
    builder.addNodes(nodes);
    return builder.build().assumeNonEmpty();
  }

  removeNode<UN = N>(node: RelatedTo<N, UN>): TpG['normal'] {
    const builder = this.toBuilder();
    builder.removeNode(node);
    return builder.build();
  }

  removeNodes<UN = N>(nodes: StreamSource<RelatedTo<N, UN>>): TpG['normal'] {
    const builder = this.toBuilder();
    builder.removeNodes(nodes);
    return builder.build();
  }

  connect(node1: N, node2: N): TpG['nonEmpty'] {
    const newLinkMap = this.linkMap.modifyAt(node1, {
      ifNew: this.context.linkConnectionsContext.of(node2),
      ifExists: (targets) => targets.add(node2),
    });

    if (newLinkMap === this.linkMap) return this as any;

    const newConnectionSize = this.connectionSize + 1;

    if (node1 === node2) {
      return this.context.createNonEmpty(newLinkMap as any, newConnectionSize);
    }

    if (this.isDirected) {
      return this.copy(
        newLinkMap
          .modifyAt(node2, {
            ifNew: () => this.context.linkConnectionsContext.empty(),
          })
          .assumeNonEmpty(),
        newConnectionSize
      );
    }

    return this.copy(
      newLinkMap
        .modifyAt(node2, {
          ifNew: () => this.context.linkConnectionsContext.of(node1),
          ifExists: (targets) => targets.add(node1),
        })
        .assumeNonEmpty(),
      newConnectionSize
    );
  }

  connectAll(
    links: StreamSource<WithGraphValues<Tp, N, unknown>['link']>
  ): TpG['nonEmpty'] {
    const builder = this.toBuilder();
    builder.connectAll(links as any);
    return builder.build().assumeNonEmpty();
  }

  disconnect<UN = N>(
    node1: RelatedTo<N, UN>,
    node2: RelatedTo<N, UN>
  ): WithGraphValues<Tp, N, unknown>['nonEmpty'] {
    if (
      !this.linkMap.context.isValidKey(node1) ||
      !this.linkMap.context.isValidKey(node2)
    )
      return this as any;

    const newLinkMap = this.linkMap.updateAt(node1, (targets) =>
      targets.remove(node2)
    );

    if (newLinkMap === this.linkMap) return this as any;

    const newConnectionSize = this.connectionSize - 1;

    if (this.isDirected) {
      return this.copy(newLinkMap, newConnectionSize);
    }

    return this.copy(
      newLinkMap.updateAt(node2, (targets) => targets.remove(node1)),
      newConnectionSize
    );
  }

  disconnectAll<UN = N>(
    links: StreamSource<Link<RelatedTo<N, UN>>>
  ): TpG['nonEmpty'] {
    const builder = this.toBuilder();
    builder.disconnectAll(links);
    return builder.build().assumeNonEmpty();
  }

  removeUnconnectedNodes(): WithGraphValues<Tp, N, unknown>['normal'] {
    if (!this.isDirected) {
      const newLinkMap = this.linkMap.filter(([_, targets]) =>
        targets.nonEmpty()
      );
      return this.copyE(newLinkMap, this.connectionSize);
    }

    const unconnectedNodes = this.linkMap
      .stream()
      .collect(([source, targets], _, skip) => {
        if (
          targets.isEmpty &&
          !this.linkMap.streamValues().some((t) => t.has(source))
        ) {
          return source;
        }
        return skip;
      });

    return this.removeNodes(unconnectedNodes);
  }

  toString(): string {
    const connector = this.isDirected ? '->' : '<->';
    return this.linkMap.stream().join({
      start: `${this.context.typeTag}(\n  `,
      sep: ',\n  ',
      end: '\n)',
      valueToString: ([node, targets]) =>
        `${node} ${connector} ${targets
          .stream()
          .join({ start: '[', sep: ', ', end: ']' })}`,
    });
  }

  toJSON(): ToJSON<[N, [N][]][]> {
    return {
      dataType: this.context.typeTag,
      value: this.linkMap
        .stream()
        .map(
          (entry) =>
            [
              entry[0],
              entry[1]
                .stream()
                .map((v) => [v] as [N])
                .toArray(),
            ] as [N, [N][]]
        )
        .toArray(),
    };
  }

  toBuilder(): TpG['builder'] {
    return this.context.createBuilder(this as any);
  }

  extendValues(): any {
    return this;
  }
}
