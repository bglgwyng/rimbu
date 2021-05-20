import { OptLazy } from '@rimbu/common';
import { FastIterator } from '../src';

describe('FastIterator', () => {
  it('fixedDone', () => {
    expect(FastIterator.fixedDone).toEqual({ done: true, value: undefined });
  });

  it('emptyFastIterator', () => {
    expect(FastIterator.emptyFastIterator.fastNext()).toEqual(undefined);
    expect(FastIterator.emptyFastIterator.fastNext(1)).toEqual(1);
    expect(FastIterator.emptyFastIterator.fastNext(() => 1)).toEqual(1);
    expect(FastIterator.emptyFastIterator.next()).toBe(FastIterator.fixedDone);
  });

  it('Base', () => {
    class Test1 extends FastIterator.Base<number> {
      fastNext(): number {
        return 1;
      }
    }

    class Test2 extends FastIterator.Base<number> {
      fastNext<O>(otherwise?: OptLazy<O>): number | O {
        return OptLazy(otherwise)!;
      }
    }

    const t1 = new Test1();
    expect(t1.next()).toEqual({ done: false, value: 1 });

    const t2 = new Test2();
    expect(t2.next()).toEqual({ done: true, value: undefined });
  });
});
