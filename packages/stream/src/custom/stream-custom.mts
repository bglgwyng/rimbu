import { RimbuError, type Token } from '@rimbu/base';
import {
  Comp,
  Eq,
  ErrBase,
  IndexRange,
  OptLazy,
  Range,
  TraverseState,
  type ArrayNonEmpty,
  type CollectFun,
  type ToJSON,
} from '@rimbu/common';

import type { StreamConstructors } from '@rimbu/stream/custom';
import {
  AlwaysIterator,
  AppendIterator,
  ArrayIterator,
  ArrayReverseIterator,
  CollectIterator,
  ConcatIterator,
  DistinctPreviousIterator,
  DropIterator,
  DropWhileIterator,
  FilterApplyIterator,
  FilterIterator,
  FilterPureIterator,
  FlatMapIterator,
  IndexedIterator,
  IndicesOfIterator,
  IndicesWhereIterator,
  IntersperseIterator,
  MapApplyIterator,
  MapIterator,
  MapPureIterator,
  PrependIterator,
  RandomIntIterator,
  RandomIterator,
  RangeDownIterator,
  RangeUpIterator,
  ReduceIterator,
  RepeatIterator,
  SplitOnIterator,
  SplitOnSeqIterator,
  SplitWhereIterator,
  TakeIterator,
  TakeWhileIterator,
  UnfoldIterator,
  WindowIterator,
  ZipAllWithItererator,
  ZipWithIterator,
  emptyFastIterator,
  isFastIterator,
} from '@rimbu/stream/custom';
import { Reducer } from '@rimbu/stream';
import type {
  FastIterator,
  Stream,
  StreamSource,
  Transformer,
} from '@rimbu/stream';

function* yieldObjKeys<K extends string | number | symbol>(
  obj: Record<K, any>
): Generator<K> {
  for (const key in obj) {
    yield key;
  }
}

function* yieldObjValues<V>(obj: Record<any, V>): Generator<V> {
  for (const key in obj) {
    yield (obj as any)[key];
  }
}

function* yieldObjEntries<K extends string | number | symbol, V>(
  obj: Record<K, V>
): Generator<[K, V]> {
  for (const key in obj) {
    yield [key, obj[key]];
  }
}

export abstract class StreamBase<T> implements Stream<T> {
  abstract [Symbol.iterator](): FastIterator<T>;

  stream(): this {
    return this;
  }

  equals(
    other: StreamSource<T>,
    { eq = Eq.objectIs, negate = false }: { eq?: Eq<T>; negate?: boolean } = {}
  ): boolean {
    const it1 = this[Symbol.iterator]();
    const it2 = fromStreamSource(other)[Symbol.iterator]();

    const done = Symbol('Done');
    while (true) {
      const v1 = it1.fastNext(done);
      const v2 = it2.fastNext(done);
      if (done === v1 || done === v2) return Object.is(v1, v2);
      if (eq(v1, v2) === negate) return false;
    }
  }

  assumeNonEmpty(): Stream.NonEmpty<T> {
    return this as unknown as Stream.NonEmpty<T>;
  }

  asNormal(): Stream<T> {
    return this;
  }

  prepend(value: OptLazy<T>): Stream.NonEmpty<T> {
    return new PrependStream<T>(this, value).assumeNonEmpty();
  }

  append(value: OptLazy<T>): Stream.NonEmpty<T> {
    return new AppendStream<T>(this, value).assumeNonEmpty();
  }

  forEach(
    f: (value: T, index: number, halt: () => void) => void,
    options: { state?: TraverseState } = {}
  ): void {
    const { state = TraverseState() } = options;

    if (state.halted) return;

    const done = Symbol('Done');
    let value: T | typeof done;
    const iterator = this[Symbol.iterator]();

    const { halt } = state;

    while (!state.halted && done !== (value = iterator.fastNext(done))) {
      f(value, state.nextIndex(), halt);
    }
  }

  forEachPure<A extends readonly unknown[]>(
    f: (value: T, ...args: A) => void,
    ...args: A
  ): void {
    const done = Symbol('Done');
    let value: T | typeof done;
    const iterator = this[Symbol.iterator]();

    while (done !== (value = iterator.fastNext(done))) {
      f(value, ...args);
    }
  }

  indexed(options: { startIndex?: number } = {}): Stream<[number, T]> {
    const { startIndex = 0 } = options;
    return new IndexedStream<T>(this, startIndex);
  }

  map<T2>(mapFun: (value: T, index: number) => T2): Stream<T2> {
    return new MapStream<T, T2>(this, mapFun);
  }

  mapPure<T2, A extends readonly unknown[]>(
    mapFun: (value: T, ...args: A) => T2,
    ...args: A
  ): Stream<T2> {
    return new MapPureStream<T, A, T2>(this, mapFun, args);
  }

  flatMap<T2>(
    flatMapFun: (value: T, index: number, halt: () => void) => StreamSource<T2>
  ): Stream<T2> {
    return new FlatMapStream<T, T2>(this, flatMapFun);
  }

  flatZip<T2>(
    flatMapFun: (value: T, index: number, halt: () => void) => StreamSource<T2>
  ): Stream<[T, T2]> {
    return this.flatMap((value, index, halt) =>
      fromStreamSource(flatMapFun(value, index, halt)).map((result) => [
        value,
        result,
      ])
    );
  }

  transform<R>(transformer: Transformer<T, R>): Stream<R> {
    return StreamConstructorsImpl.flatten(this.reduceStream(transformer));
  }

  filter(
    pred: (value: T, index: number, halt: () => void) => boolean,
    options: { negate?: boolean } = {}
  ): Stream<T> {
    const { negate = false } = options;

    return new FilterStream<T>(this, pred, negate);
  }

  filterPure<A extends readonly unknown[]>(
    options: {
      pred: (value: T, ...args: A) => boolean;
      negate?: boolean;
    },
    ...args: A
  ): Stream<T> {
    const { pred, negate = false } = options;

    return new FilterPureStream<T, A>(this, pred, args, negate);
  }

  collect<R>(collectFun: CollectFun<T, R>): Stream<R> {
    return new CollectStream<T, R>(this, collectFun);
  }

  first<O>(otherwise?: OptLazy<O>): T | O {
    return this[Symbol.iterator]().fastNext(otherwise!);
  }

  last<O>(otherwise?: OptLazy<O>): T | O {
    const done = Symbol('Done');
    let value: T | typeof done;
    let lastValue: T | typeof done = done;
    const iterator = this[Symbol.iterator]();

    while (done !== (value = iterator.fastNext(done))) {
      lastValue = value;
    }

    if (done === lastValue) return OptLazy(otherwise) as O;
    return lastValue;
  }

  single<O>(otherwise?: OptLazy<O>): T | O {
    const iterator = this[Symbol.iterator]();
    const done = Symbol('Done');

    const value = iterator.fastNext(done);

    if (done !== value) {
      if (done === iterator.fastNext(done)) {
        return value;
      }
    }

    return OptLazy(otherwise!);
  }

