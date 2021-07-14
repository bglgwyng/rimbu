import {
  ArrayNonEmpty,
  CollectFun,
  Comp,
  Eq,
  Reducer,
  ToJSON,
  TraverseState,
} from '../../common/mod.ts';
import {
  AsyncCollectFun,
  AsyncFastIterator,
  AsyncOptLazy,
  AsyncStream,
  AsyncStreamSource,
  MaybePromise,
} from '../internal.ts';

export abstract class AsyncFastIteratorBase<T> implements AsyncFastIterator<T> {
  abstract fastNext<O>(otherwise?: AsyncOptLazy<O>): MaybePromise<T | O>;

  async next(): Promise<IteratorResult<T>> {
    const done = Symbol('Done');
    const value = await this.fastNext(done);
    if (done === value) return AsyncFastIterator.fixedDone;
    return { value, done: false };
  }
}

export abstract class AsyncStreamBase<T> implements AsyncStream<T> {
  abstract [Symbol.asyncIterator](): AsyncFastIterator<T>;

  asyncStream(): this {
    return this;
  }

  async equals(
    other: AsyncStreamSource<T>,
    eq: Eq<T> = Eq.objectIs
  ): Promise<boolean> {
    const it1 = this[Symbol.asyncIterator]();
    const it2 = AsyncStream.from(other)[Symbol.asyncIterator]();

    const done = Symbol('Done');

    while (true) {
      const [v1, v2] = await Promise.all([
        it1.fastNext(done),
        it2.fastNext(done),
      ] as const);
      if (done === v1 || done === v2) return Object.is(v1, v2);
      if (!eq(v1, v2)) return false;
    }
  }

  assumeNonEmpty(): AsyncStream.NonEmpty<T> {
    return this as unknown as AsyncStream.NonEmpty<T>;
  }

  asNormal(): AsyncStream<T> {
    return this;
  }

  prepend<T2 = T>(value: AsyncOptLazy<T>): AsyncStream.NonEmpty<T | T2> {
    return new AsyncPrependStream<T | T2>(this, value) as any;
  }

  append<T2 = T>(value: AsyncOptLazy<T2>): AsyncStream.NonEmpty<T | T2> {
    return new AsyncAppendStream<T | T2>(this, value) as any;
  }

  async forEach(
    f: (value: T, index: number, halt: () => void) => MaybePromise<void>,
    state = TraverseState()
  ): Promise<void> {
    if (state.halted) return;

    const done = Symbol('Done');
    let value: T | typeof done;
    const iterator = this[Symbol.asyncIterator]();

    const { halt } = state;

    while (!state.halted && done !== (value = await iterator.fastNext(done))) {
      await f(value, state.nextIndex(), halt);
    }
  }

  async forEachPure<A extends readonly unknown[]>(
    f: (value: T, ...args: A) => MaybePromise<void>,
    ...args: A
  ): Promise<void> {
    const done = Symbol('Done');
    let value: T | typeof done;
    const iterator = this[Symbol.asyncIterator]();

    while (done !== (value = await iterator.fastNext(done))) {
      await f(value, ...args);
    }
  }

  indexed(startIndex = 0): AsyncStream<[number, T]> {
    return new AsyncIndexedStream(this, startIndex);
  }

  map<T2>(
    mapFun: (value: T, index: number) => MaybePromise<T2>
  ): AsyncStream<T2> {
    return new AsyncMapStream(this, mapFun);
  }

  mapPure<T2, A extends readonly unknown[]>(
    mapFun: (value: T, ...args: A) => MaybePromise<T2>,
    ...args: A
  ): AsyncStream<T2> {
    return new AsyncMapPureStream(this, mapFun, args);
  }

  flatMap<T2>(
    flatMapFun: (
      value: T,
      index: number,
      halt: () => void
    ) => AsyncStreamSource<T2>
  ): AsyncStream<T2> {
    return new AsyncFlatMapStream(this, flatMapFun);
  }

  filter(
    pred: (value: T, index: number, halt: () => void) => MaybePromise<boolean>
  ): AsyncStream<T> {
    return new AsyncFilterStream(this, pred);
  }

  filterNot(
    pred: (value: T, index: number, halt: () => void) => MaybePromise<boolean>
  ): AsyncStream<T> {
    return new AsyncFilterStream(this, pred, true);
  }

  filterPure<A extends readonly unknown[]>(
    pred: (value: T, ...args: A) => MaybePromise<boolean>,
    ...args: A
  ): AsyncStream<T> {
    return new AsyncFilterPureStream(this, pred, args);
  }

  filterNotPure<A extends readonly unknown[]>(
    pred: (value: T, ...args: A) => MaybePromise<boolean>,
    ...args: A
  ): AsyncStream<T> {
    return new AsyncFilterPureStream(this, pred, args, true);
  }

  collect<R>(collectFun: AsyncCollectFun<T, R>): AsyncStream<R> {
    return new AsyncCollectStream(this, collectFun);
  }

  async first<O>(otherwise?: AsyncOptLazy<O>): Promise<T | O> {
    return this[Symbol.asyncIterator]().fastNext(otherwise!);
  }

  async last<O>(otherwise?: AsyncOptLazy<O>): Promise<T | O> {
    const done = Symbol('Done');
    let value: T | typeof done;
    let lastValue: T | typeof done = done;
    const iterator = this[Symbol.asyncIterator]();

    while (done !== (value = await iterator.fastNext(done))) {
      lastValue = value;
    }

    if (done === lastValue) return AsyncOptLazy.toMaybePromise(otherwise!);
    return lastValue;
  }

  async count(): Promise<number> {
    let result = 0;

    const done = Symbol('Done');
    const iterator = this[Symbol.asyncIterator]();

    while (done !== (await iterator.fastNext(done))) result++;

    return result;
  }

