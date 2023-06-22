import { HashMap } from '@rimbu/hashed';
import { runMapRandomTestsWith } from '../../collection-types/test-utils/map/map-random';
import { ProximityMap } from '../src/map';

runMapRandomTestsWith('ProximityMap default', ProximityMap.defaultContext());

runMapRandomTestsWith(
  'ProximityMap blocksize 2',
  ProximityMap.createContext({
    hashMapContext: HashMap.createContext({ blockSizeBits: 2 }),
  })
);

runMapRandomTestsWith(
  'ProximityMap blocksize 3',
  ProximityMap.createContext({
    hashMapContext: HashMap.createContext({ blockSizeBits: 3 }),
  })
);
