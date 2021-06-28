import { RimbuError } from '@rimbu/base';
import type { OptLazy, TraverseState, Update } from '@rimbu/common';
import type { BuilderBase, LeafBlock, NonLeafBlock } from '../list-custom';

export function createFromBlock<T>(
  input: LeafBlock<T> | NonLeafBlock<T, any>
): BlockBuilder<T, any> {
  if (input.context.isLeafBlock(input)) {
    return input.context.leafBlockBuilderSource(input);
  }
  if (input.context.isNonLeafBlock(input)) {
    return input.context.nonLeafBlockBuilderSource(input);
  }

  RimbuError.throwInvalidStateError();
}

export interface BlockBuilder<T, C = unknown> extends BuilderBase<T, C> {
  level: number;
  nrChildren: number;
  children: C[];
  updateAt<O>(index: number, update: Update<T>, otherwise?: OptLazy<O>): T | O;
  remove(index: number): T;
  dropFirst(): C;
  dropLast(): C;
  copy(children: C[], length: number): BlockBuilder<T, C>;
  splitRight(index?: number): BlockBuilder<T, C>;
  concat(other: BlockBuilder<T, C>): void;
  forEach(
    f: (value: T, index: number, halt: () => void) => void,
    state?: TraverseState
  ): void;
}