  async countElement(value: T, eq = Eq.objectIs): Promise<number> {
    let result = 0;

    const done = Symbol('Done');
    const iterator = this[Symbol.asyncIterator]();
    let current: T | typeof done;

    while (done !== (current = await iterator.fastNext(done))) {
      if (eq(value, current)) result++;
    }

    return result;
  }

  async countNotElement(value: T, eq = Eq.objectIs): Promise<number> {
    let result = 0;

    const done = Symbol('Done');
    const iterator = this[Symbol.asyncIterator]();
    let current: T | typeof done;

    while (done !== (current = await iterator.fastNext(done))) {
      if (!eq(value, current)) result++;
    }

    return result;
  }

  async find<O>(
    pred: (value: T, index: number) => MaybePromise<boolean>,
    occurrance = 1,
    otherwise?: AsyncOptLazy<O>
  ): Promise<T | O> {
    if (occurrance <= 0) return AsyncOptLazy.toMaybePromise(otherwise!);

    const done = Symbol('Done');
    const iterator = this[Symbol.asyncIterator]();
    let value: T | typeof done;
    let remain = occurrance;
    let index = 0;

    while (done !== (value = await iterator.fastNext(done))) {
      const cond = await pred(value, index++);
      if (cond && --remain <= 0) return value;
    }

    return AsyncOptLazy.toMaybePromise(otherwise!);
  }

  async elementAt<O>(
    index: number,
    otherwise?: AsyncOptLazy<O>
  ): Promise<T | O> {
    if (index < 0) return AsyncOptLazy.toMaybePromise(otherwise!);

    const done = Symbol('Done');
    const iterator = this[Symbol.asyncIterator]();
    let value: T | typeof done;
    let i = 0;

    while (done !== (value = await iterator.fastNext(done))) {
      if (i === index) return value;
      if (i > index) return AsyncOptLazy.toMaybePromise(otherwise!);
      i++;
    }

    return AsyncOptLazy.toMaybePromise(otherwise!);
  }

  indicesWhere(pred: (value: T) => MaybePromise<boolean>): AsyncStream<number> {
    return new AsyncIndicesWhereStream(this, pred);
  }

  indicesOf(searchValue: T, eq: Eq<T> = Eq.objectIs): AsyncStream<number> {
    return new AsyncIndicesOfStream(this, searchValue, eq);
  }

  async indexWhere(
    pred: (value: T, index: number) => MaybePromise<boolean>,
    occurrance = 1
  ): Promise<number | undefined> {
    if (occurrance <= 0) return undefined;

    const done = Symbol('Done');
    let value: T | typeof done;
    const iterator = this[Symbol.asyncIterator]();
    let index = 0;
    let occ = 0;

    while (done !== (value = await iterator.fastNext(done))) {
      const i = index++;

      const cond = await pred(value, i);

      if (cond) {
        occ++;
        if (occ >= occurrance) return i;
      }
    }

    return undefined;
  }

  async indexOf(
    searchValue: T,
    occurrance = 1,
    eq: Eq<T> = Eq.objectIs
  ): Promise<number | undefined> {
    if (occurrance <= 0) return undefined;

    const done = Symbol('Done');
    let value: T | typeof done;
    const iterator = this[Symbol.asyncIterator]();
    let index = 0;
    let occ = 0;

    while (done !== (value = await iterator.fastNext(done))) {
      const i = index++;

      if (eq(value, searchValue)) {
        occ++;
        if (occ >= occurrance) return i;
      }
    }

    return undefined;
  }

  async some(
    pred: (value: T, index: number) => MaybePromise<boolean>
  ): Promise<boolean> {
    return undefined !== (await this.indexWhere(pred));
  }

  async every(
    pred: (value: T, index: number) => MaybePromise<boolean>
  ): Promise<boolean> {
    const iterator = this[Symbol.asyncIterator]();
    const done = Symbol('Done');
    let value: T | typeof done;
    let index = 0;

    while (done !== (value = await iterator.fastNext(done))) {
      const cond = await pred(value, index++);
      if (!cond) return false;
    }

    return true;
  }

  async contains(searchValue: T, amount = 1, eq?: Eq<T>): Promise<boolean> {
    if (amount <= 0) return true;

    return undefined !== (await this.indexOf(searchValue, amount, eq));
  }

  takeWhile(
    pred: (value: T, index: number) => MaybePromise<boolean>
  ): AsyncStream<T> {
    return new AsyncTakeWhileStream(this, pred);
  }

  dropWhile(
    pred: (value: T, index: number) => MaybePromise<boolean>
  ): AsyncStream<T> {
    return new AsyncDropWhileStream(this, pred);
  }

  take(amount: number): AsyncStream<T> {
    if (amount <= 0) return AsyncStream.empty();

    return new AsyncTakeStream(this, amount);
  }

  drop(amount: number): AsyncStream<T> {
    if (amount <= 0) return this;

    return new AsyncDropStream(this, amount);
  }

  repeat(amount?: number): AsyncStream<T> {
    if (undefined !== amount && amount <= 1) return this;

    return new AsyncFromStream(() => new AsyncRepeatIterator(this, amount));
  }

  concat<T2 extends T>(...others: ArrayNonEmpty<AsyncStreamSource<T2>>): any {
    if (others.every(AsyncStreamSource.isEmptyInstance)) return this as any;

    return new AsyncConcatStream(this, others);
  }

  min<O>(otherwise?: AsyncOptLazy<O>): Promise<T | O> {
    return this.minBy(Comp.defaultComp().compare, otherwise);
  }

  async minBy<O>(
    compare: (v1: T, v2: T) => number,
    otherwise?: AsyncOptLazy<O>
  ): Promise<T | O> {
    const done = Symbol('Done');
    const iterator = this[Symbol.asyncIterator]();
    let result: T | typeof done = await iterator.fastNext(done);

    if (done === result) return AsyncOptLazy.toMaybePromise(otherwise!);

    let value: T | typeof done;
    while (done !== (value = await iterator.fastNext(done))) {
      if (compare(value, result) < 0) result = value;
    }

    return result;
  }

