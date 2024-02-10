import {
  AsyncReducer,
  AsyncStream,
  AsyncTransformer,
  Reducer,
  Transformer,
} from '../src/main/index.mjs';

describe('AsyncTransformer', () => {
  it('window', async () => {
    expect(
      await AsyncStream.empty().transform(AsyncTransformer.window(3)).toArray()
    ).toEqual([]);
    expect(
      await AsyncStream.of(1, 2).transform(AsyncTransformer.window(3)).toArray()
    ).toEqual([]);
    expect(
      await AsyncStream.of(1, 2, 3)
        .transform(AsyncTransformer.window(3))
        .toArray()
    ).toEqual([[1, 2, 3]]);
    expect(
      await AsyncStream.of(1, 2, 3, 4, 5)
        .transform(AsyncTransformer.window(3))
        .toArray()
    ).toEqual([[1, 2, 3]]);
    expect(
      await AsyncStream.of(1, 2, 3, 4, 5, 6)
        .transform(AsyncTransformer.window(3))
        .toArray()
    ).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it('sliding window', async () => {
    expect(
      await AsyncStream.of(1, 2, 3, 4, 5, 6)
        .transform(AsyncTransformer.window(3, { skipAmount: 1 }))
        .toArray()
    ).toEqual([
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
      [4, 5, 6],
    ]);
  });

  it('collects to different targets', async () => {
    expect(
      await AsyncStream.of(1, 2, 3, 4, 5, 6)
        .transform(
          AsyncTransformer.window(3, {
            skipAmount: 1,
            collector: AsyncReducer.from(Reducer.toJSSet()),
          })
        )
        .toArray()
    ).toEqual([
      new Set([1, 2, 3]),
      new Set([2, 3, 4]),
      new Set([3, 4, 5]),
      new Set([4, 5, 6]),
    ]);
  });

  it('distinctPrevious', async () => {
    expect(
      await AsyncStream.empty<number>()
        .transform(AsyncTransformer.from(Transformer.distinctPrevious()))
        .toArray()
    ).toEqual([]);
    expect(
      await AsyncStream.of(1, 2, 2, 3, 1, 1, 3)
        .transform(AsyncTransformer.from(Transformer.distinctPrevious()))
        .toArray()
    ).toEqual([1, 2, 3, 1, 3]);
  });
});
