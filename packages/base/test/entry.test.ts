import { Entry } from '../src';

describe('Entry', () => {
  it('first', () => {
    expect(Entry.first([1, 'a'])).toBe(1);
  });

  it('second', () => {
    expect(Entry.second([1, 'a'])).toBe('a');
  });
});
