import { CustomBase } from '@rimbu/collection-types';
import type { Comp } from '@rimbu/common';
import type { SortedMap } from '../internal';
import {
  SortedMapBuilder,
  SortedMapEmpty,
  SortedMapInner,
  SortedMapLeaf,
  SortedMapNode,
} from '../sortedmap-custom';

export class SortedMapContext<UK>
  extends CustomBase.RMapBase.ContextBase<UK, SortedMap.Types>
  implements SortedMap.Context<UK>
{
  readonly maxEntries: number;
  readonly minEntries: number;

  readonly _empty: SortedMap<any, any>;

  constructor(readonly blockSizeBits: number, readonly comp: Comp<UK>) {
    super();

    this.maxEntries = 1 << blockSizeBits;
    this.minEntries = this.maxEntries >>> 1;

    this._empty = new SortedMapEmpty<any, any>(this);
  }

  readonly typeTag = 'SortedMap';

  isNonEmptyInstance(source: any): source is any {
    return source instanceof SortedMapNode;
  }

  builder = <K extends UK, V>(): SortedMapBuilder<K, V> => {
    return new SortedMapBuilder(this as any);
  };

  createBuilder<K extends UK, V>(
    source?: SortedMap<K, V>
  ): SortedMapBuilder<K, V> {
    return new SortedMapBuilder(this as any, source);
  }

  isValidKey(key: any): key is UK {
    return this.comp.isComparable(key);
  }

  findIndex(key: UK, entries: readonly (readonly [UK, unknown])[]): number {
    let start = 0;
    let end = entries.length - 1;

    while (start <= end) {
      const mid = (start + end) >>> 1;
      const midEntry = entries[mid];
      const comp = this.comp.compare(key, midEntry[0]);

      if (comp < 0) end = mid - 1;
      else if (comp > 0) start = mid + 1;
      else return mid;
    }

    return -(start + 1);
  }

  leaf<V>(entries: readonly (readonly [UK, V])[]): SortedMapLeaf<UK, V> {
    return new SortedMapLeaf<UK, V>(this, entries);
  }

  inner<V>(
    entries: readonly (readonly [UK, V])[],
    children: readonly SortedMapNode<UK, V>[],
    size: number
  ): SortedMapInner<UK, V> {
    return new SortedMapInner(this, entries, children, size);
  }
}