  count(): number {
    let result = 0;

    const done = Symbol('Done');
    const iterator = this[Symbol.iterator]();

    while (done !== iterator.fastNext(done)) result++;

    return result;
  }

  countElement(
    value: T,
    options: { eq?: Eq<T>; negate?: boolean } = {}
  ): number {
    const { eq = Eq.objectIs, negate = false } = options;

    let result = 0;

    const done = Symbol('Done');
    const iterator = this[Symbol.iterator]();
    let current: T | typeof done;

    while (done !== (current = iterator.fastNext(done))) {
      if (eq(value, current) !== negate) result++;
    }

    return result;
  }

  find<O>(
    pred: (value: T, index: number) => boolean,
    options: {
      occurrance?: number;
      negate?: boolean;
      otherwise?: OptLazy<O>;
    } = {}
  ): T | O {
    const { occurrance = 1, negate = false, otherwise } = options;

    if (occurrance <= 0) return OptLazy(otherwise) as O;

    const done = Symbol('Done');
    const iterator = this[Symbol.iterator]();
    let value: T | typeof done;
    let remain = occurrance;
    let index = 0;

    while (done !== (value = iterator.fastNext(done))) {
      if (pred(value, index++) !== negate && --remain <= 0) return value;
    }

    return OptLazy(otherwise) as O;
  }

  elementAt<O>(index: number, otherwise?: OptLazy<O>): T | O {
    if (index < 0) return OptLazy(otherwise) as O;

    const done = Symbol('Done');
    const iterator = this[Symbol.iterator]();
    let value: T | typeof done;
    let i = 0;

    while (i <= index && done !== (value = iterator.fastNext(done))) {
      if (i === index) return value;
      i++;
    }

    return OptLazy(otherwise) as O;
  }

  indicesWhere(
    pred: (value: T) => boolean,
    options: { negate?: boolean } = {}
  ): Stream<number> {
    const { negate = false } = options;
    return new IndicesWhereStream<T>(this, pred, negate);
  }

  indicesOf(
    searchValue: T,
    options: { eq?: Eq<T>; negate?: boolean } = {}
  ): Stream<number> {
    const { eq = Eq.objectIs, negate = false } = options;

    return new IndicesOfStream<T>(this, searchValue, eq, negate);
  }

  indexWhere(
    pred: (value: T, index: number) => boolean,
    options: {
      occurrance?: number;
      negate?: boolean;
    } = {}
  ): number | undefined {
    const { occurrance = 1, negate = false } = options;

    if (occurrance <= 0) return undefined;

    const done = Symbol('Done');
    let value: T | typeof done;
    const iterator = this[Symbol.iterator]();
    let index = 0;
    let occ = 0;

    while (done !== (value = iterator.fastNext(done))) {
      const i = index++;

      if (pred(value, i) !== negate) {
        occ++;
        if (occ >= occurrance) return i;
      }
    }

    return undefined;
  }

  indexOf(
    searchValue: T,
    options: { occurrance?: number; eq?: Eq<T>; negate?: boolean } = {}
  ): number | undefined {
    const { occurrance = 1 } = options;

    if (occurrance <= 0) return undefined;

    const { eq = Eq.objectIs, negate = false } = options;

    const done = Symbol('Done');
    let value: T | typeof done;
    const iterator = this[Symbol.iterator]();
    let index = 0;
    let occ = 0;

    while (done !== (value = iterator.fastNext(done))) {
      const i = index++;

      if (eq(value, searchValue) !== negate) {
        occ++;
        if (occ >= occurrance) return i;
      }
    }

    return undefined;
  }

  some(
    pred: (value: T, index: number) => boolean,
    options: { negate?: boolean } = {}
  ): boolean {
    return undefined !== this.indexWhere(pred, options);
  }

  every(
    pred: (value: T, index: number) => boolean,
    options: { negate?: boolean } = {}
  ): boolean {
    const { negate = false } = options;

    return undefined === this.indexWhere(pred, { negate: !negate });
  }

  contains(
    searchValue: T,
    options: { amount?: number; eq?: Eq<T>; negate?: boolean } = {}
  ): boolean {
    const { amount = 1 } = options;

    if (amount <= 0) return true;

    const { eq = Eq.objectIs, negate = false } = options;

    return (
      undefined !==
      this.indexOf(searchValue, { occurrance: amount, eq, negate })
    );
  }

  containsSlice(
    source: StreamSource.NonEmpty<T>,
    options: { eq?: Eq<T> } = {}
  ): boolean {
    const { eq = Eq.objectIs } = options;

    const iterator = this[Symbol.iterator]();
    const sourceStream = fromStreamSource(source);
    let sourceIterator = sourceStream[Symbol.iterator]();

    const done = Symbol('Done');

    while (true) {
      const sourceValue = sourceIterator.fastNext(done);
      if (done === sourceValue) return true;

      const value = iterator.fastNext(done);
      if (done === value) return false;

      if (!eq(sourceValue, value)) {
        sourceIterator = sourceStream[Symbol.iterator]();
      }
    }
  }

  takeWhile(
    pred: (value: T, index: number) => boolean,
    options: { negate?: boolean } = {}
  ): Stream<T> {
    const { negate = false } = options;

    return new TakeWhileStream<T>(this, pred, negate);
  }

  dropWhile(
    pred: (value: T, index: number) => boolean,
    options: { negate?: boolean } = {}
  ): Stream<T> {
    const { negate = false } = options;

    return new DropWhileStream<T>(this, pred, negate);
  }

  take(amount: number): Stream<T> {
    if (amount <= 0) return emptyStream;

    return new TakeStream<T>(this, amount);
  }

  drop(amount: number): Stream<T> {
    if (amount <= 0) return this;

    return new DropStream<T>(this, amount);
  }

  repeat(amount?: number): Stream<T> {
    if (undefined !== amount && amount <= 1) return this;

    return new FromStream<T>(() => new RepeatIterator<T>(this, amount));
  }

  concat(...others: ArrayNonEmpty<StreamSource<T>>): Stream.NonEmpty<T> {
    if (others.every(isEmptyStreamSourceInstance)) {
      return this.assumeNonEmpty();
    }

    return new ConcatStream<T>(this, others).assumeNonEmpty();
  }

  min<O>(otherwise?: OptLazy<O>): T | O {
    return this.minBy(Comp.defaultComp().compare, otherwise);
  }

  minBy<O>(compare: (v1: T, v2: T) => number, otherwise?: OptLazy<O>): T | O {
    const done = Symbol('Done');
    const iterator = this[Symbol.iterator]();
    let result: T | typeof done = iterator.fastNext(done);

    if (done === result) return OptLazy(otherwise) as O;

    let value: T | typeof done;
    while (done !== (value = iterator.fastNext(done))) {
      if (compare(value, result) < 0) result = value;
    }

    return result;
  }

