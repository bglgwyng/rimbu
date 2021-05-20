import { Update } from '../src';

describe('Update', () => {
  it('updates', () => {
    expect(Update(5, 6)).toBe(6);
    expect(Update(5, () => 6)).toBe(6);
  });
});