  max<O>(otherwise?: AsyncOptLazy<O>): Promise<T | O> {
    return this.maxBy(Comp.defaultComp().compare, otherwise);
  }

  async maxBy<O>(
    compare: (v1: T, v2: T) => number,
    otherwise?: AsyncOptLazy<O>
  ): Promise<T | O> {
    const done = Symbol('Done');
    const iterator = this[Symbol.asyncIterator]();
    let result: T | typeof done = await iterator.fastNext(done);

    if (done === result) return AsyncOptLazy.toMaybePromise(otherwise!);

    let value: T | typeof done;
    while (done !== (value = await iterator.fastNext(done))) {
      if (compare(value, result) > 0) result = value;
    }

    return result;
  }

  intersperse<T2>(sep: AsyncStreamSource<T2>): AsyncStream<T | T2> {
    if (AsyncStreamSource.isEmptyInstance(sep)) return this as any;

    const sepStream = AsyncStream.from(sep);

    return new AsyncIntersperseStream(this, sepStream);
  }

  async join({
    sep = '',
    start = '',
    end = '',
    valueToString = String,
  } = {}): Promise<string> {
    const done = Symbol('Done');
    const iterator = this[Symbol.asyncIterator]();
    let value: T | typeof done = await iterator.fastNext(done);

    if (done === value) return start.concat(end);

    let result = start.concat(valueToString(value));

    while (done !== (value = await iterator.fastNext(done))) {
      result = result.concat(sep, valueToString(value));
    }

    return result.concat(end);
  }

  mkGroup<O>({
    sep = AsyncStream.empty<O>() as AsyncStreamSource<O>,
    start = AsyncStream.empty<O>() as AsyncStreamSource<O>,
    end = AsyncStream.empty<O>() as AsyncStreamSource<O>,
  } = {}): any {
    return AsyncStream.from<T | O>(start, this.intersperse(sep), end);
  }

  splitWhere(
    pred: (value: T, index: number) => MaybePromise<boolean>
  ): AsyncStream<T[]> {
    return new AsyncSplitWhereStream(this, pred);
  }

  splitOn(sepElem: T, eq: Eq<T> = Eq.objectIs): AsyncStream<T[]> {
    return new AsyncSplitOnStream(this, sepElem, eq);
  }

  fold<R>(
    init: Reducer.Init<R>,
    next: (current: R, value: T, index: number, halt: () => void) => R
  ): Promise<R> {
    return this.reduce(Reducer.createOutput(init, next));
  }

  foldStream<R>(
    init: Reducer.Init<R>,
    next: (current: R, value: T, index: number, halt: () => void) => R
  ): AsyncStream<R> {
    return this.reduceStream(Reducer.createOutput(init, next));
  }

  async reduce<R>(reducer: Reducer<T, R>): Promise<R> {
    let halted = false;

    function halt(): void {
      halted = true;
    }

    let index = 0;
    const next = reducer.next;
    let state = Reducer.Init(reducer.init);
    const done = Symbol('Done');
    let value: T | typeof done;
    const iter = this[Symbol.asyncIterator]();

    while (!halted && done !== (value = await iter.fastNext(done))) {
      state = next(state, value, index++, halt);
    }

    return reducer.stateToResult(state);
  }

  reduceStream<R>(reducer: Reducer<T, R>): AsyncStream<R> {
    return new AsyncReduceStream(this, reducer);
  }

  async reduceAll<R extends [unknown, unknown, ...unknown[]]>(
    ...reducers: { [K in keyof R]: Reducer<T, R[K]> }
  ): Promise<any> {
    const state = reducers.map((d: any): unknown => Reducer.Init(d.init));

    const iteratorsDone: ((() => void) | null)[] = state.map(
      (_: any, i: any): (() => void) =>
        (): void => {
          iteratorsDone[i] = null;
        }
    );

    const iter = this[Symbol.asyncIterator]();
    const length = reducers.length;

    const done = Symbol('Done');
    let value: T | typeof done;
    let index = 0;

    while (done !== (value = await iter.fastNext(done))) {
      let i = -1;
      let anyNotDone = false;

      while (++i < length) {
        const halt = iteratorsDone[i];
        if (null !== halt) {
          anyNotDone = true;
          state[i] = reducers[i].next(state[i], value, index, halt);
        }
      }
      if (!anyNotDone) break;
      index++;
    }

    return state.map((s: any, i: any): unknown => reducers[i].stateToResult(s));
  }

  reduceAllStream<R extends [unknown, unknown, ...unknown[]]>(
    ...reducers: { [K in keyof R]: Reducer<T, R[K]> }
  ): AsyncStream<R> {
    return new AsyncReduceAllStream(this, reducers);
  }

  async toArray(): Promise<T[]> {
    const iterator = this[Symbol.asyncIterator]();
    const result: T[] = [];
    const done = Symbol('Done');
    let value: T | typeof done;

    while (done !== (value = await iterator.fastNext(done))) {
      result.push(value);
    }

    return result;
  }

  toString(): string {
    return `AsyncStream(...<potentially empty>)`;
  }

  async toJSON(): Promise<ToJSON<T[], 'AsyncStream'>> {
    return {
      dataType: 'AsyncStream',
      value: await this.toArray(),
    };
  }

  flatten(): any {
    return this.flatMap((s: any) => s);
  }

  zipWith(): any {
    throw new Error('Method not implemented.');
  }
  zip(): any {
    throw new Error('Method not implemented.');
  }
  zipAllWith(): any {
    throw new Error('Method not implemented.');
  }
  zipAll(): any {
    throw new Error('Method not implemented.');
  }
  unzip(): any {
    throw new Error('Method not implemented.');
  }
  //   zipWith<I extends readonly [unknown, ...unknown[]], R>(zipFun: (value: T, ...values: I) => R, ...iters: { [K in keyof I]: AsyncStreamSource<I[K]>; }) => AsyncStream<R> {

