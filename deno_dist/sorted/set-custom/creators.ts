import type { RSetBase } from '../../collection-types/set-custom/index.ts';
import type { Comp } from '../../common/mod.ts';
import type { SortedSet } from '../../sorted/set/index.ts';

export interface SortedSetCreators extends RSetBase.Factory<SortedSet.Types> {
  /**
   * Returns a new SortedSet context instance based on the given `options`.
   * @typeparam UT - the upper element type for which the context can create instances
   * @param options - (optional) an object containing the following properties:<br/>
   * - comp - (optional) the comparator instance for elements<br/>
   * - blockSizeBits - (default: 5) the power of 2 to to `blockSizeBits` to use as block size for all instances that are created from the context.
   */
  createContext<UT>(options?: {
    comp?: Comp<UT>;
    blockSizeBits?: number;
  }): SortedSet.Context<UT>;
  /**
   * Returns the default context for SortedSets.
   * @typeparam UT - the upper element type for which the context can create instances
   */
  defaultContext<UT>(): SortedSet.Context<UT>;
}
