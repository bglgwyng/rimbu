import { runMapTestsWith } from '../../collection-types/test-utils/map/map-standard.mjs';

import { SortedMap } from '../src/main/index.mjs';

runMapTestsWith(
  'SortedMap blockSize 2',
  SortedMap.createContext({ blockSizeBits: 2 })
);
