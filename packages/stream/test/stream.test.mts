import { Arr } from '@rimbu/base';
import { Eq } from '@rimbu/common';

import { Stream, Reducer } from '../src/main/index.mjs';

function isNonEmpty(it: Stream.NonEmpty<any>) {
  //
}

const streamRange1 = Stream.range({ amount: 100 });
const streamRange2 = Stream.from(streamRange1.toArray());
const streamRange3 = Stream.from(new Set(streamRange1.toArray()));
const streamRange4 = Stream.range({ amount: 10 }).concat(
  Stream.range({ start: 10, end: [100, false] }).toArray()
);
const streamRange5 = Stream.range({ amount: 100 }).map((v) => v);
const streamRange6 = Stream.range({ amount: 99 }).append(99);
const streamRange7 = Stream.range({ start: 1, amount: 99 }).prepend(0);
const streamRange8 = Stream.range({ amount: 100 }).filter(() => true);
const arr = Stream.range({ start: 99, end: 0 }, { delta: -1 }).toArray();
const streamRange9 = Stream.fromArray(arr, { reversed: true });
const streamRange10 = Stream.range({ amount: 100 }).mapPure((v) => v);
const streamRange11 = Stream.range({ amount: 100 }).filterPure({
  pred: (v) => true,
});
const streamRange12 = Stream.range({ amount: 100 })
  .indexed()
  .map(([v]) => v);
const streamRange13 = Stream.range({ amount: 100 }).collect((v) => v);
const streamRange14 = Stream.range({ amount: 200 }).take(100);
const streamRange15 = Stream.range({ start: -100, amount: 200 }).drop(100);
const streamRange16 = Stream.applyMap(
  streamRange1.map((v) => [v]),
  (v) => v
);
const streamRange17 = Stream.applyFilter(
  streamRange1.map((v) => [v]),
  { pred: () => true }
).map(([v]) => v);

const sources = [
  streamRange1,
  streamRange2,
  streamRange3,
  streamRange4,
  streamRange5,
  streamRange6,
  streamRange7,
  streamRange8,
  streamRange9,
  streamRange10,
  streamRange11,
  streamRange12,
  streamRange13,
  streamRange14,
  streamRange15,
  streamRange16,
  streamRange17,
];

const artificialEmpty = Stream.range({ amount: 3 }).filter(() => false);