  max<O>(otherwise?: OptLazy<O>): T | O {
    return this.maxBy(Comp.defaultComp().compare, otherwise);
  }

  maxBy<O>(compare: (v1: T, v2: T) => number, otherwise?: OptLazy<O>): T | O {
    const done = Symbol('Done');
    const iterator = this[Symbol.iterator]();
    let result: T | typeof done = iterator.fastNext(done);

    if (done === result) return OptLazy(otherwise) as O;

    let value: T | typeof done;
    while (done !== (value = iterator.fastNext(done))) {
      if (compare(value, result) > 0) result = value;
    }

    return result;
  }

  intersperse(sep: StreamSource<T>): Stream<T> {
    if (isEmptyStreamSourceInstance(sep)) return this;

    const sepStream = fromStreamSource(sep);

    return new IntersperseStream<T>(this, sepStream);
  }

  join({
    sep = '',
    start = '',
    end = '',
    valueToString = String,
    ifEmpty = undefined,
  } = {}): string {
    const done = Symbol('Done');
    const iterator = this[Symbol.iterator]();
    let value: T | typeof done = iterator.fastNext(done);

    if (done === value) {
      if (undefined !== ifEmpty) return ifEmpty;
      return start.concat(end);
    }

    let result = start.concat(valueToString(value));

    while (done !== (value = iterator.fastNext(done))) {
      result = result.concat(sep, valueToString(value));
    }

    return result.concat(end);
  }

  mkGroup({
    sep = emptyStream as StreamSource<T>,
    start = emptyStream as StreamSource<T>,
    end = emptyStream as StreamSource<T>,
  } = {}): any {
    return fromStreamSource(start).concat(this.intersperse(sep), end);
  }

  splitWhere<R>(
    pred: (value: T, index: number) => boolean,
    options: { negate?: boolean; collector?: Reducer<T, R> | undefined } = {}
  ): Stream<R> {
    const { negate = false, collector = Reducer.toArray() as Reducer<T, R> } =
      options;

    return new SplitWhereStream<T, R>(this, pred, negate, collector);
  }

  splitOn<R>(
    sepElem: T,
    options: {
      eq?: Eq<T>;
      negate?: boolean;
      collector?: Reducer<T, R> | undefined;
    } = {}
  ): Stream<R> {
    const {
      eq = Object.is,
      negate = false,
      collector = Reducer.toArray() as Reducer<T, R>,
    } = options;

    return new SplitOnStream<T, R>(this, sepElem, eq, negate, collector);
  }

  splitOnSeq<R>(
    sepSeq: StreamSource<T>,
    options: { eq?: Eq<T>; collector?: Reducer<T, R> | undefined } = {}
  ): Stream<R> {
    const { eq = Object.is, collector = Reducer.toArray() as Reducer<T, R> } =
      options;

    return new SplitOnSeq<T, R>(this, sepSeq, eq, collector);
  }

  distinctPrevious(options: { eq?: Eq<T>; negate?: boolean } = {}): Stream<T> {
    const { eq = Eq.objectIs, negate = false } = options;

    return new DistinctPreviousStream<T>(this, eq, negate);
  }

  window<R>(
    windowSize: number,
    options: {
      skipAmount?: number;
      collector?: Reducer<T, R> | undefined;
    } = {}
  ): Stream<R> {
    const { skipAmount = windowSize, collector = Reducer.toArray() as any } =
      options;

    return new WindowStream<T, R>(this, windowSize, skipAmount, collector);
  }

  fold<R>(
    init: OptLazy<R>,
    next: (current: R, value: T, index: number, halt: () => void) => R
  ): R {
    return this.reduce(Reducer.createOutput<T, R>(() => OptLazy(init), next));
  }

  foldStream<R>(
    init: OptLazy<R>,
    next: (current: R, value: T, index: number, halt: () => void) => R
  ): Stream<R> {
    return this.reduceStream(
      Reducer.createOutput<T, R>(() => OptLazy(init), next)
    );
  }

  reduce<const S extends Reducer.CombineShape<T>>(
    shape: S & Reducer.CombineShape<T>
  ): Reducer.CombineResult<S> {
    const reducerInstance = Reducer.combine(
      shape
    ).compile() as Reducer.Instance<T, Reducer.CombineResult<S>>;

    const done = Symbol('Done');
    let value: T | typeof done;
    const iter = this[Symbol.iterator]();

    while (!reducerInstance.halted && done !== (value = iter.fastNext(done))) {
      reducerInstance.next(value);
    }

    return reducerInstance.getOutput();
  }

  reduceStream<const S extends Reducer.CombineShape<T>>(
    shape: S & Reducer.CombineShape<T>
  ): Stream<Reducer.CombineResult<S>> {
    const reducer = Reducer.combine(shape) as Reducer<
      T,
      Reducer.CombineResult<S>
    >;

    return new ReduceStream(this, reducer);
  }

  toArray(): T[] {
    const iterator = this[Symbol.iterator]();
    const result: T[] = [];
    const done = Symbol('Done');
    let value: T | typeof done;

    while (done !== (value = iterator.fastNext(done))) {
      result.push(value);
    }

    return result;
  }

  toString(): string {
    return `Stream(...<potentially empty>)`;
  }

  toJSON(): ToJSON<T[], 'Stream'> {
    return {
      dataType: 'Stream',
      value: this.toArray(),
    };
  }
}

export class FromStream<T> extends StreamBase<T> {
  [Symbol.iterator]: () => FastIterator<T> = undefined as any;

  constructor(createIterator: () => FastIterator<T>) {
    super();
    this[Symbol.iterator] = createIterator;
  }
}

class PrependStream<T> extends StreamBase<T> {
  constructor(readonly source: Stream<T>, readonly item: OptLazy<T>) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new PrependIterator<T>(this.source[Symbol.iterator](), this.item);
  }

  first(): T {
    return OptLazy(this.item);
  }

  last(): T {
    return this.source.last(this.item);
  }

  count(): number {
    return this.source.count() + 1;
  }

  forEach(
    f: (value: T, index: number, halt: () => void) => void,
    options: { state?: TraverseState } = {}
  ): void {
    const { state = TraverseState() } = options;

    if (state.halted) return;

    f(OptLazy(this.item), state.nextIndex(), state.halt);

    if (state.halted) return;

    this.source.forEach(f, { state });
  }
}

class AppendStream<T> extends StreamBase<T> {
  constructor(readonly source: Stream<T>, readonly item: OptLazy<T>) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new AppendIterator<T>(this.source[Symbol.iterator](), this.item);
  }

  first(): T {
    return this.source.first(this.item);
  }

  last(): T {
    return OptLazy(this.item);
  }

  count(): number {
    return this.source.count() + 1;
  }

  forEach(
    f: (value: T, index: number, halt: () => void) => void,
    options: { state?: TraverseState } = {}
  ): void {
    const { state = TraverseState() } = options;

    if (state.halted) return;

    this.source.forEach(f, { state });

    if (state.halted) return;

    f(OptLazy(this.item), state.nextIndex(), state.halt);
  }
}