  //   }
  //   zip <I extends readonly [unknown, ...unknown[]]>(...iters: { [K in keyof I]: AsyncStreamSource<I[K]>; }) => AsyncStream<[T, ...I]> {

  //   }
  //   zipAllWith: { <I extends readonly [unknown, ...unknown[]], O, R>(fillValue: AsyncOptLazy<O>, zipFun: (value: T | O, ...values: { [K in keyof I]: O | I[K]; }) => R, ...streams: { [K in keyof I]: StreamSource.NonEmpty<I[K]>; }): AsyncStream.NonEmpty<...>; <I extends readonly [...], O, R>(fillValue: OptLazy<...>, zipFun: (value: T | O, ...values: { [K in keyof I]: O | I[K]; }) => R, ...streams: { [K in keyof I]: StreamSource<...>; }): AsyncStream<...>; } = null as any;
  //   zipAll: { <I extends readonly [unknown, ...unknown[]], O>(fillValue: AsyncOptLazy<O>, ...streams: { [K in keyof I]: AsyncStreamSource.NonEmpty<I[K]>; }): AsyncStream.NonEmpty<[T | O, ...{ [K in keyof I]: O | I[K]; }]>; <I extends readonly [...], O>(fillValue: AsyncOptLazy<...>, ...streams: { [K in keyof I]: AsyncStreamSource<...>; }): AsyncStream<...>; };
  //   unzip<L extends number, T2 extends T = T>(length: L): T2 extends readonly [unknown, ...unknown[]] & { length: L; } ? { [K in keyof T2]: AsyncStream<T2[K]>; } : never {
  //       throw new Error('Method not implemented.');
  //   }
}

class AsyncFromStream<T> extends AsyncStreamBase<T> {
  [Symbol.asyncIterator]: () => AsyncFastIterator<T>;

  constructor(readonly createIterator: () => AsyncFastIterator<T>) {
    super();
    this[Symbol.asyncIterator] = createIterator;
  }
}

class AsyncPrependStream<T> extends AsyncStreamBase<T> {
  constructor(readonly source: AsyncStream<T>, readonly item: AsyncOptLazy<T>) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T> {
    return new AsyncPrependIterator(
      this.source[Symbol.asyncIterator](),
      this.item
    );
  }

  async first(): Promise<T> {
    return AsyncOptLazy.toMaybePromise(this.item);
  }

  async last(): Promise<T> {
    return this.source.last(this.item);
  }

  async count(): Promise<number> {
    return (await this.source.count()) + 1;
  }
}

class AsyncPrependIterator<T> extends AsyncFastIteratorBase<T> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly item: AsyncOptLazy<T>
  ) {
    super();
  }

  prependDone = false;

  fastNext<O>(otherwise?: AsyncOptLazy<O>): MaybePromise<T | O> {
    if (this.prependDone) return this.source.fastNext(otherwise!);
    this.prependDone = true;
    return AsyncOptLazy.toMaybePromise(this.item);
  }
}

class AsyncAppendStream<T> extends AsyncStreamBase<T> {
  constructor(readonly source: AsyncStream<T>, readonly item: AsyncOptLazy<T>) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T> {
    return new AsyncAppendIterator(
      this.source[Symbol.asyncIterator](),
      this.item
    );
  }

  first(): Promise<T> {
    return this.source.first(this.item);
  }

  async last(): Promise<T> {
    return AsyncOptLazy.toMaybePromise(this.item);
  }

  async count(): Promise<number> {
    return (await this.source.count()) + 1;
  }
}

class AsyncAppendIterator<T> extends AsyncFastIteratorBase<T> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly item: AsyncOptLazy<T>
  ) {
    super();
  }

  appendDone = false;

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T | O> {
    if (this.appendDone) return AsyncOptLazy.toMaybePromise(otherwise!);

    const done = Symbol('Done');

    const value = await this.source.fastNext(done);

    if (done !== value) return value;

    this.appendDone = true;

    return AsyncOptLazy.toMaybePromise(this.item);
  }
}

class AsyncIndexedStream<T> extends AsyncStreamBase<[number, T]> {
  constructor(readonly source: AsyncStream<T>, readonly startIndex: number) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<[number, T]> {
    return new AsyncIndexedIterator<T>(
      this.source[Symbol.asyncIterator](),
      this.startIndex
    );
  }

  count(): Promise<number> {
    return this.source.count();
  }
}

class AsyncIndexedIterator<T> extends AsyncFastIteratorBase<[number, T]> {
  index: number;

  constructor(readonly source: AsyncFastIterator<T>, readonly startIndex = 0) {
    super();
    this.index = startIndex;
  }

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<[number, T] | O> {
    const done = Symbol('Done');
    const value = await this.source.fastNext(done);

    if (done === value) return AsyncOptLazy.toMaybePromise(otherwise!);

    return [this.index++, value];
  }
}

