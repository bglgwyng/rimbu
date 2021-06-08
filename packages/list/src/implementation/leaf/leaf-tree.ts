import { RimbuError } from '@rimbu/base';
import {
  ArrayNonEmpty,
  IndexRange,
  OptLazy,
  TraverseState,
  Update,
} from '@rimbu/common';
import { Stream, StreamSource } from '@rimbu/stream';
import type { List } from '../../internal';
import type { LeafBlock, ListContext, NonLeaf, Tree } from '../../list-custom';
import {
  ListNonEmptyBase,
  treeAppend,
  treeForEach,
  treeGet,
  treePrepend,
  treeStream,
  treeToArray,
  treeUpdate,
} from '../../list-custom';

export class LeafTree<T>
  extends ListNonEmptyBase<T>
  implements Tree<T, LeafTree<T>, LeafBlock<T>, T>
{
  constructor(
    readonly context: ListContext,
    readonly left: LeafBlock<T>,
    readonly right: LeafBlock<T>,
    readonly middle: NonLeaf<T, LeafBlock<T>> | null,
    readonly length = left.length +
      right.length +
      (null === middle ? 0 : middle.length)
  ) {
    super();
  }

  getChildLength(): 1 {
    return 1;
  }

  copy(
    left = this.left,
    right = this.right,
    middle = this.middle
  ): LeafTree<T> {
    if (left === this.left && right === this.right && middle === this.middle)
      return this;
    return this.context.leafTree(left, right, middle);
  }

  copy2<T2>(
    left: LeafBlock<T2>,
    right: LeafBlock<T2>,
    middle: NonLeaf<T2, LeafBlock<T2>> | null
  ): LeafTree<T2> {
    return this.context.leafTree(left, right, middle);
  }

  stream(reversed = false): Stream.NonEmpty<T> {
    return treeStream<T, LeafTree<T>, LeafBlock<T>, T>(
      this,
      undefined,
      reversed
    ) as Stream.NonEmpty<T>;
  }

  streamRange(range: IndexRange, reversed = false): Stream<T> {
    return treeStream<T, LeafTree<T>, LeafBlock<T>, T>(this, range, reversed);
  }

  get<O>(index: number, otherwise?: OptLazy<O>): T | O {
    if (index >= this.length || -index > this.length) {
      return OptLazy(otherwise) as O;
    }
    if (index < 0) {
      return this.get(this.length + index, otherwise);
    }

    return treeGet<T, LeafTree<T>, LeafBlock<T>, T>(this, index);
  }

  prepend(value: T): List.NonEmpty<T> {
    return treePrepend(this, value);
  }

  append(value: T): List.NonEmpty<T> {
    return treeAppend(this, value);
  }

  prependMiddle(child: LeafBlock<T>): NonLeaf<T, LeafBlock<T>> {
    return (
      this.middle?.prepend(child) ??
      this.context.nonLeafBlock<T, LeafBlock<T>>(child.length, [child], 1)
    );
  }

  appendMiddle(child: LeafBlock<T>): NonLeaf<T, LeafBlock<T>> {
    return (
      this.middle?.append(child) ??
      this.context.nonLeafBlock<T, LeafBlock<T>>(child.length, [child], 1)
    );
  }

  take(amount: number): List<T> | any {
    if (amount === 0) return this.context.empty();
    if (amount >= this.length || -amount > this.length) return this;
    if (amount < 0) return this.drop(this.length + amount);

    const middleAmount = amount - this.left.length;

    if (middleAmount <= 0) return this.left.take(amount);

    if (null === this.middle) {
      return this.copy(
        undefined,
        this.right.takeChildren(middleAmount)
      )._normalize();
    }

    const rightAmount = middleAmount - this.middle.length;

    if (rightAmount > 0) {
      const newRight = this.right.takeChildren(rightAmount);
      return this.copy(undefined, newRight)._normalize();
    }

    const [newMiddle, upRight, inUpRight] =
      this.middle.takeInternal(middleAmount);

    const newRight = upRight.takeChildren(inUpRight);

    return this.copy(undefined, newRight, newMiddle)._normalize();
  }

  drop(amount: number): List<T> {
    if (amount === 0) return this;
    if (amount >= this.length || -amount > this.length)
      return this.context.empty();
    if (amount < 0) return this.take(this.length + amount);

    const middleAmount = amount - this.left.length;

    if (middleAmount < 0) {
      const newLeft = this.left.dropChildren(amount);
      return this.copy(newLeft)._normalize();
    }

    if (null === this.middle) {
      return this.right.drop(middleAmount);
    }

    const rightAmount = middleAmount - this.middle.length;

    if (rightAmount >= 0) {
      return this.right.drop(rightAmount);
    }

    const [newMiddle, upLeft, inUpLeft] =
      this.middle.dropInternal(middleAmount);
    const newLeft = upLeft.dropChildren(inUpLeft);

    return this.copy(newLeft, undefined, newMiddle)._normalize();
  }

  concat(...sources: ArrayNonEmpty<StreamSource<T>>): List.NonEmpty<T> {
    const asList: List<T> = this.context.from(...sources);

    if (asList.nonEmpty()) {
      if (this.context.isLeafBlock(asList)) return this.concatBlock(asList);
      else if (this.context.isLeafTree(asList)) return this.concatTree(asList);
      else RimbuError.throwInvalidStateError();
    }

    return this;
  }

  concatBlock(other: LeafBlock<T>): List.NonEmpty<T> {
    if (this.right.length + other.length <= this.context.maxBlockSize) {
      const newRight = this.right.concatChildren(other);
      return this.copy(undefined, newRight);
    }

    if (this.right.childrenInMin) {
      const newMiddle = this.appendMiddle(this.right);

      return this.copy(undefined, other, newMiddle);
    }

    const newRight = this.right.concatChildren(other);
    const newLast = newRight._mutateSplitRight(this.context.maxBlockSize);
    const newMiddle = this.appendMiddle(newRight);

    return this.copy(undefined, newLast, newMiddle);
  }

  concatTree(other: LeafTree<T>): List.NonEmpty<T> {
    const jointLength = this.right.length + other.left.length;

    if (jointLength < this.context.minBlockSize) {
      if (null === this.middle) {
        // left + right > maxBlockSize
        const joint = this.left
          .concatChildren(this.right)
          .concatChildren(other.left);
        const toMiddle = joint._mutateSplitRight();
        const newMiddle = other.prependMiddle(toMiddle);

        return other.copy(joint, undefined, newMiddle);
      }

      const [newMiddle, toJoint] = this.middle.dropLast();
      const joint = toJoint
        .concatChildren(this.right)
        .concatChildren(other.left);

      if (joint.childrenInMax) {
        const m =
          null === newMiddle
            ? other.prependMiddle(joint)
            : newMiddle.concat(other.prependMiddle(joint));
        return this.copy(undefined, other.right, m);
      }

      const newOtherLeft = joint._mutateSplitRight();
      const newMiddle2 =
        null === newMiddle
          ? other.prependMiddle(newOtherLeft).prepend(joint)
          : null === other.middle
          ? newMiddle.append(joint).append(newOtherLeft)
          : newMiddle.append(joint).append(newOtherLeft).concat(other.middle);
      return this.copy(undefined, other.right, newMiddle2);
    }

    if (jointLength <= this.context.maxBlockSize) {
      const joint = this.right.concatChildren(other.left);
      const newThisMiddle = this.appendMiddle(joint);
      const newMiddle =
        null === other.middle
          ? newThisMiddle
          : newThisMiddle.concat(other.middle);
      return this.copy(undefined, other.right, newMiddle);
    }

    if (this.right.childrenInMin && other.left.childrenInMin) {
      const newThisMiddle = this.appendMiddle(this.right).append(other.left);
      const newMiddle =
        null === other.middle
          ? newThisMiddle
          : newThisMiddle.concat(other.middle);

      return this.copy(undefined, other.right, newMiddle);
    }

    const joint = this.right.concatChildren(other.left);
    const jointRight = joint._mutateSplitRight();

    const newThisMiddle = this.appendMiddle(joint).append(jointRight);
    const newMiddle =
      null === other.middle
        ? newThisMiddle
        : newThisMiddle.concat(other.middle);

    return this.copy(undefined, other.right, newMiddle);
  }

  updateAt(index: number, update: Update<T>): LeafTree<T> {
    if (index >= this.length || -index > this.length) return this;
    if (index < 0) return this.updateAt(this.length + index, update);

    return treeUpdate<T, LeafTree<T>, LeafBlock<T>, T>(this, index, update);
  }

  forEach(
    f: (value: T, index: number, halt: () => void) => void,
    state: TraverseState = TraverseState()
  ): void {
    if (state.halted) return;

    treeForEach<T, LeafTree<T>, LeafBlock<T>, T>(this, f, state);
  }

  map<T2>(
    mapFun: (value: T, index: number) => T2,
    reversed = false,
    indexOffset = 0
  ): LeafTree<T2> {
    let offset = indexOffset;

    if (reversed) {
      const newLeft = this.right.map(mapFun, true, offset);
      offset += this.right.length;

      const newMiddle =
        null === this.middle ? null : this.middle.map(mapFun, true, offset);
      if (null !== this.middle) offset += this.middle.length;

      const newRight = this.left.map(mapFun, true, offset);

      return this.copy2(newLeft, newRight, newMiddle);
    }

    const newLeft = this.left.map(mapFun, false, offset);
    offset += this.left.length;

    const newMiddle =
      null === this.middle ? null : this.middle.map(mapFun, false, offset);
    if (null !== this.middle) offset += this.middle.length;

    const newRight = this.right.map(mapFun, false, offset);

    return this.copy2(newLeft, newRight, newMiddle);
  }

  reversed(): LeafTree<T> {
    return this.copy(
      this.right.reversed(),
      this.left.reversed(),
      null === this.middle ? null : this.middle.reversed()
    );
  }

  toArray(range?: IndexRange, reversed = false): T[] | any {
    return treeToArray<T, LeafTree<T>, LeafBlock<T>, T>(this, range, reversed);
  }

  _normalize(): List.NonEmpty<T> {
    if (null !== this.middle) {
      if (this.left.length + this.middle.length <= this.context.maxBlockSize) {
        const result = this.middle.dropFirst();
        const block = result[1];
        return this.copy(this.left.concatChildren(block), undefined, null);
      }
      if (this.right.length + this.middle.length <= this.context.maxBlockSize) {
        const result = this.middle.dropFirst();
        const block = result[1];
        return this.copy(undefined, block.concatChildren(this.right), null);
      }
    }
    if (this.length > this.context.maxBlockSize) return this;
    if (null === this.middle) return this.left.concatChildren(this.right);
    if (this.context.isNonLeafBlock(this.middle)) {
      const children = this.left.children.concat(
        this.middle.getChild(0).children,
        this.right.children
      );
      return this.left.copy(children);
    }

    RimbuError.throwInvalidStateError();
  }

  structure(): string {
    return `<LeafTree len:${this.length}\n l:${this.left.structure()}\n m: ${
      this.middle && this.middle.structure()
    }\n r:${this.right.structure()}\n>`;
  }
}