class IndexedStream<T> extends StreamBase<[number, T]> {
  constructor(readonly source: Stream<T>, readonly startIndex: number) {
    super();
  }

  [Symbol.iterator](): FastIterator<[number, T]> {
    return new IndexedIterator<T>(
      this.source[Symbol.iterator](),
      this.startIndex
    );
  }

  count(): number {
    return this.source.count();
  }
}

class MapStream<T, T2> extends StreamBase<T2> {
  constructor(
    readonly source: Stream<T>,
    readonly mapFun: (value: T, index: number) => T2
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<T2> {
    return new MapIterator<T, T2>(this.source[Symbol.iterator](), this.mapFun);
  }

  first<O>(otherwise?: OptLazy<O>): T2 | O {
    const done = Symbol('Done');
    const value = this.source.first(done);
    if (done === value) return OptLazy(otherwise) as O;
    return this.mapFun(value, 0);
  }

  last<O>(otherwise?: OptLazy<O>): T2 | O {
    const done = Symbol('Done');
    const value = this.source.last(done);
    if (done === value) return OptLazy(otherwise) as O;
    return this.mapFun(value, 0);
  }

  count(): number {
    return this.source.count();
  }

  elementAt<O>(index: number, otherwise?: OptLazy<O>): T2 | O {
    const done = Symbol('Done');
    const value = this.source.elementAt(index, done);
    if (done === value) return OptLazy(otherwise) as O;
    return this.mapFun(value, index);
  }

  map<T3>(mapFun: (value: T2, index: number) => T3): Stream<T3> {
    return new MapStream<T, T3>(this.source, (value, index) =>
      mapFun(this.mapFun(value, index), index)
    );
  }
}

class MapPureStream<
  T,
  A extends readonly unknown[],
  T2
> extends StreamBase<T2> {
  constructor(
    readonly source: Stream<T>,
    readonly mapFun: (value: T, ...args: A) => T2,
    readonly args: A
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<T2> {
    return new MapPureIterator<T, A, T2>(
      this.source[Symbol.iterator](),
      this.mapFun,
      this.args
    );
  }

  first<O>(otherwise?: OptLazy<O>): T2 | O {
    const done = Symbol('Done');
    const value = this.source.first(done);
    if (done === value) return OptLazy(otherwise) as O;
    return this.mapFun(value, ...this.args);
  }

  last<O>(otherwise?: OptLazy<O>): T2 | O {
    const done = Symbol('Done');
    const value = this.source.last(done);
    if (done === value) return OptLazy(otherwise) as O;
    return this.mapFun(value, ...this.args);
  }

  count(): number {
    return this.source.count();
  }

  elementAt<O>(index: number, otherwise?: OptLazy<O>): T2 | O {
    const done = Symbol('Done');
    const value = this.source.elementAt(index, done);
    if (done === value) return OptLazy(otherwise) as O;
    return this.mapFun(value, ...this.args);
  }
}

class FlatMapStream<T, T2> extends StreamBase<T2> {
  constructor(
    readonly source: Stream<T>,
    readonly flatmapFun: (
      value: T,
      index: number,
      halt: () => void
    ) => StreamSource<T2>
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<T2> {
    return new FlatMapIterator<T, T2>(
      this.source,
      this.flatmapFun,
      streamSourceHelpers
    );
  }
}

class ConcatStream<T> extends StreamBase<T> {
  constructor(
    readonly source: Stream<T>,
    readonly otherSources: StreamSource<T>[]
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new ConcatIterator<T>(
      this.source,
      this.otherSources,
      streamSourceHelpers
    );
  }

  forEach(
    f: (value: T, index: number, halt: () => void) => void,
    options: { state?: TraverseState } = {}
  ): void {
    const { state = TraverseState() } = options;

    if (state.halted) return;

    this.source.forEach(f, { state });

    let sourceIndex = -1;
    const sources = this.otherSources;
    const length = sources.length;

    while (!state.halted && ++sourceIndex < length) {
      const source = sources[sourceIndex];

      if (!isEmptyStreamSourceInstance(source)) {
        fromStreamSource(source).forEach(f, { state });
      }
    }
  }

  last<O>(otherwise?: OptLazy<O>): T | O {
    const sources = this.otherSources;
    let sourceIndex = sources.length;

    while (--sourceIndex >= 0) {
      const source = sources[sourceIndex];

      if (!isEmptyStreamSourceInstance(source)) {
        const done = Symbol('Done');
        const value = fromStreamSource(source).last(done);
        if (done !== value) return value;
      }
    }

    return this.source.last(otherwise!);
  }

  count(): number {
    let result = this.source.count();

    const sources = this.otherSources;
    const length = sources.length;
    let sourceIndex = -1;

    while (++sourceIndex < length) {
      const source = sources[sourceIndex];
      if (!isEmptyStreamSourceInstance(source)) {
        result += fromStreamSource(source).count();
      }
    }

    return result;
  }

  concat<T2>(...others2: StreamSource<T2>[]): any {
    return new ConcatStream<T | T2>(
      this.source,
      (this.otherSources as StreamSource<T | T2>[]).concat(others2)
    );
  }

  toArray(): T[] {
    let result: T[] = this.source.toArray();

    let sourceIndex = -1;
    const sources = this.otherSources;
    const length = sources.length;

    while (++sourceIndex < length) {
      const source = sources[sourceIndex];

      if (!isEmptyStreamSourceInstance(source)) {
        result = result.concat(fromStreamSource(source).toArray());
      }
    }

    return result;
  }
}

class FilterStream<T> extends StreamBase<T> {
  constructor(
    readonly source: Stream<T>,
    readonly pred: (value: T, index: number, halt: () => void) => boolean,
    readonly negate = false
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new FilterIterator<T>(
      this.source[Symbol.iterator](),
      this.pred,
      this.negate
    );
  }

  filter(
    pred: (value: T, index: number, halt: () => void) => boolean,
    options: { negate?: boolean } = {}
  ): Stream<T> {
    const { negate = false } = options;

    return new FilterStream<T>(
      this.source,
      (v, i, halt) =>
        this.pred(v, i, halt) !== this.negate && pred(v, i, halt) !== negate
    );
  }
}

class FilterPureStream<T, A extends readonly unknown[]> extends StreamBase<T> {
  constructor(
    readonly source: Stream<T>,
    readonly pred: (value: T, ...args: A) => boolean,
    readonly args: A,
    readonly negate = false
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new FilterPureIterator<T, A>(
      this.source[Symbol.iterator](),
      this.pred,
      this.args,
      this.negate
    );
  }
}

class CollectStream<T, R> extends StreamBase<R> {
  constructor(
    readonly source: Stream<T>,
    readonly collectFun: CollectFun<T, R>
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<R> {
    return new CollectIterator<T, R>(
      this.source[Symbol.iterator](),
      this.collectFun
    );
  }
}

class IndicesWhereStream<T> extends StreamBase<number> {
  constructor(
    readonly source: Stream<T>,
    readonly pred: (value: T) => boolean,
    readonly negate: boolean
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<number> {
    return new IndicesWhereIterator<T>(
      this.source[Symbol.iterator](),
      this.pred,
      this.negate
    );
  }
}

class IndicesOfStream<T> extends StreamBase<number> {
  constructor(
    readonly source: Stream<T>,
    readonly searchValue: T,
    readonly eq: Eq<T>,
    readonly negate: boolean
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<number> {
    return new IndicesOfIterator<T>(
      this.source[Symbol.iterator](),
      this.searchValue,
      this.eq,
      this.negate
    );
  }
}

class TakeWhileStream<T> extends StreamBase<T> {
  constructor(
    readonly source: Stream<T>,
    readonly pred: (value: T, index: number) => boolean,
    readonly negate: boolean
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new TakeWhileIterator<T>(
      this.source[Symbol.iterator](),
      this.pred,
      this.negate
    );
  }
}

class DropWhileStream<T> extends StreamBase<T> {
  constructor(
    readonly source: Stream<T>,
    readonly pred: (value: T, index: number) => boolean,
    readonly negate: boolean
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new DropWhileIterator<T>(
      this.source[Symbol.iterator](),
      this.pred,
      this.negate
    );
  }
}

class TakeStream<T> extends StreamBase<T> {
  constructor(readonly source: Stream<T>, readonly amount: number) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new TakeIterator<T>(this.source[Symbol.iterator](), this.amount);
  }

  take(amount: number): Stream<T> {
    if (amount === this.amount) return this;
    return this.source.take(amount);
  }
}

class DropStream<T> extends StreamBase<T> {
  constructor(readonly source: Stream<T>, readonly amount: number) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new DropIterator<T>(this.source[Symbol.iterator](), this.amount);
  }

  drop(amount: number): Stream<T> {
    if (amount <= 0) return this;
    return this.source.drop(this.amount + amount);
  }
}

class IntersperseStream<T> extends StreamBase<T> {
  constructor(readonly source: Stream<T>, readonly sepStream: Stream<T>) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new IntersperseIterator<T>(
      this.source[Symbol.iterator](),
      this.sepStream
    );
  }
}

class SplitWhereStream<T, R> extends StreamBase<R> {
  constructor(
    readonly source: Stream<T>,
    readonly pred: (value: T, index: number) => boolean,
    readonly negate: boolean,
    readonly collector: Reducer<T, R>
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<R> {
    return new SplitWhereIterator<T, R>(
      this.source[Symbol.iterator](),
      this.pred,
      this.negate,
      this.collector
    );
  }
}

class SplitOnStream<T, R> extends StreamBase<R> {
  constructor(
    readonly source: Stream<T>,
    readonly sepElem: T,
    readonly eq: Eq<T>,
    readonly negate: boolean,
    readonly collector: Reducer<T, R>
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<R> {
    return new SplitOnIterator<T, R>(
      this.source[Symbol.iterator](),
      this.sepElem,
      this.eq,
      this.negate,
      this.collector
    );
  }
}

class SplitOnSeq<T, R> extends StreamBase<R> {
  constructor(
    readonly source: Stream<T>,
    readonly sepSeq: StreamSource<T>,
    readonly eq: Eq<T>,
    readonly collector: Reducer<T, R>
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<R> {
    return new SplitOnSeqIterator<T, R>(
      this.source[Symbol.iterator](),
      this.sepSeq,
      this.eq,
      this.collector
    );
  }
}

class ReduceStream<I, R> extends StreamBase<R> {
  constructor(readonly source: Stream<I>, readonly reducerDef: Reducer<I, R>) {
    super();
  }

  [Symbol.iterator](): FastIterator<R> {
    return new ReduceIterator<I, R>(
      this.source[Symbol.iterator](),
      this.reducerDef
    );
  }
}

class SlowIteratorAdapter<T> implements FastIterator<T> {
  constructor(readonly source: Iterator<T>) {}

  next(): IteratorResult<T> {
    return this.source.next();
  }

  fastNext<O>(otherwise?: OptLazy<O>): T | O {
    const result = this.source.next();
    if (result.done) return OptLazy(otherwise) as O;
    return result.value;
  }
}

export class FromIterable<T> extends StreamBase<T> {
  constructor(readonly iterable: Iterable<T>) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    const iterator = this.iterable[Symbol.iterator]();

    if (isFastIterator(iterator)) return iterator;

    return new SlowIteratorAdapter<T>(iterator);
  }
}

class EmptyStream<T = any> extends StreamBase<T> implements Stream<T> {
  [Symbol.iterator](): FastIterator<T> {
    return emptyFastIterator;
  }

  stream(): this {
    return this;
  }
  assumeNonEmpty(): never {
    RimbuError.throwEmptyCollectionAssumedNonEmptyError();
  }
  equals(other: StreamSource<T>): boolean {
    const done = Symbol('Done');

    return done === fromStreamSource(other)[Symbol.iterator]().fastNext(done);
  }
  prepend(value: OptLazy<T>): Stream.NonEmpty<T> {
    return StreamConstructorsImpl.of(OptLazy(value));
  }
  append(value: OptLazy<T>): Stream.NonEmpty<T> {
    return StreamConstructorsImpl.of(OptLazy(value));
  }
  forEach(): void {
    //
  }
  forEachPure(): void {
    //
  }
  indexed(): Stream<[number, T]> {
    return this as any;
  }
  map<T2>(): Stream<T2> {
    return this as any;
  }
  mapPure<T2>(): Stream<T2> {
    return this as any;
  }
  flatMap<T2>(): Stream<T2> {
    return this as any;
  }
  flatZip<T2>(): Stream<[T, T2]> {
    return this as any;
  }
  transform<R>(transformer: Transformer<T, R>): Stream<R> {
    return StreamConstructorsImpl.from(
      transformer.stateToResult(transformer.init())
    );
  }
  filter(): Stream<T> {
    return this;
  }
  filterNot(): Stream<T> {
    return this;
  }
  filterPure(): Stream<T> {
    return this;
  }
  filterNotPure(): Stream<T> {
    return this;
  }
  collect<R>(): Stream<R> {
    return this as any;
  }
  first<O>(otherwise?: OptLazy<O>): O {
    return OptLazy(otherwise) as O;
  }
  last<O>(otherwise?: OptLazy<O>): O {
    return OptLazy(otherwise) as O;
  }
  single<O>(otherwise?: OptLazy<O>): O {
    return OptLazy(otherwise) as O;
  }
  count(): 0 {
    return 0;
  }
  countElement(): 0 {
    return 0;
  }
  countNotElement(): 0 {
    return 0;
  }
  find<O>(
    pred: (value: any, index: number) => boolean,
    options: { otherwise?: OptLazy<O>; occurrance?: number } = {}
  ): O {
    const { otherwise } = options;

    return OptLazy(otherwise) as O;
  }
  elementAt<O>(index: number, otherwise?: OptLazy<O>): O {
    return OptLazy(otherwise) as O;
  }
  indicesWhere(): Stream<number> {
    return this as any;
  }
  indicesOf(): Stream<number> {
    return this as any;
  }
  indexWhere(): undefined {
    return undefined;
  }
  indexOf(): undefined {
    return undefined;
  }
  some(): false {
    return false;
  }
  every(): true {
    return true;
  }
  contains(): false {
    return false;
  }
  containsSlice(): false {
    return false;
  }
  takeWhile(): Stream<T> {
    return this;
  }
  dropWhile(): Stream<T> {
    return this;
  }
  take(): Stream<T> {
    return this;
  }
  drop(): Stream<T> {
    return this;
  }
  repeat(): Stream<T> {
    return this;
  }
  concat<T2>(...others: ArrayNonEmpty<StreamSource<T2>>): any {
    if (others.every(isEmptyStreamSourceInstance)) return this;
    const [source1, source2, ...sources] = others;

    if (undefined === source2) return source1;

    return fromStreamSource(source1).concat(source2, ...sources);
  }
  min<O>(otherwise?: OptLazy<O>): O {
    return OptLazy(otherwise) as O;
  }
  minBy<O>(compare: any, otherwise?: OptLazy<O>): O {
    return OptLazy(otherwise) as O;
  }
  max<O>(otherwise?: OptLazy<O>): O {
    return OptLazy(otherwise) as O;
  }
  maxBy<O>(compare: any, otherwise?: OptLazy<O>): O {
    return OptLazy(otherwise) as O;
  }
  intersperse(): Stream<T> {
    return this;
  }
  join({ start = '', end = '', ifEmpty = undefined } = {}): string {
    if (undefined !== ifEmpty) return ifEmpty;
    return start.concat(end);
  }
  mkGroup({
    start = emptyStream as StreamSource<T>,
    end = emptyStream as StreamSource<T>,
  } = {}): Stream.NonEmpty<T> {
    return fromStreamSource(start).concat(end) as any;
  }
  splitOn<R>(): Stream<R> {
    return this as any;
  }
  splitWhere<R>(): Stream<R> {
    return this as any;
  }
  splitOnSeq<R>(): Stream<R> {
    return this as any;
  }
  distinctPrevious(): Stream<T> {
    return this;
  }
  window<R>(): Stream<R> {
    return this as any;
  }
  fold<R>(init: OptLazy<R>): R {
    return OptLazy(init);
  }
  foldStream<R>(): Stream<R> {
    return this as any;
  }
  reduce(shape: any): any {
    const reducer = Reducer.combine(shape);

    return reducer.stateToResult(reducer.init());
  }
  reduceStream(): any {
    return this;
  }
  toArray(): [] {
    return [];
  }
  toString(): string {
    return `Stream(<empty>)`;
  }
  toJSON(): ToJSON<T[], 'Stream'> {
    return {
      dataType: 'Stream',
      value: [],
    };
  }
}

export class ArrayStream<T> extends StreamBase<T> {
  readonly length: number;

  constructor(
    readonly array: readonly T[],
    readonly startIndex = 0,
    readonly endIndex = array.length - 1,
    readonly reversed = false
  ) {
    super();
    this.length = endIndex - startIndex + 1;
  }

  [Symbol.iterator](): FastIterator<T> {
    if (!this.reversed) {
      return new ArrayIterator(this.array, this.startIndex, this.endIndex);
    }
    return new ArrayReverseIterator(this.array, this.startIndex, this.endIndex);
  }

  forEach(
    f: (value: T, index: number, halt: () => void) => void,
    options: { state?: TraverseState } = {}
  ): void {
    const { state = TraverseState() } = options;

    const startIndex = this.startIndex;
    const endIndex = this.endIndex;
    const array = this.array;
    const { halt } = state;

    if (!this.reversed) {
      let i = this.startIndex - 1;
      while (!state.halted && ++i <= endIndex) {
        f(array[i], state.nextIndex(), halt);
      }
    } else {
      let i = endIndex + 1;
      while (!state.halted && --i >= startIndex) {
        f(array[i], state.nextIndex(), halt);
      }
    }
  }

  first<O>(otherwise?: OptLazy<O>): T | O {
    if (this.length <= 0) return OptLazy(otherwise) as O;

    if (!this.reversed) return this.array[this.startIndex];
    return this.array[this.endIndex];
  }

  last<O>(otherwise?: OptLazy<O>): T | O {
    if (this.length <= 0) return OptLazy(otherwise) as O;

    if (!this.reversed) return this.array[this.endIndex];
    return this.array[this.startIndex];
  }

  count(): number {
    return this.endIndex - this.startIndex + 1;
  }

  find<O>(
    pred: (value: T, index: number) => boolean,
    options: {
      occurrance?: number;
      negate?: boolean;
      otherwise?: OptLazy<O>;
    } = {}
  ): T | O {
    const { occurrance = 1, negate = false, otherwise } = options;

    const startIndex = this.startIndex;
    const endIndex = this.endIndex;
    const array = this.array;
    let remain = occurrance;
    let index = 0;

    if (!this.reversed) {
      let i = startIndex - 1;

      while (++i <= endIndex) {
        const value = array[i];
        if (pred(value, index++) !== negate && --remain <= 0) return value;
      }
    } else {
      let i = endIndex + 1;

      while (--i >= startIndex) {
        const value = array[i];
        if (pred(value, index++) !== negate && --remain <= 0) return value;
      }
    }

    return OptLazy(otherwise) as O;
  }

  elementAt<O>(index: number, otherwise?: OptLazy<O>): T | O {
    if (index < 0 || index >= this.length) return OptLazy(otherwise) as O;

    if (!this.reversed) return this.array[index + this.startIndex];

    return this.array[this.endIndex - index];
  }

  some(
    pred: (value: T, index: number) => boolean,
    options: { negate?: boolean } = {}
  ): boolean {
    const { negate = false } = options;
    const startIndex = this.startIndex;
    const endIndex = this.endIndex;
    const array = this.array;
    let index = 0;

    if (!this.reversed) {
      let i = this.startIndex - 1;
      while (++i <= endIndex) {
        const value = array[i];
        if (pred(value, index++) !== negate) return true;
      }
    } else {
      let i = this.endIndex + 1;
      while (--i >= startIndex) {
        const value = array[i];
        if (pred(value, index++) !== negate) return true;
      }
    }

    return false;
  }

  every(
    pred: (value: T, index: number) => boolean,
    options: { negate?: boolean } = {}
  ): boolean {
    const { negate = false } = options;

    return !this.some(pred, { negate: !negate });
  }

  indexOf(
    searchValue: T,
    options: { occurrance?: number; eq?: Eq<T>; negate?: boolean } = {}
  ): number | undefined {
    const { occurrance = 1 } = options;

    if (occurrance <= 0) return undefined;

    const { eq = Object.is, negate = false } = options;

    let remain = occurrance;

    const startIndex = this.startIndex;
    const endIndex = this.endIndex;
    const array = this.array;

    if (!this.reversed) {
      let i = startIndex - 1;
      while (++i <= endIndex) {
        if (eq(array[i], searchValue) !== negate && --remain <= 0)
          return i - startIndex;
      }
    } else {
      let i = endIndex + 1;
      while (--i >= startIndex) {
        if (eq(array[i], searchValue) !== negate && --remain <= 0)
          return endIndex - i;
      }
    }

    return undefined;
  }

  contains(
    searchValue: T,
    options: { amount?: number; eq?: Eq<T>; negate?: boolean } = {}
  ): boolean {
    const { amount = 1 } = options;

    if (amount <= 0) return true;

    const { eq = Eq.objectIs, negate = false } = options;

    return (
      undefined !==
      this.indexOf(searchValue, { occurrance: amount, eq, negate })
    );
  }

  take(amount: number): Stream<T> {
    if (amount <= 0) return emptyStream;

    if (amount >= this.length) return this;

    if (!this.reversed) {
      return new ArrayStream(
        this.array,
        this.startIndex,
        this.startIndex + amount - 1,
        this.reversed
      );
    }

    return new ArrayStream(
      this.array,
      this.endIndex - (amount - 1),
      this.endIndex,
      this.reversed
    );
  }

  drop(amount: number): Stream<T> {
    if (amount <= 0) return this;

    if (amount >= this.length) return emptyStream;

    if (!this.reversed) {
      return new ArrayStream(
        this.array,
        this.startIndex + amount,
        this.endIndex,
        this.reversed
      );
    }

    return new ArrayStream(
      this.array,
      this.startIndex,
      this.endIndex - amount,
      this.reversed
    );
  }

  toArray(): T[] {
    const array = this.array;

    if (typeof array === 'string') {
      return super.toArray();
    }

    if (this.reversed) return super.toArray();
    return array.slice(this.startIndex, this.endIndex + 1);
  }
}

export class AlwaysStream<T> extends StreamBase<T> {
  constructor(readonly value: T) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new AlwaysIterator(this.value);
  }

  first(): T {
    return this.value;
  }

  append(): Stream.NonEmpty<T> {
    return this as any;
  }

  forEach(
    f: (value: T, index: number, halt: () => void) => void,
    options: { state?: TraverseState } = {}
  ): void {
    const { state = TraverseState() } = options;

    const value = this.value;

    while (!state.halted) {
      f(value, state.nextIndex(), state.halt);
    }
  }

  last(): T {
    return this.value;
  }

  elementAt(): T {
    return this.value;
  }

  repeat(): Stream<T> {
    return this as any;
  }

  concat<T2>(): Stream.NonEmpty<T | T2> {
    return this.assumeNonEmpty();
  }

  min(): T {
    return this.value;
  }

  minBy(): T {
    return this.value;
  }

  max(): T {
    return this.value;
  }

  maxBy(): T {
    return this.value;
  }
}

export class MapApplyStream<
  T extends readonly unknown[],
  A extends readonly unknown[],
  R
> extends StreamBase<R> {
  constructor(
    readonly source: StreamSource<T>,
    readonly f: (...args: [...T, ...A]) => R,
    readonly args: A
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<R> {
    return new MapApplyIterator(
      this.source,
      this.f,
      this.args,
      streamSourceHelpers
    );
  }
}

export class FilterApplyStream<
  T extends readonly unknown[],
  A extends readonly unknown[]
> extends StreamBase<T> {
  constructor(
    readonly source: StreamSource<T>,
    readonly pred: (...args: [...T, ...A]) => boolean,
    readonly args: A,
    readonly negate = false
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new FilterApplyIterator(
      this.source,
      this.pred,
      this.args,
      this.negate,
      streamSourceHelpers
    );
  }
}

export class RangeStream extends StreamBase<number> {
  constructor(
    readonly start: number,
    readonly end?: number,
    readonly delta: number = 1
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<number> {
    if (this.delta >= 0) {
      return new RangeUpIterator(this.start, this.end, this.delta);
    }
    return new RangeDownIterator(this.start, this.end, this.delta);
  }
}

export class DistinctPreviousStream<T> extends StreamBase<T> {
  constructor(
    readonly source: Stream<T>,
    readonly eq: Eq<T>,
    readonly negate: boolean
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<T> {
    return new DistinctPreviousIterator(
      this.source[Symbol.iterator](),
      this.eq,
      this.negate
    );
  }
}

export class WindowStream<T, R> extends StreamBase<R> {
  constructor(
    readonly source: Stream<T>,
    readonly windowSize: number,
    readonly skipAmount: number,
    readonly collector: Reducer<T, R>
  ) {
    super();
  }

  [Symbol.iterator](): FastIterator<R> {
    return new WindowIterator(
      this.source[Symbol.iterator](),
      this.windowSize,
      this.skipAmount,
      this.collector
    );
  }
}

export const emptyStream: Stream<any> = Object.freeze(new EmptyStream());

export function isStream(obj: any): obj is Stream<any> {
  return obj instanceof StreamBase;
}

export const fromStreamSource: {
  <T>(source: StreamSource.NonEmpty<T>): Stream.NonEmpty<T>;
  <T>(source: StreamSource<T>): Stream<T>;
} = (source: StreamSource<any>): any => {
  if (undefined === source || isEmptyStreamSourceInstance(source))
    return emptyStream;
  if (isStream(source)) return source;
  if (typeof source === 'object' && `stream` in source) return source.stream();

  if (Array.isArray(source)) {
    if (source.length <= 0) return emptyStream;
    return new ArrayStream(source);
  }

  return new FromIterable(source);
};

/**
 * Returns true if the given `source` StreamSource is known to be empty.
 * @param source - a StreamSource
 * @note
 * If this function returns false, it does not guarantee that the Stream is not empty. It only
 * means that it is not known if it is empty.
 */
export function isEmptyStreamSourceInstance(
  source: StreamSource<unknown>
): boolean {
  if (source === '') return true;
  if (typeof source === 'object') {
    if (source === emptyStream) return true;
    if (`length` in source && (source as any).length === 0) return true;
    if (`size` in source && (source as any).size === 0) return true;
    if (`isEmpty` in source && (source as any).isEmpty === true) return true;
  }

  return false;
}

const streamSourceHelpers = {
  fromStreamSource,
  isEmptyStreamSourceInstance,
};

export type StreamSourceHelpers = typeof streamSourceHelpers;

export const StreamConstructorsImpl: StreamConstructors =
  Object.freeze<StreamConstructors>({
    empty<T>(): Stream<T> {
      return emptyStream;
    },
    of<T>(...values: ArrayNonEmpty<T>): Stream.NonEmpty<T> {
      return fromStreamSource(values) as any;
    },
    from<T>(...sources: ArrayNonEmpty<StreamSource<T>>): any {
      const [first, ...rest] = sources;
      if (rest.length <= 0) {
        return fromStreamSource(first);
      }

      const [rest1, ...restOther] = rest;
      return fromStreamSource(first).concat(rest1, ...restOther);
    },
    fromArray<T>(
      array: readonly T[],
      options: {
        range?: IndexRange | undefined;
        reversed?: boolean;
      } = {}
    ): any {
      if (array.length === 0) return emptyStream;

      const { range, reversed = false } = options;

      if (undefined === range) {
        return new ArrayStream(array, undefined, undefined, reversed);
      }

      const result = IndexRange.getIndicesFor(range, array.length);

      if (result === 'empty') {
        return emptyStream;
      }
      if (result === 'all') {
        return new ArrayStream(array, undefined, undefined, reversed);
      }
      return new ArrayStream(array, result[0], result[1], reversed);
    },
    fromObjectKeys<K extends string | number | symbol>(
      obj: Record<K, any>
    ): Stream<K> {
      return StreamConstructorsImpl.from(yieldObjKeys(obj));
    },
    fromObjectValues<V>(obj: Record<any, V>): Stream<V> {
      return StreamConstructorsImpl.from(yieldObjValues(obj));
    },
    fromObject<K extends string | number | symbol, V>(
      obj: Record<K, V>
    ): Stream<[K, V]> {
      return StreamConstructorsImpl.from(yieldObjEntries(obj));
    },
    fromString(
      source: string,
      options: { range?: IndexRange | undefined; reversed?: boolean } = {}
    ) {
      return StreamConstructorsImpl.fromArray(source as any, options) as any;
    },
    always<T>(value: T): Stream.NonEmpty<T> {
      return new AlwaysStream(value) as any;
    },
    applyForEach<T extends readonly unknown[], A extends readonly unknown[]>(
      source: StreamSource<Readonly<T>>,
      f: (...args: [...T, ...A]) => void,
      ...args: A
    ): void {
      const iter = StreamConstructorsImpl.from(source)[Symbol.iterator]();

      const done = Symbol();
      let values: T | typeof done;
      while (done !== (values = iter.fastNext(done))) {
        f(...values, ...args);
      }
    },
    applyMap<T extends readonly unknown[], A extends readonly unknown[], R>(
      source: StreamSource<Readonly<T>>,
      mapFun: (...args: [...T, ...A]) => R,
      ...args: A
    ) {
      return new MapApplyStream(source, mapFun, args) as any;
    },
    applyFilter<T extends readonly unknown[], A extends readonly unknown[]>(
      source: StreamSource<Readonly<T>>,
      options: { pred: (...args: [...T, ...A]) => boolean; negate?: boolean },
      ...args: A
    ): Stream<T> {
      const { pred, negate = false } = options;

      return new FilterApplyStream(source, pred, args, negate) as any;
    },
    range(range: IndexRange, options: { delta?: number } = {}): Stream<number> {
      const { delta = 1 } = options;

      if (undefined !== range.amount) {
        if (range.amount <= 0) return emptyStream;

        let startIndex = 0;
        if (undefined !== range.start) {
          if (Array.isArray(range.start)) {
            startIndex = range.start[0];
            if (!range.start[1]) startIndex++;
          } else startIndex = range.start;
        }
        const endIndex = startIndex + range.amount - 1;

        return new RangeStream(startIndex, endIndex, delta);
      }

      const { start, end } = Range.getNormalizedRange(range);
      let startIndex = 0;
      let endIndex: number | undefined = undefined;
      if (undefined !== start) {
        startIndex = start[0];
        if (!start[1]) startIndex++;
      }
      if (undefined !== end) {
        endIndex = end[0];
        if (!end[1]) endIndex--;
      }

      if (undefined !== endIndex) {
        if (delta > 0 && endIndex < startIndex) return emptyStream;
        else if (delta < 0 && startIndex <= endIndex) return emptyStream;
      }

      return new RangeStream(startIndex, endIndex, delta);
    },
    random(): Stream.NonEmpty<number> {
      return new FromStream(
        (): FastIterator<number> => new RandomIterator()
      ) as unknown as Stream.NonEmpty<number>;
    },
    randomInt(min: number, max: number): Stream.NonEmpty<number> {
      if (min >= max) ErrBase.msg('min should be smaller than max');

      return new FromStream(
        (): FastIterator<number> => new RandomIntIterator(min, max)
      ) as unknown as Stream.NonEmpty<number>;
    },
    unfold<T>(
      init: T,
      next: (current: T, index: number, stop: Token) => T | Token
    ): Stream.NonEmpty<T> {
      return new FromStream(
        (): FastIterator<T> => new UnfoldIterator<T>(init, next)
      ) as unknown as Stream.NonEmpty<T>;
    },
    zipWith(...sources) {
      return (zipFun): any => {
        if (sources.some(isEmptyStreamSourceInstance)) {
          return emptyStream;
        }

        return new FromStream(
          () => new ZipWithIterator(sources as any, zipFun, streamSourceHelpers)
        );
      };
    },
    zip(...sources) {
      return StreamConstructorsImpl.zipWith(...(sources as any))(Array);
    },
    zipAllWith(...sources) {
      return (fillValue, zipFun: any): any => {
        if (sources.every(isEmptyStreamSourceInstance)) {
          return emptyStream;
        }

        return new FromStream(
          (): FastIterator<any> =>
            new ZipAllWithItererator(
              fillValue,
              sources,
              zipFun,
              streamSourceHelpers
            )
        );
      };
    },
    zipAll(fillValue, ...sources) {
      return StreamConstructorsImpl.zipAllWith(...(sources as any))(
        fillValue,
        Array
      ) as any;
    },
    flatten(source: any) {
      return fromStreamSource(source).flatMap((s: any) => s);
    },
    unzip(source, options) {
      const { length } = options;
      if (isEmptyStreamSourceInstance(source)) {
        return StreamConstructorsImpl.of(emptyStream).repeat(length).toArray();
      }

      const result: Stream<unknown>[] = [];
      let i = -1;

      while (++i < length) {
        const index = i;
        result[i] = source.map((t: any): unknown => t[index]);
      }

      return result as any;
    },
  });