class AsyncMapStream<T, T2> extends AsyncStreamBase<T2> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly mapFun: (value: T, index: number) => MaybePromise<T2>
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T2> {
    return new AsyncMapIterator(
      this.source[Symbol.asyncIterator](),
      this.mapFun
    );
  }

  async first<O>(otherwise?: AsyncOptLazy<O>): Promise<T2 | O> {
    const done = Symbol('Done');
    const value = await this.source.first(done);
    if (done === value) return AsyncOptLazy.toMaybePromise(otherwise!);
    return this.mapFun(value, 0);
  }

  async last<O>(otherwise?: AsyncOptLazy<O>): Promise<T2 | O> {
    const done = Symbol('Done');
    const value = await this.source.last(done);
    if (done === value) return AsyncOptLazy.toMaybePromise(otherwise!);
    return this.mapFun(value, 0);
  }

  async count(): Promise<number> {
    return this.source.count();
  }

  async elementAt<O>(
    index: number,
    otherwise?: AsyncOptLazy<O>
  ): Promise<T2 | O> {
    const done = Symbol('Done');
    const value = await this.source.elementAt(index, done);
    if (done === value) return AsyncOptLazy.toMaybePromise(otherwise!);
    return this.mapFun(value, index);
  }

  map<T3>(
    mapFun: (value: T2, index: number) => MaybePromise<T3>
  ): AsyncStream<T3> {
    return new AsyncMapStream(this.source, async (value, index) =>
      mapFun(await this.mapFun(value, index), index)
    );
  }
}

class AsyncMapIterator<T, T2> extends AsyncFastIteratorBase<T2> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly mapFun: (value: T, index: number) => MaybePromise<T2>
  ) {
    super();
  }

  readonly state = TraverseState();

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T2 | O> {
    const state = this.state;

    if (state.halted) return AsyncOptLazy.toMaybePromise(otherwise!);

    const done = Symbol('Done');
    const next = await this.source.fastNext(done);

    if (done === next) return AsyncOptLazy.toMaybePromise(otherwise!);

    return this.mapFun(next, state.nextIndex());
  }
}

class AsyncMapPureStream<
  T,
  A extends readonly unknown[],
  T2
> extends AsyncStreamBase<T2> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly mapFun: (value: T, ...args: A) => MaybePromise<T2>,
    readonly args: A
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T2> {
    return new AsyncMapPureIterator(
      this.source[Symbol.asyncIterator](),
      this.mapFun,
      this.args
    );
  }

  async first<O>(otherwise?: AsyncOptLazy<O>): Promise<T2 | O> {
    const done = Symbol('Done');
    const value = await this.source.first(done);
    if (done === value) return AsyncOptLazy.toMaybePromise(otherwise!);
    return this.mapFun(value, ...this.args);
  }

  async last<O>(otherwise?: AsyncOptLazy<O>): Promise<T2 | O> {
    const done = Symbol('Done');
    const value = await this.source.last(done);
    if (done === value) return AsyncOptLazy.toMaybePromise(otherwise!);
    return this.mapFun(value, ...this.args);
  }

  async count(): Promise<number> {
    return this.source.count();
  }

  async elementAt<O>(
    index: number,
    otherwise?: AsyncOptLazy<O>
  ): Promise<T2 | O> {
    const done = Symbol('Done');
    const value = await this.source.elementAt(index, done);
    if (done === value) return AsyncOptLazy.toMaybePromise(otherwise!);
    return this.mapFun(value, ...this.args);
  }
}

class AsyncMapPureIterator<
  T,
  A extends readonly unknown[],
  T2
> extends AsyncFastIteratorBase<T2> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly mapFun: (value: T, ...args: A) => MaybePromise<T2>,
    readonly args: A
  ) {
    super();
  }

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T2 | O> {
    const done = Symbol('Done');
    const next = await this.source.fastNext(done);

    if (done === next) return AsyncOptLazy.toMaybePromise(otherwise!);

    return this.mapFun(next, ...this.args);
  }
}

class AsyncFlatMapStream<T, T2> extends AsyncStreamBase<T2> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly flatmapFun: (
      value: T,
      index: number,
      halt: () => void
    ) => AsyncStreamSource<T2>
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T2> {
    return new AsyncFlatMapIterator<T, T2>(this.source, this.flatmapFun);
  }
}

class AsyncFlatMapIterator<T, T2> extends AsyncFastIteratorBase<T2> {
  iterator: AsyncFastIterator<T>;

  constructor(
    readonly source: AsyncStream<T>,
    readonly flatMapFun: (
      value: T,
      index: number,
      halt: () => void
    ) => AsyncStreamSource<T2>
  ) {
    super();
    this.iterator = this.source[Symbol.asyncIterator]();
  }

  readonly state = TraverseState();

  done = false;
  currentIterator: null | AsyncFastIterator<T2> = null;

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T2 | O> {
    const state = this.state;

    if (state.halted || this.done)
      return AsyncOptLazy.toMaybePromise(otherwise!);

    const done = Symbol('Done');

    let nextValue: T2 | typeof done = done;

    while (
      null === this.currentIterator ||
      done === (nextValue = await this.currentIterator.fastNext(done))
    ) {
      const nextIter = await this.iterator.fastNext(done);

      if (done === nextIter) {
        this.done = true;
        return AsyncOptLazy.toMaybePromise(otherwise!);
      }

      const nextSource = this.flatMapFun(
        nextIter,
        state.nextIndex(),
        state.halt
      );

      this.currentIterator =
        AsyncStream.from(nextSource)[Symbol.asyncIterator]();
    }

    return nextValue;
  }
}

class AsyncConcatIterator<T> extends AsyncFastIteratorBase<T> {
  iterator: AsyncFastIterator<T>;

  constructor(
    readonly source: AsyncStream<T>,
    readonly otherSources: AsyncStreamSource<T>[]
  ) {
    super();

    this.iterator = source[Symbol.asyncIterator]();
  }

  sourceIndex = 0;

  async fastNext<O>(otherwise?: AsyncOptLazy<O>) {
    const done = Symbol('Done');
    let value: T | typeof done;
    const length = this.otherSources.length;

    while (done === (value = await this.iterator.fastNext(done))) {
      if (this.sourceIndex >= length)
        return AsyncOptLazy.toMaybePromise(otherwise!);

      let nextSource: AsyncStreamSource<T> =
        this.otherSources[this.sourceIndex++];

      while (AsyncStreamSource.isEmptyInstance(nextSource)) {
        if (this.sourceIndex >= length) {
          return AsyncOptLazy.toMaybePromise(otherwise!);
        }
        nextSource = this.otherSources[this.sourceIndex++];
      }

      this.iterator = AsyncStream.from(nextSource)[Symbol.asyncIterator]();
    }

    return value;
  }
}

