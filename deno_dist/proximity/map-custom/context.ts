import { RMapBase } from '../../collection-types/map-custom/index.ts';
import type { HashMap } from '../../hashed/map/index.ts';
import type { DistanceFunction } from '../common/index.ts';
import type { ProximityMap } from '../map/index.ts';
import { ProximityMapEmpty, ProximityMapNonEmpty } from './implementation/index.ts';
import { ProximityMapBuilder } from './builder.ts';

export class ProximityMapContext<UK>
  extends RMapBase.ContextBase<UK, ProximityMap.Types>
  implements ProximityMap.Context<UK>
{
  readonly _empty: ProximityMap<any, any>;

  constructor(
    readonly distanceFunction: DistanceFunction<UK>,
    readonly hashMapContext: HashMap.Context<UK>
  ) {
    super();

    this._empty = Object.freeze(new ProximityMapEmpty<any, any>(this));
  }

  readonly typeTag = 'ProximityMap';

  isValidKey(key: any): key is UK {
    return true;
  }

  isNonEmptyInstance(source: any): source is any {
    return source instanceof ProximityMapNonEmpty;
  }

  readonly builder = <K extends UK, V>(): ProximityMap.Builder<K, V> => {
    return this.createBuilder();
  };

  createBuilder<K extends UK, V>(
    source?: ProximityMap.NonEmpty<K, V>
  ): ProximityMap.Builder<K, V> {
    return new ProximityMapBuilder<K, V>(this as any, source);
  }
}