describe('Stream constructors', () => {
  it('empty', () => {
    const e = Stream.empty();
    expect(e).toBe(Stream.empty());
    expect(e.toArray()).toEqual([]);
    expect(e.concat(e)).toBe(e);
    expect([...e]).toEqual([]);
  });

  it('of', () => {
    expect(Stream.of(1).toArray()).toEqual([1]);
    expect(Stream.of(1, 2, 3).toArray()).toEqual([1, 2, 3]);
    isNonEmpty(Stream.of(1));
    expect([...Stream.of(1)]).toEqual([1]);
  });

  it('from', () => {
    expect(Stream.from([])).toBe(Stream.empty());
    expect(Stream.from([1]).toArray()).toEqual([1]);
    expect(Stream.from([1, 2, 3]).toArray()).toEqual([1, 2, 3]);
    expect(Stream.from(new Set()).toArray()).toEqual([]);
    expect(Stream.from(new Set([1, 2, 3])).toArray()).toEqual([1, 2, 3]);
    expect([...Stream.from([1, 2, 3])]).toEqual([1, 2, 3]);
  });

  it('fromArray', () => {
    expect(Stream.fromArray([])).toBe(Stream.empty());
    const arr = [1, 2, 3, 4];
    expect(Stream.fromArray(arr).toArray()).toEqual(arr);
    expect(Stream.fromArray(arr, { reversed: true }).toArray()).toEqual([
      4, 3, 2, 1,
    ]);
    expect(Stream.fromArray(arr, { range: { start: 2 } }).toArray()).toEqual([
      3, 4,
    ]);
    expect(
      Stream.fromArray(arr, { range: { start: 2 }, reversed: true }).toArray()
    ).toEqual([4, 3]);
  });

  it('fromObject', () => {
    expect(Stream.fromObject({}).toArray()).toEqual([]);
    expect(Stream.fromObject({ a: 1 }).toArray()).toEqual([['a', 1]]);
    expect(Stream.fromObject({ a: 1, b: 'a' }).toArray()).toEqual([
      ['a', 1],
      ['b', 'a'],
    ]);
  });

  it('fromObjectKeys', () => {
    expect(Stream.fromObjectKeys({}).toArray()).toEqual([]);
    expect(Stream.fromObjectKeys({ a: 1 }).toArray()).toEqual(['a']);
    expect(Stream.fromObjectKeys({ a: 1, b: 'a' }).toArray()).toEqual([
      'a',
      'b',
    ]);
  });

  it('fromObjectValues', () => {
    expect(Stream.fromObjectValues({}).toArray()).toEqual([]);
    expect(Stream.fromObjectValues({ a: 1 }).toArray()).toEqual([1]);
    expect(Stream.fromObjectValues({ a: 1, b: 'a' }).toArray()).toEqual([
      1,
      'a',
    ]);
  });

  it('fromString', () => {
    expect(Stream.fromString('')).toBe(Stream.empty());
    expect(Stream.fromString('')).toBe(Stream.empty());
    expect(Stream.fromString('abc').toArray()).toEqual(['a', 'b', 'c']);
    expect(
      Stream.fromString('abc', {
        range: { amount: 2 },
        reversed: true,
      }).toArray()
    ).toEqual(['b', 'a']);
    expect(Stream.fromString('abc').join()).toEqual('abc');
    expect(Stream.fromString('abc', { reversed: true }).join()).toEqual('cba');
    expect(
      Stream.fromString('abc', { range: { amount: 2 }, reversed: true }).join()
    ).toEqual('ba');
  });

  it('always', () => {
    expect(Stream.always(5).take(5).toArray()).toEqual([5, 5, 5, 5, 5]);
    expect(Stream.always(5).first()).toBe(5);
    // expect(Stream.always(5).last()).toBe(5);
    expect(Stream.always(5).elementAt(10000)).toBe(5);
  });

  it('flatten', () => {
    expect(Stream.flatten(Stream.empty())).toBe(Stream.empty());
    expect(Stream.flatten(Stream.of([])).toArray()).toEqual([]);
    expect(Stream.flatten(Stream.of([1, 2])).toArray()).toEqual([1, 2]);
    expect(Stream.flatten(Stream.of([1, 2], [3], [4])).toArray()).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it('range', () => {
    expect(Stream.range({ start: 0, end: 5 }).toArray()).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
    expect(Stream.range({ start: 5, end: 0 }, { delta: -1 }).toArray()).toEqual(
      [5, 4, 3, 2, 1, 0]
    );
    expect(Stream.range({ start: 0, end: -5 })).toBe(Stream.empty());
    expect(Stream.range({ start: 0, end: 5 }, { delta: -1 })).toBe(
      Stream.empty()
    );
    expect([...Stream.range({ start: 0, end: 5 })]).toEqual([0, 1, 2, 3, 4, 5]);
    expect(Stream.range({ end: 5 }).toArray()).toEqual([0, 1, 2, 3, 4, 5]);
    expect(Stream.range({ amount: 5 }).toArray()).toEqual([0, 1, 2, 3, 4]);
    expect(Stream.range({ start: 2, amount: 5 }).toArray()).toEqual([
      2, 3, 4, 5, 6,
    ]);
    expect(
      Stream.range({ start: [0, true], end: [3, true] }).toArray()
    ).toEqual([0, 1, 2, 3]);
    expect(
      Stream.range({ start: [0, false], end: [3, false] }).toArray()
    ).toEqual([1, 2]);
  });

  it('random', () => {
    const arr = Stream.random().take(5).toArray();
    expect(arr.length).toBe(5);
  });

  it('randomInt', () => {
    const arr = Stream.randomInt(0, 100).take(5).toArray();
    expect(arr.length).toBe(5);
  });

  it('unfold', () => {
    expect(Stream.unfold(0, (c, n, stop) => stop).toArray()).toEqual([0]);
    expect(
      Stream.unfold(0, (c, i, stop) => (c > 2 ? stop : c + i)).toArray()
    ).toEqual([0, 1, 3]);
  });

  it('applyForEach', () => {
    const source = Stream.range({ amount: 4 }).indexed();
    let sum = 0;
    Stream.applyForEach(source, (v1, v2) => (sum += v1 + v2));
    expect(sum).toBe(12);
  });

  it('applyMap', () => {
    const source = Stream.range({ amount: 4 }).indexed();
    expect(Stream.applyMap(source, (v1, v2) => v1 + v2).toArray()).toEqual([
      0, 2, 4, 6,
    ]);
  });

  it('applyFilter', () => {
    const source = Stream.range({ amount: 4 }).indexed();
    expect(
      Stream.applyFilter(source, { pred: (v1, v2) => v1 === v2 })
        .map(([v]) => v)
        .toArray()
    ).toEqual([0, 1, 2, 3]);
  });
});

describe('Stream methods', () => {
  it('stream', () => {
    expect(Stream.empty<number>().stream()).toBe(Stream.empty<string>());
    const s = Stream.of(1, 2, 3);
    expect(s.stream()).toBe(s);

    sources.forEach((source) => {
      expect(source.stream()).toBe(source);
    });
  });

  it('equals', () => {
    const s1 = Stream.empty<number>();
    const s2 = Stream.of(1, 2, 3);
    expect(s1.equals(s1)).toBe(true);
    expect(s1.equals([])).toBe(true);
    expect(s1.equals(s2)).toBe(false);
    expect(s2.equals(s1)).toBe(false);
    expect(s2.equals([])).toBe(false);
    expect(s2.equals(s2)).toBe(true);
    expect(Stream.of('a', 'b').equals(['A', 'B'])).toBe(false);
    expect(
      Stream.of('a', 'b').equals(['A', 'B'], {
        eq: Eq.stringCaseInsentitiveEq(),
      })
    ).toBe(true);

    sources.forEach((source) => {
      expect(source.equals([])).toBe(false);
      expect(source.equals(source)).toBe(true);
    });
  });

  it('assumeNonEmpty', () => {
    expect(() => Stream.empty<number>().assumeNonEmpty()).toThrow();
    const s = Stream.of(1, 2, 3);
    expect(s.assumeNonEmpty()).toBe(s);

    expect(artificialEmpty.assumeNonEmpty()).toBe(artificialEmpty);

    sources.forEach((source) => {
      expect(source.assumeNonEmpty()).toBe(source);
    });
  });

  it('asNormal', () => {
    const s = Stream.of(1, 2, 3);
    expect(s.asNormal()).toBe(s);

    sources.forEach((source) =>
      expect(source.assumeNonEmpty().asNormal()).toBe(source)
    );
  });

  it('prepend', () => {
    expect(Stream.empty<number>().prepend(5).toArray()).toEqual([5]);

    expect(Stream.of(1, 2, 3).prepend(5).toArray()).toEqual([5, 1, 2, 3]);

    expect(artificialEmpty.prepend(5).toArray()).toEqual([5]);

    sources.forEach((source) => {
      const arr = [5, ...source.toArray()];
      expect(source.prepend(5).toArray()).toEqual(arr);
    });
  });

  it('append', () => {
    expect(Stream.empty<number>().append(5).toArray()).toEqual([5]);

    expect(Stream.of(1, 2, 3).append(5).toArray()).toEqual([1, 2, 3, 5]);

    expect(artificialEmpty.append(5).toArray()).toEqual([5]);

    sources.forEach((source) => {
      const arr = [...source.toArray(), 5];
      expect(source.append(5).toArray()).toEqual(arr);
    });
  });

  it('forEach', () => {
    Stream.empty().forEach(() => {
      expect(true).toBe(false);
    });
    Stream.of(1).forEach((v) => {
      expect(v).toBe(1);
    });
    let result = 0;
    Stream.of(1, 2, 3).forEach((v) => {
      result += v;
    });
    expect(result).toBe(6);
    result = 0;
    Stream.of(1, 2, 3).forEach((v, _, halt) => {
      if (v > 2) return halt();
      result += v;
    });
    expect(result).toBe(3);

    sources.forEach((source) => {
      result = 0;
      source.forEach((v) => {
        result += v;
      });
      expect(result).toBe(4950);
      result = 0;
      source.forEach((v, _, halt): void => {
        if (v > 70) return halt();
        result += v;
      });
      expect(result).toBe(2485);
      result = 0;
      source.forEach((v, _, halt) => {
        if (v > 5) return halt();
        result += v;
      });
      expect(result).toBe(15);
    });
  });

  it('forEachPure', () => {
    Stream.empty().forEachPure(() => {
      expect(true).toBe(false);
    });
    Stream.of(1).forEachPure((v) => {
      expect(v).toBe(1);
    });
    let result = 0;
    Stream.of(1, 2, 3).forEachPure((v) => {
      result += v;
    });
    expect(result).toBe(6);

    sources.forEach((source) => {
      result = 0;
      source.forEachPure((v) => {
        result += v;
      });
      expect(result).toBe(4950);
    });
  });

  it('indexed', () => {
    expect(Stream.empty().indexed()).toBe(Stream.empty());
    expect(Stream.of(1).indexed().toArray()).toEqual([[0, 1]]);
    expect(Stream.of(1, 2, 3).indexed().toArray()).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
    expect(Stream.of(1, 2, 3).indexed({ startIndex: 5 }).toArray()).toEqual([
      [5, 1],
      [6, 2],
      [7, 3],
    ]);

    sources.forEach((source) => {
      expect(source.indexed().toArray()).toEqual(
        source.toArray().map((v, i) => [i, v])
      );
    });
  });

  it('map', () => {
    expect(Stream.empty().map((v) => v)).toBe(Stream.empty());
    expect(
      Stream.of(1, 2, 3)
        .map((v) => v + 1)
        .toArray()
    ).toEqual([2, 3, 4]);

    sources.forEach((source) => {
      expect(source.map((v) => v).toArray()).toEqual(source.toArray());
    });
  });

  it('mapPure', () => {
    expect(Stream.empty().mapPure((v) => v)).toBe(Stream.empty());
    expect(
      Stream.of(1, 2, 3)
        .mapPure((v) => v + 1)
        .toArray()
    ).toEqual([2, 3, 4]);

    sources.forEach((source) => {
      expect(source.mapPure((v) => v).toArray()).toEqual(source.toArray());
    });
  });

  it('flatMap', () => {
    expect(Stream.empty().flatMap((v) => Stream.of(1))).toBe(Stream.empty());
    expect(
      Stream.of(1)
        .flatMap((v) => Stream.empty())
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1)
        .flatMap((v) => Stream.of(2, 3))
        .toArray()
    ).toEqual([2, 3]);
    expect(
      Stream.of(1, 2, 3)
        .flatMap((v) => Stream.of(v + 1))
        .toArray()
    ).toEqual([2, 3, 4]);
    expect(
      Stream.of(1, 2, 3)
        .flatMap((v, i) => [i + 1])
        .toArray()
    ).toEqual([1, 2, 3]);

    expect(
      Stream.of(1, 2, 3)
        .flatMap((v, i) => [v, v])
        .toArray()
    ).toEqual([1, 1, 2, 2, 3, 3]);

    sources.forEach((source) => {
      expect(source.flatMap((v) => [v]).toArray()).toEqual(source.toArray());
    });
  });

  it('flatZip', () => {
    expect(Stream.empty().flatZip((v) => Stream.of(1))).toBe(Stream.empty());
    expect(
      Stream.of(1)
        .flatZip((v) => Stream.empty())
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1)
        .flatZip((v) => Stream.of(2, 3))
        .toArray()
    ).toEqual([
      [1, 2],
      [1, 3],
    ]);
    expect(
      Stream.of(1, 2, 3)
        .flatZip((v) => Stream.of(v + 1))
        .toArray()
    ).toEqual([
      [1, 2],
      [2, 3],
      [3, 4],
    ]);
    expect(
      Stream.of(1, 2, 3)
        .flatZip((v, i) => [i + 1])
        .toArray()
    ).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
    ]);

    expect(
      Stream.of(1, 2, 3)
        .flatZip((v, i) => [v, v])
        .toArray()
    ).toEqual([
      [1, 1],
      [1, 1],
      [2, 2],
      [2, 2],
      [3, 3],
      [3, 3],
    ]);

    sources.forEach((source) => {
      expect(source.flatZip((v) => [v]).toArray()).toEqual(
        source.map((v) => [v, v]).toArray()
      );
    });
  });

  it('filter', () => {
    expect(Stream.empty().filter((v) => true)).toBe(Stream.empty());
    expect(
      Stream.of(1, 2, 3)
        .filter((v) => true)
        .toArray()
    ).toEqual([1, 2, 3]);
    expect(
      Stream.of(1, 2, 3)
        .filter((v) => false)
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1, 2, 3)
        .filter((v) => v % 2 === 1)
        .toArray()
    ).toEqual([1, 3]);

    sources.forEach((source) => {
      expect(source.filter((v) => false).toArray()).toEqual([]);
      expect(source.filter((v) => v % 30 === 0).toArray()).toEqual([
        0, 30, 60, 90,
      ]);
      expect(source.filter((v, i) => i % 30 === 0).toArray()).toEqual([
        0, 30, 60, 90,
      ]);
      expect(
        source
          .filter((v) => v % 15 === 0)
          .filter((v) => v % 20 === 0)
          .toArray()
      ).toEqual([0, 60]);
    });
  });

  it('filter negate', () => {
    expect(Stream.empty().filter((v) => true, { negate: true })).toBe(
      Stream.empty()
    );
    expect(
      Stream.of(1, 2, 3)
        .filter((v) => false, { negate: true })
        .toArray()
    ).toEqual([1, 2, 3]);
    expect(
      Stream.of(1, 2, 3)
        .filter((v) => true, { negate: true })
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1, 2, 3)
        .filter((v) => v % 2 === 0, { negate: true })
        .toArray()
    ).toEqual([1, 3]);

    sources.forEach((source) => {
      expect(source.filter((v) => true, { negate: true }).toArray()).toEqual(
        []
      );
      expect(
        source.filter((v) => v % 30 > 0, { negate: true }).toArray()
      ).toEqual([0, 30, 60, 90]);
      expect(
        source.filter((v, i) => i % 30 > 0, { negate: true }).toArray()
      ).toEqual([0, 30, 60, 90]);
      expect(
        source
          .filter((v) => v % 15 > 0, { negate: true })
          .filter((v) => v % 20 > 0, { negate: true })
          .toArray()
      ).toEqual([0, 60]);
    });
  });

  it('filterPure', () => {
    expect(Stream.empty().filterPure({ pred: (v) => true })).toBe(
      Stream.empty()
    );
    expect(
      Stream.of(1, 2, 3)
        .filterPure({ pred: (v) => true })
        .toArray()
    ).toEqual([1, 2, 3]);
    expect(
      Stream.of(1, 2, 3)
        .filterPure({ pred: (v) => false })
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1, 2, 3)
        .filterPure({ pred: (v) => v % 2 === 1 })
        .toArray()
    ).toEqual([1, 3]);

    sources.forEach((source) => {
      expect(source.filterPure({ pred: (v) => false }).toArray()).toEqual([]);
      expect(
        source.filterPure({ pred: (v) => v % 30 === 0 }).toArray()
      ).toEqual([0, 30, 60, 90]);
      expect(
        source
          .filterPure({ pred: (v) => v % 15 === 0 })
          .filterPure({ pred: (v) => v % 20 === 0 })
          .toArray()
      ).toEqual([0, 60]);
    });
  });

  it('filterPure negate', () => {
    expect(
      Stream.empty().filterPure({ pred: (v) => false, negate: true })
    ).toBe(Stream.empty());
    expect(
      Stream.of(1, 2, 3)
        .filterPure({ pred: (v) => false, negate: true })
        .toArray()
    ).toEqual([1, 2, 3]);
    expect(
      Stream.of(1, 2, 3)
        .filterPure({ pred: (v) => true, negate: true })
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1, 2, 3)
        .filterPure({ pred: (v) => v % 2 === 0, negate: true })
        .toArray()
    ).toEqual([1, 3]);

    sources.forEach((source) => {
      expect(
        source.filterPure({ pred: (v) => true, negate: true }).toArray()
      ).toEqual([]);
      expect(
        source.filterPure({ pred: (v) => v % 30 > 0, negate: true }).toArray()
      ).toEqual([0, 30, 60, 90]);
      expect(
        source
          .filterPure({ pred: (v) => v % 15 > 0, negate: true })
          .filterPure({ pred: (v) => v % 20 > 0, negate: true })
          .toArray()
      ).toEqual([0, 60]);
    });
  });

  it('collect', () => {
    expect(Stream.empty<number>().collect((v) => v + 1)).toBe(Stream.empty());
    expect(
      Stream.of(1)
        .collect((v) => v + 1)
        .toArray()
    ).toEqual([2]);
    expect(
      Stream.of(1)
        .collect((v, i, skip) => skip)
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1, 2, 3)
        .collect((v) => v + 1)
        .toArray()
    ).toEqual([2, 3, 4]);
    expect(
      Stream.of(1, 2, 3)
        .collect((v, i, skip) => (v === 2 ? skip : v))
        .toArray()
    ).toEqual([1, 3]);
    expect(
      Stream.of(1, 2, 3)
        .collect((v, i, skip) => (i === 1 ? skip : v))
        .toArray()
    ).toEqual([1, 3]);
    expect(
      Stream.of(1, 2, 3)
        .collect((v, i, skip, halt) => {
          if (v === 1) {
            halt();
            return v;
          }
          return v;
        })
        .toArray()
    ).toEqual([1]);

    sources.forEach((source) => {
      expect(
        source
          .collect((v, i, skip, halt) => {
            if (v < 50) return skip;
            if (v > 55) {
              halt();
              return skip;
            }
            return v - 50;
          })
          .toArray()
      ).toEqual([0, 1, 2, 3, 4, 5]);
    });
  });

  it('first', () => {
    expect(Stream.empty<number>().first()).toBeUndefined();
    expect(Stream.empty<number>().first(1)).toBe(1);
    expect(Stream.of(1, 2, 3).first()).toBe(1);

    expect(Stream.range({ start: 0 }).first()).toBe(0);

    expect(artificialEmpty.first()).toBe(undefined);
    expect(artificialEmpty.first(5)).toBe(5);

    sources.forEach((source) => {
      const first = source.toArray()[0];
      expect(source.first()).toBe(first);
      expect(source.first('a')).toBe(first);
    });
  });

  it('last', () => {
    expect(Stream.empty<number>().last()).toBeUndefined();
    expect(Stream.empty<number>().last(1)).toBe(1);
    expect(Stream.of(1, 2, 3).last()).toBe(3);

    expect(artificialEmpty.last()).toBe(undefined);
    expect(artificialEmpty.last(5)).toBe(5);

    sources.forEach((source) => {
      const last = Arr.last(source.toArray());
      expect(source.last()).toBe(last);
      expect(source.last('a')).toBe(last);
    });
  });

  it('single', () => {
    expect(Stream.empty<number>().single()).toBeUndefined();
    expect(Stream.empty<number>().single(1)).toBe(1);
    expect(Stream.of(1).single()).toBe(1);
    expect(Stream.of(1).single('a')).toBe(1);
    expect(Stream.of(1, 2, 3).single()).toBeUndefined();
    expect(Stream.of(1, 2, 3).single('a')).toBe('a');

    sources.forEach((source) => {
      const value = source.count() === 1 ? source.first() : undefined;
      expect(source.single()).toBe(value);
      expect(source.single('a')).toBe(value ?? 'a');
    });
  });

  it('count', () => {
    expect(Stream.empty<number>().count()).toBe(0);
    expect(Stream.of(1, 2, 3).count()).toBe(3);

    sources.forEach((source) => {
      expect(source.count()).toEqual(source.toArray().length);
      expect(source.filter((v) => v % 2 === 0).count()).toEqual(
        source.toArray().length / 2
      );
    });
  });

  it('countElement', () => {
    expect(Stream.empty<number>().countElement(5)).toBe(0);
    expect(Stream.empty<number>().countElement(5, { negate: true })).toBe(0);

    expect(Stream.of(1, 2, 3).countElement(2)).toBe(1);
    expect(Stream.of(1, 2, 3).countElement(2, { negate: true })).toBe(2);
    expect(Stream.of(1, 2, 3).countElement(5)).toBe(0);
    expect(Stream.of(1, 2, 3).countElement(5, { negate: true })).toBe(3);

    sources.forEach((source) => {
      expect(source.countElement(50)).toBe(1);
      expect(source.countElement(50, { negate: true })).toBe(99);
      expect(source.countElement(200)).toBe(0);
      expect(source.countElement(200, { negate: true })).toBe(100);
    });
  });

  it('find', () => {
    expect(Stream.empty().find((v) => false)).toBe(undefined);
    expect(Stream.empty().find((v) => false, { otherwise: 'a' })).toBe('a');
    expect(Stream.empty().find((v) => true)).toBe(undefined);
    expect(Stream.empty().find((v) => true, { otherwise: 'a' })).toBe('a');
    expect(Stream.of(1, 2, 3).find((v) => v === 2, { otherwise: 'a' })).toBe(2);
    expect(Stream.of(1, 2, 3).find((v) => v === 10, { otherwise: 'a' })).toBe(
      'a'
    );
    expect(
      Stream.of(1, 2, 1, 4).find((v) => v > 1, {
        occurrance: 2,
        otherwise: 'a',
      })
    ).toBe(4);

    sources.forEach((source) => {
      expect(source.find((v) => v === 70, { otherwise: 'a' })).toBe(70);
      expect(source.find((v) => v === -10, { otherwise: 'a' })).toBe('a');
    });
  });

  it('find negate', () => {
    expect(Stream.empty().find((v) => true, { negate: true })).toBe(undefined);
    expect(
      Stream.empty().find((v) => true, { negate: true, otherwise: 'a' })
    ).toBe('a');
    expect(Stream.empty().find((v) => false, { negate: true })).toBe(undefined);
    expect(
      Stream.empty().find((v) => false, { negate: true, otherwise: 'a' })
    ).toBe('a');
    expect(
      Stream.of(1, 2, 3).find((v) => v !== 2, { negate: true, otherwise: 'a' })
    ).toBe(2);
    expect(
      Stream.of(1, 2, 3).find((v) => v !== 10, { negate: true, otherwise: 'a' })
    ).toBe('a');
    expect(
      Stream.of(1, 2, 1, 4).find((v) => v <= 1, {
        negate: true,
        occurrance: 2,
        otherwise: 'a',
      })
    ).toBe(4);

    sources.forEach((source) => {
      expect(
        source.find((v) => v !== 70, { negate: true, otherwise: 'a' })
      ).toBe(70);
      expect(
        source.find((v) => v !== -10, { negate: true, otherwise: 'a' })
      ).toBe('a');
    });
  });

  it('elementAt', () => {
    expect(Stream.empty().elementAt(0, 'a')).toBe('a');
    expect(Stream.of(1).elementAt(0, 'a')).toBe(1);
    expect(Stream.of(1).elementAt(1, 'a')).toBe('a');

    sources.forEach((source) => {
      expect(source.elementAt(0, 'a')).toBe(0);
      expect(source.elementAt(50, 'a')).toBe(50);
      expect(source.elementAt(99, 'a')).toBe(99);
      expect(source.elementAt(100, 'a')).toBe('a');
    });
  });

  it('indicesWhere', () => {
    expect(Stream.empty<number>().indicesWhere((v) => v > 0)).toBe(
      Stream.empty()
    );
    expect(
      Stream.of(1)
        .indicesWhere((v) => v > 0)
        .toArray()
    ).toEqual([0]);
    expect(
      Stream.of(1)
        .indicesWhere((v) => v < 0)
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1, 2, 1)
        .indicesWhere((v) => v < 2)
        .toArray()
    ).toEqual([0, 2]);

    sources.forEach((source) => {
      expect(source.indicesWhere((v) => v >= 97).toArray()).toEqual([
        97, 98, 99,
      ]);
      expect(source.indicesWhere((v) => v < 0).toArray()).toEqual([]);
    });
  });

  it('indicesWhere negate', () => {
    expect(
      Stream.empty<number>().indicesWhere((v) => v > 0, { negate: true })
    ).toBe(Stream.empty());
    expect(
      Stream.of(1)
        .indicesWhere((v) => v <= 0, { negate: true })
        .toArray()
    ).toEqual([0]);
    expect(
      Stream.of(1)
        .indicesWhere((v) => v >= 0, { negate: true })
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1, 2, 1)
        .indicesWhere((v) => v >= 2, { negate: true })
        .toArray()
    ).toEqual([0, 2]);

    sources.forEach((source) => {
      expect(
        source.indicesWhere((v) => v < 97, { negate: true }).toArray()
      ).toEqual([97, 98, 99]);
      expect(
        source.indicesWhere((v) => v >= 0, { negate: true }).toArray()
      ).toEqual([]);
    });
  });

  it('indicesOf', () => {
    expect(Stream.empty<number>().indicesOf(1)).toBe(Stream.empty());
    expect(Stream.of(1).indicesOf(1).toArray()).toEqual([0]);
    expect(Stream.of(1).indicesOf(2).toArray()).toEqual([]);
    expect(Stream.of(1, 2, 1).indicesOf(1).toArray()).toEqual([0, 2]);

    sources.forEach((source) => {
      expect(source.indicesOf(50).toArray()).toEqual([50]);
      expect(source.indicesOf(-1).toArray()).toEqual([]);
    });
  });

  it('indicesOf negate', () => {
    expect(Stream.empty<number>().indicesOf(1, { negate: true })).toBe(
      Stream.empty()
    );
    expect(Stream.of(1).indicesOf(3, { negate: true }).toArray()).toEqual([0]);
    expect(Stream.of(1).indicesOf(1, { negate: true }).toArray()).toEqual([]);
    expect(Stream.of(1, 2, 1).indicesOf(2, { negate: true }).toArray()).toEqual(
      [0, 2]
    );

    sources.forEach((source) => {
      expect(source.indicesOf(50, { negate: true }).toArray().length).toBe(99);
      expect(source.indicesOf(-1, { negate: true }).toArray().length).toBe(100);
    });
  });

  it('indexWhere', () => {
    expect(Stream.empty<number>().indexWhere((v) => v >= 0)).toBe(undefined);
    expect(Stream.of(1).indexWhere((v) => v >= 0)).toBe(0);
    expect(Stream.of(1).indexWhere((v) => v < 0)).toBe(undefined);
    expect(Stream.of(1).indexWhere((v) => v >= 0, { occurrance: 2 })).toBe(
      undefined
    );
    expect(Stream.of(1, 2, 1).indexWhere((v) => v >= 2)).toBe(1);
    expect(Stream.of(1, 2, 1).indexWhere((v) => v < 0)).toBe(undefined);
    expect(Stream.of(1, 2, 1).indexWhere((v) => v < 2, { occurrance: 2 })).toBe(
      2
    );
    expect(Stream.of(1, 2, 1).indexWhere((v) => v < 2, { occurrance: 3 })).toBe(
      undefined
    );

    sources.forEach((source) => {
      expect(source.indexWhere((v) => v >= 50)).toEqual(50);
      expect(source.indexWhere((v) => v >= 50, { occurrance: 10 })).toEqual(59);
      expect(source.indexWhere((v) => v < 0)).toEqual(undefined);
    });
  });

  it('indexWhere negate', () => {
    expect(
      Stream.empty<number>().indexWhere((v) => v < 0, { negate: true })
    ).toBe(undefined);
    expect(Stream.of(1).indexWhere((v) => v < 0, { negate: true })).toBe(0);
    expect(Stream.of(1).indexWhere((v) => v >= 0, { negate: true })).toBe(
      undefined
    );
    expect(
      Stream.of(1).indexWhere((v) => v < 0, { negate: true, occurrance: 2 })
    ).toBe(undefined);
    expect(Stream.of(1, 2, 1).indexWhere((v) => v < 2, { negate: true })).toBe(
      1
    );
    expect(Stream.of(1, 2, 1).indexWhere((v) => v >= 0, { negate: true })).toBe(
      undefined
    );
    expect(
      Stream.of(1, 2, 1).indexWhere((v) => v >= 2, {
        negate: true,
        occurrance: 2,
      })
    ).toBe(2);
    expect(
      Stream.of(1, 2, 1).indexWhere((v) => v >= 2, {
        negate: true,
        occurrance: 3,
      })
    ).toBe(undefined);

    sources.forEach((source) => {
      expect(source.indexWhere((v) => v < 50, { negate: true })).toEqual(50);
      expect(
        source.indexWhere((v) => v < 50, { negate: true, occurrance: 10 })
      ).toEqual(59);
      expect(source.indexWhere((v) => v >= 0, { negate: true })).toEqual(
        undefined
      );
    });
  });

  it('indexOf', () => {
    expect(Stream.empty<number>().indexOf(1)).toBe(undefined);
    expect(Stream.of(1).indexOf(1)).toBe(0);
    expect(Stream.of(1).indexOf(2)).toBe(undefined);
    expect(Stream.of(1).indexOf(1, { occurrance: 2 })).toBe(undefined);
    expect(Stream.of(1, 2, 1).indexOf(2)).toBe(1);
    expect(Stream.of(1, 2, 1).indexOf(3)).toBe(undefined);
    expect(Stream.of(1, 2, 1).indexOf(1, { occurrance: 2 })).toBe(2);
    expect(Stream.of(1, 2, 1).indexOf(1, { occurrance: 3 })).toBe(undefined);

    sources.forEach((source) => {
      expect(source.indexOf(50)).toEqual(50);
      expect(source.indexOf(50, { occurrance: 2 })).toEqual(undefined);
      expect(source.indexOf(-1)).toEqual(undefined);
    });
  });

  it('indexOf negate', () => {
    expect(Stream.empty<number>().indexOf(1, { negate: true })).toBe(undefined);
    expect(Stream.of(1).indexOf(5, { negate: true })).toBe(0);
    expect(Stream.of(1).indexOf(1, { negate: true })).toBe(undefined);
    expect(Stream.of(1).indexOf(5, { negate: true, occurrance: 2 })).toBe(
      undefined
    );
    expect(Stream.of(1, 2, 1).indexOf(1, { negate: true })).toBe(1);
    expect(Stream.of(1, 2, 1).indexOf(2, { negate: true })).toBe(0);
    expect(Stream.of(1, 2, 1).indexOf(1, { negate: true, occurrance: 2 })).toBe(
      undefined
    );
    expect(
      Stream.of(1, 2, 1, 2).indexOf(1, { negate: true, occurrance: 2 })
    ).toBe(3);
    expect(Stream.of(1, 2, 1).indexOf(2, { negate: true, occurrance: 3 })).toBe(
      undefined
    );

    sources.forEach((source) => {
      expect(source.indexOf(10, { negate: true })).toEqual(0);
      expect(source.indexOf(50, { negate: true, occurrance: 2 })).toEqual(1);
      expect(source.indexOf(50, { negate: true, occurrance: 20 })).toEqual(19);
      expect(source.indexOf(-1, { negate: true })).toEqual(0);
    });
  });

  it('some', () => {
    expect(Stream.empty().some((v) => true)).toBe(false);
    expect(Stream.empty().some((v) => false)).toBe(false);
    expect(Stream.of(1, 2, 3).some((v) => v === 2)).toBe(true);
    expect(Stream.of(1, 2, 3).some((v) => v === 10)).toBe(false);

    sources.forEach((source) => {
      expect(source.some((v) => v === 50)).toBe(true);
      expect(source.some((v) => v === -50)).toBe(false);
      expect(source.some((v, i) => i === 50)).toBe(true);
      expect(source.some((v, i) => i === -50)).toBe(false);
    });
  });

  it('some negate', () => {
    expect(Stream.empty().some((v) => false, { negate: true })).toBe(false);
    expect(Stream.empty().some((v) => true, { negate: true })).toBe(false);
    expect(Stream.of(1, 2, 3).some((v) => v !== 2, { negate: true })).toBe(
      true
    );
    expect(Stream.of(1, 2, 3).some((v) => v !== 10, { negate: true })).toBe(
      false
    );

    sources.forEach((source) => {
      expect(source.some((v) => v !== 50, { negate: true })).toBe(true);
      expect(source.some((v) => v !== -50, { negate: true })).toBe(false);
      expect(source.some((v, i) => i !== 50, { negate: true })).toBe(true);
      expect(source.some((v, i) => i !== -50, { negate: true })).toBe(false);
    });
  });

  it('every', () => {
    expect(Stream.empty().every(() => true)).toBe(true);
    expect(Stream.empty().every(() => false)).toBe(true);
    expect(Stream.of(1, 2, 3).every((v) => v > 0)).toBe(true);
    expect(Stream.of(1, 2, 3).every((v) => v < 3)).toBe(false);
    expect(Stream.of(1, 2, 3).every((v, i) => i >= 0)).toBe(true);
    expect(Stream.of(1, 2, 3).every((v, i) => i < 2)).toBe(false);

    sources.forEach((source) => {
      expect(source.every((v) => v < 50)).toBe(false);
      expect(source.every((v) => v >= 0)).toBe(true);
      expect(source.every((v, i) => i < 50)).toBe(false);
      expect(source.every((v, i) => i >= 0)).toBe(true);
    });
  });

  it('every negate', () => {
    expect(Stream.empty().every(() => false, { negate: true })).toBe(true);
    expect(Stream.empty().every(() => true, { negate: true })).toBe(true);
    expect(Stream.of(1, 2, 3).every((v) => v <= 0, { negate: true })).toBe(
      true
    );
    expect(Stream.of(1, 2, 3).every((v) => v >= 3, { negate: true })).toBe(
      false
    );
    expect(Stream.of(1, 2, 3).every((v, i) => i < 0, { negate: true })).toBe(
      true
    );
    expect(Stream.of(1, 2, 3).every((v, i) => i >= 2, { negate: true })).toBe(
      false
    );

    sources.forEach((source) => {
      expect(source.every((v) => v >= 50, { negate: true })).toBe(false);
      expect(source.every((v) => v < 0, { negate: true })).toBe(true);
      expect(source.every((v, i) => i >= 50, { negate: true })).toBe(false);
      expect(source.every((v, i) => i < 0, { negate: true })).toBe(true);
    });
  });

  it('contains', () => {
    expect(Stream.empty().contains(1)).toBe(false);
    expect(Stream.of(1).contains(1)).toBe(true);
    expect(Stream.of(1).contains(1, { amount: 2 })).toBe(false);
    expect(Stream.of(1).contains(1, { amount: 0 })).toBe(true);
    expect(Stream.of(1).contains(2)).toBe(false);
    expect(Stream.of(1, 2, 1, 2, 1, 2).contains(2, { amount: 2 })).toBe(true);
    expect(Stream.of(1, 2, 1, 2, 1, 2).contains(2, { amount: 3 })).toBe(true);
    expect(Stream.of(1, 2, 1, 2, 1, 2).contains(2, { amount: 4 })).toBe(false);

    sources.forEach((source) => {
      expect(source.contains(50)).toBe(true);
      expect(source.contains(50, { amount: 2 })).toBe(false);
      expect(source.contains(-50)).toBe(false);
      expect(source.contains(-50, { amount: 2 })).toBe(false);
    });
  });

  it('contains negate', () => {
    expect(Stream.empty().contains(1, { negate: true })).toBe(false);
    expect(Stream.of(1).contains(1, { negate: true })).toBe(false);
    expect(Stream.of(1).contains(1, { negate: true, amount: 2 })).toBe(false);
    expect(Stream.of(1).contains(1, { negate: true, amount: 0 })).toBe(true);
    expect(Stream.of(1).contains(2, { negate: true })).toBe(true);
    expect(
      Stream.of(1, 2, 1, 2, 1, 2).contains(1, { negate: true, amount: 2 })
    ).toBe(true);
    expect(
      Stream.of(1, 2, 1, 2, 1, 2).contains(1, { negate: true, amount: 3 })
    ).toBe(true);
    expect(
      Stream.of(1, 2, 1, 2, 1, 2).contains(2, { negate: true, amount: 4 })
    ).toBe(false);

    sources.forEach((source) => {
      expect(source.contains(50, { negate: true })).toBe(true);
      expect(source.contains(50, { negate: true, amount: 100 })).toBe(false);
      expect(source.contains(-50, { negate: true })).toBe(true);
      expect(source.contains(-50, { negate: true, amount: 100 })).toBe(true);
      expect(source.contains(-50, { negate: true, amount: 101 })).toBe(false);
    });
  });

  it('containsSlice', () => {
    expect(Stream.empty().containsSlice([1, 2, 3])).toBe(false);
    expect(Stream.of(1, 2).containsSlice([1, 2, 3])).toBe(false);
    expect(Stream.of(1, 2, 3).containsSlice([1, 2, 3])).toBe(true);
    expect(Stream.of(9, 8, 1, 2, 3).containsSlice([1, 2, 3])).toBe(true);
    expect(Stream.of(1, 2, 3, 9, 8).containsSlice([1, 2, 3])).toBe(true);
    expect(Stream.of(9, 8, 1, 2, 3, 9, 8).containsSlice([1, 2, 3])).toBe(true);
    expect(Stream.of(9, 8, 1, 2, 3, 9, 8).containsSlice([1, 2, 4])).toBe(false);

    expect(Stream.of(1, 2, 3, 1, 2, 3).containsSlice([2, 3])).toBe(true);
    expect(
      Stream.of(1, 2, 3, 1, 2, 3).containsSlice([2, 3], { amount: 2 })
    ).toBe(true);
    expect(
      Stream.of(1, 2, 3, 1, 2, 3).containsSlice([2, 3], { amount: 3 })
    ).toBe(false);

    sources.forEach((source) => {
      expect(source.containsSlice([50, 40])).toBe(false);
      expect(source.containsSlice([50, 51])).toBe(true);
      expect(source.containsSlice([50, 51], { amount: 2 })).toBe(false);
    });
  });

  it('takeWhile', () => {
    expect(Stream.empty().takeWhile((v) => true)).toBe(Stream.empty());
    expect(Stream.empty().takeWhile((v) => false)).toBe(Stream.empty());
    expect(
      Stream.of(1)
        .takeWhile((v) => true)
        .toArray()
    ).toEqual([1]);
    expect(
      Stream.of(1)
        .takeWhile((v) => false)
        .toArray()
    ).toEqual([]);

    sources.forEach((source) => {
      expect(source.takeWhile((v) => false).toArray()).toEqual([]);
      expect(source.takeWhile((v) => v < 3).toArray()).toEqual([0, 1, 2]);
    });
  });

  it('takeWhile negate', () => {
    expect(Stream.empty().takeWhile((v) => false, { negate: true })).toBe(
      Stream.empty()
    );
    expect(Stream.empty().takeWhile((v) => true, { negate: true })).toBe(
      Stream.empty()
    );
    expect(
      Stream.of(1)
        .takeWhile((v) => false, { negate: true })
        .toArray()
    ).toEqual([1]);
    expect(
      Stream.of(1)
        .takeWhile((v) => true, { negate: true })
        .toArray()
    ).toEqual([]);

    sources.forEach((source) => {
      expect(source.takeWhile((v) => true, { negate: true }).toArray()).toEqual(
        []
      );
      expect(
        source.takeWhile((v) => v >= 3, { negate: true }).toArray()
      ).toEqual([0, 1, 2]);
    });
  });

  it('dropWhile', () => {
    expect(Stream.empty().dropWhile((v) => true)).toBe(Stream.empty());
    expect(Stream.empty().dropWhile((v) => false)).toBe(Stream.empty());
    expect(
      Stream.of(1)
        .dropWhile((v) => true)
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1)
        .dropWhile((v) => false)
        .toArray()
    ).toEqual([1]);

    sources.forEach((source) => {
      expect(source.dropWhile((v) => true).toArray()).toEqual([]);
      expect(source.dropWhile((v) => v < 97).toArray()).toEqual([97, 98, 99]);
      expect(source.dropWhile((v, i) => i < 97).toArray()).toEqual([
        97, 98, 99,
      ]);
    });
  });

  it('dropWhile negate', () => {
    expect(Stream.empty().dropWhile((v) => false, { negate: true })).toBe(
      Stream.empty()
    );
    expect(Stream.empty().dropWhile((v) => true, { negate: true })).toBe(
      Stream.empty()
    );
    expect(
      Stream.of(1)
        .dropWhile((v) => false, { negate: true })
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1)
        .dropWhile((v) => true, { negate: true })
        .toArray()
    ).toEqual([1]);

    sources.forEach((source) => {
      expect(
        source.dropWhile((v) => false, { negate: true }).toArray()
      ).toEqual([]);
      expect(
        source.dropWhile((v) => v >= 97, { negate: true }).toArray()
      ).toEqual([97, 98, 99]);
      expect(
        source.dropWhile((v, i) => i >= 97, { negate: true }).toArray()
      ).toEqual([97, 98, 99]);
    });
  });

  it('take', () => {
    expect(Stream.empty().take(1)).toBe(Stream.empty());
    expect(Stream.of(1).take(0)).toBe(Stream.empty());
    expect(Stream.of(1).take(10).toArray()).toEqual([1]);
    const e = Stream.of(1, 2, 3);
    expect(e.take(10)).toBe(e);
    expect(Stream.of(1, 2, 3).take(2).toArray()).toEqual([1, 2]);

    sources.forEach((source) => {
      expect(source.take(3).toArray()).toEqual([0, 1, 2]);
    });
  });

  it('drop', () => {
    expect(Stream.empty().drop(1)).toBe(Stream.empty());
    expect(Stream.of(1).drop(1)).toBe(Stream.empty());
    expect(Stream.of(1).drop(10)).toBe(Stream.empty());
    expect(Stream.of(1, 2, 3).drop(10)).toBe(Stream.empty());
    expect(Stream.of(1, 2, 3).drop(1).toArray()).toEqual([2, 3]);

    sources.forEach((source) => {
      expect(source.drop(97).toArray()).toEqual([97, 98, 99]);
    });
  });

  it('repeat', () => {
    const nonStandardEmpty = Stream.range({ amount: -1 });
    expect(Stream.empty().repeat(10)).toBe(Stream.empty());
    expect(nonStandardEmpty.repeat(10).first('a')).toBe('a');
    const one = Stream.of(1);
    expect(one.repeat(1)).toBe(one);
    expect(one.repeat(0)).toBe(one);
    expect(one.repeat(3).toArray()).toEqual([1, 1, 1]);
    expect(Stream.of(1, 2, 3).repeat(2).toArray()).toEqual([1, 2, 3, 1, 2, 3]);

    sources.forEach((source) => {
      expect(source.repeat(0)).toBe(source);
      expect(source.repeat(2).toArray()).toEqual(
        source.toArray().concat(source.toArray())
      );
    });
  });

  it('concat', () => {
    const e = Stream.empty<number>();
    const ne = Stream.of(1, 2, 3);
    expect(e.concat(e)).toBe(e);
    expect(e.concat(ne)).toBe(ne);
    expect(ne.concat(e)).toBe(ne);
    isNonEmpty(ne);
    isNonEmpty(e.concat(ne));
    isNonEmpty(ne.concat(e));
    isNonEmpty(ne.concat(ne));
    expect(e.concat(e).toArray()).toEqual([]);
    expect(e.concat(ne).toArray()).toEqual([1, 2, 3]);
    expect(ne.concat(e).toArray()).toEqual([1, 2, 3]);
    expect(ne.concat(ne).toArray()).toEqual([1, 2, 3, 1, 2, 3]);
    expect(ne.concat(ne).concat(ne).toArray()).toEqual([
      1, 2, 3, 1, 2, 3, 1, 2, 3,
    ]);
    expect([...ne.concat(ne).concat(ne)]).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3]);

    sources.forEach((source) => {
      const arr = source.toArray();
      expect(source.concat(source).toArray()).toEqual(arr.concat(arr));
    });
  });

  it('min', () => {
    expect(Stream.empty().min(undefined)).toBe(undefined);
    expect(Stream.of(1).min()).toBe(1);
    expect(Stream.of(1, -10, 5).min()).toBe(-10);

    sources.forEach((source) => {
      expect(source.min(undefined)).toBe(0);
    });
  });

  it('minBy', () => {
    function comp(s1: string, s2: string) {
      return s1.length - s2.length;
    }

    expect(Stream.empty<string>().minBy(comp)).toBe(undefined);
    expect(Stream.empty<string>().minBy(comp, 1)).toBe(1);
    expect(Stream.of('a').minBy(comp)).toBe('a');
    expect(Stream.of('ab', 'c', 'def').minBy(comp)).toBe('c');

    sources.forEach((source) => {
      expect(source.minBy((v1, v2) => v2 - v1)).toBe(99);
    });
  });

  it('max', () => {
    expect(Stream.empty().max(undefined)).toBe(undefined);
    expect(Stream.of(1).max()).toBe(1);
    expect(Stream.of(1, 10, 5).max()).toBe(10);

    sources.forEach((source) => {
      expect(source.max(undefined)).toBe(99);
    });
  });

  it('maxBy', () => {
    function comp(s1: string, s2: string) {
      return s1.length - s2.length;
    }

    expect(Stream.empty<string>().maxBy(comp)).toBe(undefined);
    expect(Stream.empty<string>().maxBy(comp, 1)).toBe(1);
    expect(Stream.of('a').maxBy(comp)).toBe('a');
    expect(Stream.of('ab', 'c', 'def').maxBy(comp)).toBe('def');

    sources.forEach((source) => {
      expect(source.minBy((v1, v2) => v2 - v1)).toBe(99);
    });
  });

  it('intersperse', () => {
    expect(Stream.empty().intersperse([1])).toBe(Stream.empty());
    expect(Stream.of(1).intersperse([0]).toArray()).toEqual([1]);
    expect(Stream.of(1, 2, 3).intersperse([0]).toArray()).toEqual([
      1, 0, 2, 0, 3,
    ]);
    expect(Stream.of(1, 2, 3).intersperse([0, 10]).toArray()).toEqual([
      1, 0, 10, 2, 0, 10, 3,
    ]);
    expect(Stream.of(1, 2, 3).intersperse([]).toArray()).toEqual([1, 2, 3]);
  });

  it('join', () => {
    expect(Stream.empty().join()).toBe('');
    expect(Stream.empty().join({ start: '<', end: '>' })).toBe('<>');
    expect(Stream.empty().join({ start: '<', end: '>', ifEmpty: 'abc' })).toBe(
      'abc'
    );
    expect(Stream.empty().join({ start: '<', end: '>', sep: '-' })).toBe('<>');
    expect(Stream.of(1).join({ start: '<', end: '>', sep: '-' })).toBe('<1>');
    expect(Stream.of(1, 2, 3).join({ start: '<', end: '>', sep: '-' })).toBe(
      '<1-2-3>'
    );
    expect(Stream.of(1, 2, 3).join()).toBe('123');
    expect(Stream.of(1, 2, 3).join({ ifEmpty: 'abc' })).toBe('123');

    expect(artificialEmpty.join()).toBe('');
    expect(artificialEmpty.join({ start: '<', end: '>' })).toBe('<>');
    expect(artificialEmpty.join({ start: '<', end: '>', ifEmpty: 'abc' })).toBe(
      'abc'
    );
    expect(artificialEmpty.join({ start: '<', end: '>', sep: '-' })).toBe('<>');

    sources.forEach((source) => {
      expect(source.take(5).join({ start: '(', sep: ',', end: ')' })).toEqual(
        '(0,1,2,3,4)'
      );
    });
  });

  it('mkGroup', () => {
    expect(
      Stream.empty()
        .mkGroup({ start: [-1], end: [-2], sep: [-3] })
        .toArray()
    ).toEqual([-1, -2]);
    expect(Stream.of(1).mkGroup({}).toArray()).toEqual([1]);
    expect(
      Stream.of(1)
        .mkGroup({ start: [-1], end: [-2], sep: [-3] })
        .toArray()
    ).toEqual([-1, 1, -2]);
    expect(
      Stream.of(1, 2, 3)
        .mkGroup({ start: [-1], end: [-2], sep: [-3] })
        .toArray()
    ).toEqual([-1, 1, -3, 2, -3, 3, -2]);
  });

  it('splitWhere', () => {
    function isEven(v: number) {
      return v % 2 === 0;
    }

    expect(Stream.empty<number>().splitWhere(isEven).toArray()).toEqual([]);

    expect(Stream.of(1, 3, 5).splitWhere(isEven).toArray()).toEqual([
      [1, 3, 5],
    ]);

    expect(Stream.of(1, 2, 5).splitWhere(isEven).toArray()).toEqual([[1], [5]]);

    expect(Stream.of(2, 2, 5).splitWhere(isEven).toArray()).toEqual([
      [],
      [],
      [5],
    ]);

    expect(Stream.of(2, 5, 2).splitWhere(isEven).toArray()).toEqual([[], [5]]);

    expect(Stream.of(2, 2, 2).splitWhere(isEven).toArray()).toEqual([
      [],
      [],
      [],
    ]);
  });

  it('splitWhere negate', () => {
    function isOdd(v: number) {
      return v % 2 === 1;
    }

    expect(
      Stream.empty<number>().splitWhere(isOdd, { negate: true }).toArray()
    ).toEqual([]);

    expect(
      Stream.of(1, 3, 5).splitWhere(isOdd, { negate: true }).toArray()
    ).toEqual([[1, 3, 5]]);

    expect(
      Stream.of(1, 2, 5).splitWhere(isOdd, { negate: true }).toArray()
    ).toEqual([[1], [5]]);

    expect(
      Stream.of(2, 2, 5).splitWhere(isOdd, { negate: true }).toArray()
    ).toEqual([[], [], [5]]);

    expect(
      Stream.of(2, 5, 2).splitWhere(isOdd, { negate: true }).toArray()
    ).toEqual([[], [5]]);

    expect(
      Stream.of(2, 2, 2).splitWhere(isOdd, { negate: true }).toArray()
    ).toEqual([[], [], []]);
  });

  it('splitOn', () => {
    expect(Stream.empty<number>().splitOn(2).toArray()).toEqual([]);

    expect(Stream.of(1, 3, 5).splitOn(2).toArray()).toEqual([[1, 3, 5]]);

    expect(Stream.of(1, 2, 5).splitOn(2).toArray()).toEqual([[1], [5]]);

    expect(Stream.of(2, 2, 5).splitOn(2).toArray()).toEqual([[], [], [5]]);

    expect(Stream.of(2, 5, 2).splitOn(2).toArray()).toEqual([[], [5]]);

    expect(Stream.of(2, 2, 2).splitOn(2).toArray()).toEqual([[], [], []]);
  });

  it('splitOn negate', () => {
    expect(
      Stream.empty<number>().splitOn(2, { negate: true }).toArray()
    ).toEqual([]);

    expect(Stream.of(1, 3, 5).splitOn(2, { negate: true }).toArray()).toEqual([
      [],
      [],
      [],
    ]);

    expect(Stream.of(1, 2, 5).splitOn(2, { negate: true }).toArray()).toEqual([
      [],
      [2],
    ]);

    expect(Stream.of(2, 2, 5).splitOn(2, { negate: true }).toArray()).toEqual([
      [2, 2],
    ]);

    expect(Stream.of(2, 5, 2).splitOn(2, { negate: true }).toArray()).toEqual([
      [2],
      [2],
    ]);

    expect(Stream.of(2, 2, 2).splitOn(2, { negate: true }).toArray()).toEqual([
      [2, 2, 2],
    ]);
  });

  it('splitOnSlice', () => {
    expect(Stream.empty<number>().splitOnSlice([1, 2, 3]).toArray()).toEqual(
      []
    );
    expect(Stream.of(1, 2).splitOnSlice([10]).toArray()).toEqual([[1, 2]]);
    expect(Stream.of(1, 2).splitOnSlice([1, 2, 3]).toArray()).toEqual([[1, 2]]);
    expect(Stream.of(1, 2, 3).splitOnSlice([1, 2, 3]).toArray()).toEqual([[]]);
    expect(Stream.of(2, 1, 2, 3).splitOnSlice([1, 2, 3]).toArray()).toEqual([
      [2],
    ]);
    expect(Stream.of(1, 1, 2, 3).splitOnSlice([1, 2, 3]).toArray()).toEqual([
      [1],
    ]);
    expect(Stream.of(1, 1, 2, 3, 3).splitOnSlice([1, 2, 3]).toArray()).toEqual([
      [1],
      [3],
    ]);
    expect(
      Stream.of(1, 1, 2, 3, 1, 2, 1, 2, 3, 1).splitOnSlice([1, 2, 3]).toArray()
    ).toEqual([[1], [1, 2], [1]]);
    expect(
      Stream.of(1, 1, 2, 3, 1, 2, 3, 1, 2, 1, 2, 3, 1)
        .splitOnSlice([1, 2, 3])
        .toArray()
    ).toEqual([[1], [], [1, 2], [1]]);
  });

  it('fold', () => {
    function sum(
      current: number,
      value: number,
      index: number,
      halt: () => void
    ) {
      if (value > 10) {
        halt();
        return current;
      }
      return current + value;
    }
    expect(Stream.empty<number>().fold(0, sum)).toBe(0);
    expect(Stream.of(1, 2, 3).fold(0, sum)).toBe(6);
    expect(Stream.of(1, 20, 3).fold(0, sum)).toBe(1);
  });

  it('foldStream', () => {
    function sum(
      current: number,
      value: number,
      index: number,
      halt: () => void
    ) {
      if (value > 10) {
        halt();
        return current;
      }
      return current + value;
    }
    expect(Stream.empty<number>().foldStream(0, sum).toArray()).toEqual([]);
    expect(Stream.of(1, 2, 3).foldStream(0, sum).toArray()).toEqual([1, 3, 6]);
    expect(Stream.of(1, 20, 3).foldStream(0, sum).toArray()).toEqual([1, 1]);
  });

  it('reduce', () => {
    expect(Stream.empty<number>().reduce(Reducer.sum)).toBe(0);
    expect(Stream.of(1, 2, 3).reduce(Reducer.sum)).toBe(6);
  });

  it('reduceStream', () => {
    expect(Stream.empty<number>().reduceStream(Reducer.sum).toArray()).toEqual(
      []
    );
    expect(Stream.of(1, 2, 3).reduceStream(Reducer.sum).toArray()).toEqual([
      1, 3, 6,
    ]);
  });

  it('reduce multi array', () => {
    expect(Stream.empty<number>().reduce([Reducer.sum, Reducer.count])).toEqual(
      [0, 0]
    );
    expect(Stream.of(1, 2, 3).reduce([Reducer.sum, Reducer.count])).toEqual([
      6, 3,
    ]);

    expect(
      Stream.range({ start: 0 }).reduce([
        Reducer.first<number>(),
        Reducer.first<number>(),
      ])
    ).toEqual([0, 0]);
  });

  it('reduceStream multi array', () => {
    expect(
      Stream.empty<number>()
        .reduceStream([Reducer.sum, Reducer.count])
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1, 2, 3).reduceStream([Reducer.sum, Reducer.count]).toArray()
    ).toEqual([
      [1, 1],
      [3, 2],
      [6, 3],
    ]);
  });

  it('toArray', () => {
    expect(Stream.empty().toArray()).toEqual([]);
    expect(Stream.of(1).toArray()).toEqual([1]);
    expect(Stream.from([1, 2, 3]).toArray()).toEqual([1, 2, 3]);
    const a1 = streamRange1.toArray();

    sources.forEach((source) => {
      expect(source.toArray()).toEqual(a1);
    });
  });

  it('toString', () => {
    expect(Stream.empty<string>().toString()).toBe('Stream(<empty>)');
    expect(Stream.of(1).toString()).toBe('Stream(...<potentially empty>)');
  });

  it('zipWith', () => {
    expect(
      Stream.zipWith(Stream.empty<number>(), [])((a, b) => a + b).toArray()
    ).toEqual([]);
    expect(
      Stream.zipWith(Stream.of(1, 2, 3), [])((a, b) => a + b).toArray()
    ).toEqual([]);
    expect(
      Stream.zipWith(
        Stream.empty<number>(),
        [1, 2, 3]
      )((a, b) => a + b).toArray()
    ).toEqual([]);
    expect(
      Stream.zipWith(Stream.of(1, 2, 3), [1, 2, 3])((a, b) => a + b).toArray()
    ).toEqual([2, 4, 6]);
    expect(
      Stream.zipWith(Stream.of(1), [1, 2, 3])((a, b) => a + b).toArray()
    ).toEqual([2]);
    expect(
      Stream.zipWith(Stream.of(1, 2, 3), [1])((a, b) => a + b).toArray()
    ).toEqual([2]);
  });

  it('zip', () => {
    expect(Stream.zip(Stream.empty(), Stream.empty())).toBe(Stream.empty());
    expect(Stream.zip(Stream.empty(), Stream.of(1))).toBe(Stream.empty());
    expect(Stream.zip(Stream.of(1), Stream.empty())).toBe(Stream.empty());
    expect(Stream.zip(Stream.of(1), Stream.of(2)).toArray()).toEqual([[1, 2]]);
    expect(Stream.zip(Stream.of(1, 2, 3), Stream.of(2)).toArray()).toEqual([
      [1, 2],
    ]);
    expect(Stream.zip(Stream.of(1), Stream.of(2, 3, 4)).toArray()).toEqual([
      [1, 2],
    ]);
    expect(
      Stream.zip(
        Stream.of(1, 2, 3, 4, 5),
        Stream.of(2, 3, 4),
        Stream.of(3, 4, 5, 6)
      ).toArray()
    ).toEqual([
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
    ]);
    sources.forEach((source) => {
      expect(Stream.zip(source, source).toArray()).toEqual(
        source.map((v) => [v, v]).toArray()
      );
    });
    const ne = Stream.of(1);
    isNonEmpty(Stream.zip(ne, ne));
    isNonEmpty(Stream.zip(ne, ne, ne, ne));
  });

  it('zipAllWith', () => {
    expect(
      Stream.zipAllWith(Stream.empty<number>(), [])(
        10,
        (a, b) => a + b
      ).toArray()
    ).toEqual([]);
    expect(
      Stream.zipAllWith(Stream.of(1, 2, 3), [])(10, (a, b) => a + b).toArray()
    ).toEqual([11, 12, 13]);
    expect(
      Stream.zipAllWith(Stream.empty<number>(), [1, 2, 3])(
        10,
        (a, b) => a + b
      ).toArray()
    ).toEqual([11, 12, 13]);
    expect(
      Stream.zipAllWith(Stream.of(1, 2, 3), [1, 2, 3])(
        10,
        (a, b) => a + b
      ).toArray()
    ).toEqual([2, 4, 6]);
    expect(
      Stream.zipAllWith(Stream.of(1), [1, 2, 3])(10, (a, b) => a + b).toArray()
    ).toEqual([2, 12, 13]);
    expect(
      Stream.zipAllWith(Stream.of(1, 2, 3), [1])(10, (a, b) => a + b).toArray()
    ).toEqual([2, 12, 13]);
  });

  it('zipAll', () => {
    expect(
      Stream.zipAll(undefined, Stream.empty(), Stream.empty()).toArray()
    ).toEqual([]);
    expect(
      Stream.zipAll(undefined, Stream.of(1), Stream.empty()).toArray()
    ).toEqual([[1, undefined]]);
    expect(
      Stream.zipAll(undefined, Stream.empty(), Stream.of(1)).toArray()
    ).toEqual([[undefined, 1]]);
    expect(
      Stream.zipAll(undefined, Stream.of(1), Stream.of(2)).toArray()
    ).toEqual([[1, 2]]);
    expect(
      Stream.zipAll(undefined, Stream.of(1, 2, 3), Stream.of(10, 11)).toArray()
    ).toEqual([
      [1, 10],
      [2, 11],
      [3, undefined],
    ]);
  });

  it('unzip', () => {
    const [u1l, u1r] = Stream.unzip(Stream.empty<[number, string]>(), {
      length: 2,
    });
    expect(u1l.toArray()).toEqual([]);
    expect(u1r.toArray()).toEqual([]);

    const [u2l, u2r] = Stream.unzip(
      Stream.of<[number, string]>([1, 'a'], [2, 'b']),
      { length: 2 }
    );
    expect(u2l.toArray()).toEqual([1, 2]);
    expect(u2r.toArray()).toEqual(['a', 'b']);
  });

  it('distinctPrevious', () => {
    expect(Stream.empty<number>().distinctPrevious().toArray()).toEqual([]);
    expect(Stream.of(1, 2, 3).distinctPrevious().toArray()).toEqual([1, 2, 3]);
    expect(Stream.of(1, 2, 2, 3).distinctPrevious().toArray()).toEqual([
      1, 2, 3,
    ]);
    expect(Stream.of(1, 2, 2, 3, 1, 1, 3).distinctPrevious().toArray()).toEqual(
      [1, 2, 3, 1, 3]
    );
  });

  it('window', () => {
    expect(Stream.empty<number>().window(3).toArray()).toEqual([]);
    expect(Stream.of(1, 2).window(3).toArray()).toEqual([]);
    expect(Stream.of(1, 2, 3).window(3).toArray()).toEqual([[1, 2, 3]]);
    expect(Stream.of(1, 2, 3, 4, 5).window(3).toArray()).toEqual([[1, 2, 3]]);
    expect(Stream.of(1, 2, 3, 4, 5, 6).window(3).toArray()).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    expect(
      Stream.of(1, 2, 3, 4, 5, 6).window(3, { skipAmount: 1 }).toArray()
    ).toEqual([
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
      [4, 5, 6],
    ]);
    expect(
      Stream.of(1, 2, 3, 4, 5, 6).window(2, { skipAmount: 3 }).toArray()
    ).toEqual([
      [1, 2],
      [4, 5],
    ]);
  });

  it('window collector', () => {
    expect(
      Stream.empty<number>()
        .window(3, { collector: Reducer.toJSSet() })
        .toArray()
    ).toEqual([]);
    expect(
      Stream.of(1, 2).window(3, { collector: Reducer.toJSSet() }).toArray()
    ).toEqual([]);
    expect(
      Stream.of(1, 2, 3).window(3, { collector: Reducer.toJSSet() }).toArray()
    ).toEqual([new Set([1, 2, 3])]);
    expect(
      Stream.of(1, 2, 3, 4, 5)
        .window(3, { collector: Reducer.toJSSet() })
        .toArray()
    ).toEqual([new Set([1, 2, 3])]);
    expect(
      Stream.of(1, 2, 3, 4, 5, 6)
        .window(3, { collector: Reducer.toJSSet() })
        .toArray()
    ).toEqual([new Set([1, 2, 3]), new Set([4, 5, 6])]);
    expect(
      Stream.of(1, 2, 3, 4, 5, 6)
        .window(3, { skipAmount: 1, collector: Reducer.toJSSet() })
        .toArray()
    ).toEqual([
      new Set([1, 2, 3]),
      new Set([2, 3, 4]),
      new Set([3, 4, 5]),
      new Set([4, 5, 6]),
    ]);
  });

  it('partition', () => {
    const isEven = (v: number) => v % 2 === 0;

    expect(Stream.empty<number>().partition(isEven)).toEqual([[], []]);
    expect(Stream.of(1).partition(isEven)).toEqual([[], [1]]);
    expect(Stream.of(0).partition(isEven)).toEqual([[0], []]);
    expect(Stream.of(1, 2, 3).partition(isEven)).toEqual([[2], [1, 3]]);
  });

  it('partition collector', () => {
    const isEven = (v: number) => v % 2 === 0;

    expect(
      Stream.empty<number>().partition(isEven, {
        collectorTrue: Reducer.join<number>({ sep: ',' }),
        collectorFalse: Reducer.join<number>({ sep: ',' }),
      })
    ).toEqual(['', '']);
    expect(
      Stream.of(1).partition(isEven, {
        collectorTrue: Reducer.join<number>({ sep: ',' }),
        collectorFalse: Reducer.join<number>({ sep: ',' }),
      })
    ).toEqual(['', '1']);
    expect(
      Stream.of(0).partition(isEven, {
        collectorTrue: Reducer.join<number>({ sep: ',' }),
        collectorFalse: Reducer.join<number>({ sep: ',' }),
      })
    ).toEqual(['0', '']);
    expect(
      Stream.of(1, 2, 3).partition(isEven, {
        collectorTrue: Reducer.join<number>({ sep: ',' }),
        collectorFalse: Reducer.join<number>({ sep: ',' }),
      })
    ).toEqual(['2', '1,3']);

    sources.forEach((source) => {
      const [left, right] = source.partition((v) => v % 2 === 0);
      expect(left.length).toBe(50);
      expect(right.length).toBe(50);
    });
  });

  it('groupBy', () => {
    expect(Stream.empty<string>().groupBy((v) => v.length)).toEqual(new Map());
    expect(Stream.of('a').groupBy((v) => v.length)).toEqual(
      new Map([[1, ['a']]])
    );
    expect(
      Stream.of('abc', 'a', 'def', 'b', 'qq').groupBy((v) => v.length)
    ).toEqual(
      new Map([
        [1, ['a', 'b']],
        [2, ['qq']],
        [3, ['abc', 'def']],
      ])
    );

    sources.forEach((source) => {
      const result = source.groupBy((v) => v % 4);
      for (let i = 0; i < 4; i++) {
        expect(result.get(i)?.length).toBe(25);
      }
    });
  });

  it('groupBy collector', () => {
    const collector = Reducer.toJSMultiMap<number, string>().mapInput<
      [number, string]
    >(([key, value]) => [key * 2, value]);

    expect(
      Stream.empty<string>().groupBy((v) => v.length, {
        collector,
      })
    ).toEqual(new Map());
    expect(Stream.of('a').groupBy((v) => v.length, { collector })).toEqual(
      new Map([[2, ['a']]])
    );
    expect(
      Stream.of('abc', 'a', 'def', 'b', 'qq').groupBy((v) => v.length, {
        collector,
      })
    ).toEqual(
      new Map([
        [2, ['a', 'b']],
        [4, ['qq']],
        [6, ['abc', 'def']],
      ])
    );
  });
});