class AsyncConcatStream<T> extends AsyncStreamBase<T> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly others: AsyncStreamSource<T>[]
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T> {
    return new AsyncConcatIterator(this.source, this.others);
  }
}

class AsyncIntersperseIterator<T, S> extends AsyncFastIteratorBase<T | S> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly sepStream: AsyncStream<S>
  ) {
    super();
  }

  sepIterator: AsyncFastIterator<S> | undefined;
  nextValue!: T;
  isInitialized = false;

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T | S | O> {
    const done = Symbol('Done');

    if (undefined !== this.sepIterator) {
      const sepNext = await this.sepIterator.fastNext(done);
      if (done !== sepNext) return sepNext;
      this.sepIterator = undefined;
    }

    if (this.isInitialized) {
      const newNextValue = await this.source.fastNext(done);
      if (done === newNextValue) {
        this.isInitialized = false;
        return this.nextValue;
      }
      const currentNextValue = this.nextValue;
      this.nextValue = newNextValue;
      this.sepIterator = this.sepStream[Symbol.asyncIterator]();
      return currentNextValue;
    }

    const nextValue = await this.source.fastNext(done);
    if (done === nextValue) return AsyncOptLazy.toMaybePromise(otherwise!);

    const newNextValue = await this.source.fastNext(done);
    if (done === newNextValue) return nextValue;

    this.nextValue = newNextValue;
    this.isInitialized = true;
    this.sepIterator = this.sepStream[Symbol.asyncIterator]();
    return nextValue;
  }
}

class AsyncIntersperseStream<T, S> extends AsyncStreamBase<T | S> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly sepStream: AsyncStream<S>
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T | S> {
    return new AsyncIntersperseIterator(
      this.source[Symbol.asyncIterator](),
      this.sepStream
    );
  }
}

class AsyncFilterIterator<T> extends AsyncFastIteratorBase<T> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly pred: (
      value: T,
      index: number,
      halt: () => void
    ) => MaybePromise<boolean>,
    readonly invert: boolean
  ) {
    super();
  }

  readonly state = TraverseState();

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T | O> {
    const state = this.state;
    if (state.halted) return AsyncOptLazy.toMaybePromise(otherwise!);

    const done = Symbol('Done');
    let value: T | typeof done;
    const source = this.source;
    const pred = this.pred;
    const halt = state.halt;

    if (this.invert) {
      while (!state.halted && done !== (value = await source.fastNext(done))) {
        const cond = await pred(value, state.nextIndex(), halt);
        if (!cond) return value;
      }
    } else {
      while (!state.halted && done !== (value = await source.fastNext(done))) {
        const cond = await pred(value, state.nextIndex(), halt);
        if (cond) return value;
      }
    }

    return AsyncOptLazy.toMaybePromise(otherwise!);
  }
}

class AsyncFilterStream<T> extends AsyncStreamBase<T> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly pred: (
      value: T,
      index: number,
      halt: () => void
    ) => MaybePromise<boolean>,
    readonly invert = false
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T> {
    return new AsyncFilterIterator(
      this.source[Symbol.asyncIterator](),
      this.pred,
      this.invert
    );
  }

  filter(
    pred: (value: T, index: number, halt: () => void) => MaybePromise<boolean>
  ): AsyncStream<T> {
    return new AsyncFilterStream(
      this.source,
      async (v, i, halt) =>
        (await this.pred(v, i, halt)) && (await pred(v, i, halt))
    );
  }
}

class AsyncFilterPureIterator<
  T,
  A extends readonly unknown[]
> extends AsyncFastIteratorBase<T> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly pred: (value: T, ...args: A) => MaybePromise<boolean>,
    readonly args: A,
    readonly invert: boolean
  ) {
    super();
  }

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T | O> {
    const done = Symbol('Done');
    let value: T | typeof done;
    const source = this.source;
    const pred = this.pred;
    const args = this.args;

    if (this.invert) {
      while (done !== (value = await source.fastNext(done))) {
        const cond = await pred(value, ...args);
        if (!cond) return value;
      }
    } else {
      while (done !== (value = await source.fastNext(done))) {
        const cond = await pred(value, ...args);
        if (cond) return value;
      }
    }

    return AsyncOptLazy.toMaybePromise(otherwise!);
  }
}

class AsyncFilterPureStream<
  T,
  A extends readonly unknown[]
> extends AsyncStreamBase<T> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly pred: (value: T, ...args: A) => MaybePromise<boolean>,
    readonly args: A,
    readonly invert = false
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T> {
    return new AsyncFilterPureIterator(
      this.source[Symbol.asyncIterator](),
      this.pred,
      this.args,
      this.invert
    );
  }
}

class AsyncCollectIterator<T, R> extends AsyncFastIteratorBase<R> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly collectFun: AsyncCollectFun<T, R>
  ) {
    super();
  }

  readonly state = TraverseState();

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<R | O> {
    const state = this.state;
    if (state.halted) return AsyncOptLazy.toMaybePromise(otherwise!);

    const { halt } = state;

    const done = Symbol('Done');
    let value: T | typeof done;
    const source = this.source;
    const collectFun = this.collectFun;

    while (!state.halted && done !== (value = await source.fastNext(done))) {
      const result = await collectFun(
        value,
        state.nextIndex(),
        CollectFun.Skip,
        halt
      );
      if (CollectFun.Skip === result) continue;

      return result as R;
    }

    return AsyncOptLazy.toMaybePromise(otherwise!);
  }
}

