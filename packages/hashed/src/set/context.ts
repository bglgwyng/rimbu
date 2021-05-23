import { CustomBase } from '@rimbu/collection-types';
import { Eq } from '@rimbu/common';
import { List } from '@rimbu/list';
import {
  HashSetBlock,
  HashSetBlockBuilder,
  HashSetCollision,
  HashSetEmpty,
  HashSetNonEmptyBase,
  SetEntrySet,
} from '../hashset-custom';
import { Hasher, HashSet } from '../internal';

export class HashSetContext<UT>
  extends CustomBase.RSetBase.ContextBase<UT, HashSet.Types>
  implements HashSet.Context<UT> {
  constructor(
    readonly hasher: Hasher<UT>,
    readonly eq: Eq<UT>,
    readonly blockSizeBits: number,
    readonly listContext: List.Context
  ) {
    super();
  }

  readonly typeTag = 'HashSet';
  readonly blockCapacity = 1 << this.blockSizeBits;
  readonly blockMask = this.blockCapacity - 1;
  readonly maxDepth = Math.ceil(32 / this.blockSizeBits);

  readonly _empty: HashSet<any> = new HashSetEmpty<any>(this);
  readonly _emptyBlock: HashSetBlock<any> = new HashSetBlock(
    this,
    null,
    null,
    0,
    0
  );

  isNonEmptyInstance(source: any): source is any {
    return source instanceof HashSetNonEmptyBase;
  }

  hash(value: UT): number {
    return this.hasher.hash(value);
  }

  getKeyIndex(level: number, hash: number): number {
    const shift = this.blockSizeBits * level;
    return (hash >>> shift) & this.blockMask;
  }

  emptyBlock(): HashSetBlock<UT> {
    return this._emptyBlock;
  }

  isValidValue(value: unknown): value is UT {
    return this.hasher.isValid(value);
  }

  builder = <T extends UT>(): HashSet.Builder<T> => {
    return new HashSetBlockBuilder<T>(this as any);
  };

  createBuilder<T extends UT>(
    source?: HashSet.NonEmpty<T>
  ): HashSet.Builder<T> {
    return new HashSetBlockBuilder<T>(this as any, source as any);
  }

  block(
    entries: readonly UT[] | null,
    entrySets: SetEntrySet<UT>[] | null,
    size: number,
    level: number
  ): HashSetBlock<UT> {
    return new HashSetBlock(
      (this as unknown) as HashSetContext<UT>,
      entries,
      entrySets,
      size,
      level
    );
  }

  collision(entries: List.NonEmpty<UT>): HashSetCollision<UT> {
    return new HashSetCollision(
      (this as unknown) as HashSetContext<UT>,
      entries
    );
  }
}