class AsyncCollectStream<T, R> extends AsyncStreamBase<R> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly collectFun: AsyncCollectFun<T, R>
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<R> {
    return new AsyncCollectIterator(
      this.source[Symbol.asyncIterator](),
      this.collectFun
    );
  }
}

class AsyncIndicesWhereIterator<T> extends AsyncFastIteratorBase<number> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly pred: (value: T) => MaybePromise<boolean>
  ) {
    super();
  }

  index = 0;

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<number | O> {
    const done = Symbol('Done');
    let value: T | typeof done;
    const source = this.source;
    const pred = this.pred;

    while (done !== (value = await source.fastNext(done))) {
      const cond = await pred(value);
      if (cond) return this.index++;
      this.index++;
    }

    return AsyncOptLazy.toMaybePromise(otherwise!);
  }
}

class AsyncIndicesWhereStream<T> extends AsyncStreamBase<number> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly pred: (value: T) => MaybePromise<boolean>
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<number> {
    return new AsyncIndicesWhereIterator(
      this.source[Symbol.asyncIterator](),
      this.pred
    );
  }
}

class AsyncIndicesOfIterator<T> extends AsyncFastIteratorBase<number> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly searchValue: T,
    readonly eq: Eq<T>
  ) {
    super();
  }

  index = 0;

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<number | O> {
    const done = Symbol('Done');
    let value: T | typeof done;
    const source = this.source;
    const searchValue = this.searchValue;
    const eq = this.eq;

    while (done !== (value = await source.fastNext(done))) {
      if (eq(searchValue, value)) return this.index++;
      this.index++;
    }

    return AsyncOptLazy.toMaybePromise(otherwise!);
  }
}

class AsyncIndicesOfStream<T> extends AsyncStreamBase<number> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly searchValue: T,
    readonly eq: Eq<T>
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<number> {
    return new AsyncIndicesOfIterator(
      this.source[Symbol.asyncIterator](),
      this.searchValue,
      this.eq
    );
  }
}

class AsyncTakeWhileIterator<T> extends AsyncFastIteratorBase<T> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly pred: (value: T, index: number) => MaybePromise<boolean>
  ) {
    super();
  }

  isDone = false;
  index = 0;

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T | O> {
    const done = Symbol('Done');
    if (this.isDone) return AsyncOptLazy.toMaybePromise(otherwise!);

    const next = await this.source.fastNext(done);

    if (done === next) {
      this.isDone = true;
      return AsyncOptLazy.toMaybePromise(otherwise!);
    }

    if (await this.pred(next, this.index++)) return next;

    this.isDone = true;
    return AsyncOptLazy.toMaybePromise(otherwise!);
  }
}

class AsyncTakeWhileStream<T> extends AsyncStreamBase<T> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly pred: (value: T, index: number) => MaybePromise<boolean>
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T> {
    return new AsyncTakeWhileIterator(
      this.source[Symbol.asyncIterator](),
      this.pred
    );
  }
}

class AsyncDropWhileIterator<T> extends AsyncFastIteratorBase<T> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly pred: (value: T, index: number) => MaybePromise<boolean>
  ) {
    super();
  }

  pass = false;
  index = 0;

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T | O> {
    const source = this.source;
    if (this.pass) return source.fastNext(otherwise!);

    const done = Symbol('Done');
    let value: T | typeof done;

    while (done !== (value = await source.fastNext(done))) {
      this.pass = !(await this.pred(value, this.index++));
      if (this.pass) return value;
    }

    return AsyncOptLazy.toMaybePromise(otherwise!);
  }
}

class AsyncDropWhileStream<T> extends AsyncStreamBase<T> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly pred: (value: T, index: number) => MaybePromise<boolean>
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T> {
    return new AsyncDropWhileIterator(
      this.source[Symbol.asyncIterator](),
      this.pred
    );
  }
}

class AsyncTakeIterator<T> extends AsyncFastIteratorBase<T> {
  constructor(readonly source: AsyncFastIterator<T>, readonly amount: number) {
    super();
  }

  i = 0;

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T | O> {
    if (this.i++ >= this.amount) return AsyncOptLazy.toMaybePromise(otherwise!);

    return this.source.fastNext(otherwise!);
  }
}

class AsyncTakeStream<T> extends AsyncStreamBase<T> {
  constructor(readonly source: AsyncStream<T>, readonly amount: number) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T> {
    return new AsyncTakeIterator(
      this.source[Symbol.asyncIterator](),
      this.amount
    );
  }

  take(amount: number): AsyncStream<T> {
    if (amount === this.amount) return this;
    return this.source.take(amount);
  }
}

class AsyncDropIterator<T> extends AsyncFastIteratorBase<T> {
  remain: number;

  constructor(readonly source: AsyncFastIterator<T>, readonly amount: number) {
    super();

    this.remain = amount;
  }

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T | O> {
    const source = this.source;
    if (this.remain <= 0) return source.fastNext(otherwise!);

    const done = Symbol('Done');
    let value: T | typeof done;

    while (done !== (value = await source.fastNext(done))) {
      if (this.remain-- <= 0) return value;
    }

    return AsyncOptLazy.toMaybePromise(otherwise!);
  }
}

class AsyncDropStream<T> extends AsyncStreamBase<T> {
  constructor(readonly source: AsyncStream<T>, readonly amount: number) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T> {
    return new AsyncDropIterator(
      this.source[Symbol.asyncIterator](),
      this.amount
    );
  }

  drop(amount: number): AsyncStream<T> {
    if (amount <= 0) return this;
    return this.source.drop(this.amount + amount);
  }
}

class AsyncRepeatIterator<T> extends AsyncFastIteratorBase<T> {
  iterator: AsyncFastIterator<T>;
  remain?: number;

  constructor(readonly source: AsyncStream<T>, readonly amount?: number) {
    super();

    this.iterator = source[Symbol.asyncIterator]();
    this.remain = amount;
  }

  isEmpty = true;

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T | O> {
    const done = Symbol('Done');
    let value = await this.iterator.fastNext(done);

    if (done !== value) {
      this.isEmpty = false;
      return value;
    }

    if (this.isEmpty) return AsyncOptLazy.toMaybePromise(otherwise!) as O;

    if (undefined !== this.remain) {
      this.remain--;

      if (this.remain <= 0) return AsyncOptLazy.toMaybePromise(otherwise!);
    }

    this.iterator = this.source[Symbol.asyncIterator]();
    value = await this.iterator.fastNext(done);
    if (done === value) return AsyncOptLazy.toMaybePromise(otherwise!);

    return value;
  }
}

class AsyncSplitWhereIterator<T> extends AsyncFastIteratorBase<T[]> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly pred: (value: T, index: number) => MaybePromise<boolean>
  ) {
    super();
  }

  index = 0;

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T[] | O> {
    const result: T[] = [];

    const source = this.source;
    const done = Symbol('Done');
    let value: T | typeof done;
    const pred = this.pred;

    const startIndex = this.index;

    while (done !== (value = await source.fastNext(done))) {
      if (await pred(value, this.index++)) return result;
      result.push(value);
    }

    if (startIndex === this.index)
      return AsyncOptLazy.toMaybePromise(otherwise!);

    return result;
  }
}

class AsyncSplitWhereStream<T> extends AsyncStreamBase<T[]> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly pred: (value: T, index: number) => MaybePromise<boolean>
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T[]> {
    return new AsyncSplitWhereIterator(
      this.source[Symbol.asyncIterator](),
      this.pred
    );
  }
}

class AsyncSplitOnIterator<T> extends AsyncFastIteratorBase<T[]> {
  constructor(
    readonly source: AsyncFastIterator<T>,
    readonly sepElem: T,
    readonly eq: Eq<T>
  ) {
    super();
  }

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<T[] | O> {
    const result: T[] = [];

    const source = this.source;
    const done = Symbol('Done');
    let value: T | typeof done;
    let processed = false;
    const eq = this.eq;
    const sepElem = this.sepElem;

    while (done !== (value = await source.fastNext(done))) {
      processed = true;
      if (eq(value, sepElem)) return result;
      result.push(value);
    }

    if (!processed) return AsyncOptLazy.toMaybePromise(otherwise!);

    return result;
  }
}

class AsyncSplitOnStream<T> extends AsyncStreamBase<T[]> {
  constructor(
    readonly source: AsyncStream<T>,
    readonly sepElem: T,
    readonly eq: Eq<T>
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<T[]> {
    return new AsyncSplitOnIterator(
      this.source[Symbol.asyncIterator](),
      this.sepElem,
      this.eq
    );
  }
}

class AsyncReduceIterator<I, R> extends AsyncFastIteratorBase<R> {
  state: unknown;

  constructor(
    readonly source: AsyncFastIterator<I>,
    readonly reducer: Reducer<I, R>
  ) {
    super();

    this.state = Reducer.Init(reducer.init);
  }

  halted = false;
  index = 0;

  halt = (): void => {
    this.halted = true;
  };

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<R | O> {
    if (this.halted) return AsyncOptLazy.toMaybePromise(otherwise!);
    const done = Symbol('Done');
    const value = await this.source.fastNext(done);

    if (done === value) return AsyncOptLazy.toMaybePromise(otherwise!);

    const reducer = this.reducer;
    this.state = reducer.next(this.state, value, this.index++, this.halt);

    return reducer.stateToResult(this.state);
  }
}

class AsyncReduceStream<I, R> extends AsyncStreamBase<R> {
  constructor(
    readonly source: AsyncStream<I>,
    readonly reducerDef: Reducer<I, R>
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<R> {
    return new AsyncReduceIterator(
      this.source[Symbol.asyncIterator](),
      this.reducerDef
    );
  }
}

class AsyncReduceAllIterator<I, R> extends AsyncFastIteratorBase<R> {
  readonly state: unknown[];
  readonly done: ((() => void) | null)[];

  constructor(
    readonly source: AsyncFastIterator<I>,
    readonly reducers: Reducer<I, any>[]
  ) {
    super();

    this.state = reducers.map((d: any): unknown => Reducer.Init(d.init));
    this.done = this.state.map((_: any, i: any): (() => void) => (): void => {
      this.done[i] = null;
    });
  }

  halted = false;
  index = 0;
  isDone = false;

  async fastNext<O>(otherwise?: AsyncOptLazy<O>): Promise<R | O> {
    if (this.halted || this.isDone) {
      return AsyncOptLazy.toMaybePromise(otherwise!);
    }

    const done = Symbol('Done');
    const value = await this.source.fastNext(done);

    if (done === value) return AsyncOptLazy.toMaybePromise(otherwise!);

    const reducers = this.reducers;
    const length = reducers.length;
    let i = -1;
    let anyNotDone = false;

    while (++i < length) {
      const halt = this.done[i];
      if (null !== halt) {
        anyNotDone = true;
        const reducer = reducers[i];
        this.state[i] = reducer.next(this.state[i], value, this.index, halt);
      }
    }
    this.isDone = !anyNotDone;
    if (!anyNotDone) return AsyncOptLazy.toMaybePromise(otherwise!);
    this.index++;

    return this.state.map((s, i) =>
      reducers[i].stateToResult(s)
    ) as unknown as O;
  }
}

class AsyncReduceAllStream<I, R> extends AsyncStreamBase<R> {
  constructor(
    readonly source: AsyncStream<I>,
    readonly reducers: Reducer<I, any>[]
  ) {
    super();
  }

  [Symbol.asyncIterator](): AsyncFastIterator<R> {
    return new AsyncReduceAllIterator(
      this.source[Symbol.asyncIterator](),
      this.reducers
    );
  }
}
