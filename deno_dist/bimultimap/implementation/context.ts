import type { CustomBase as CB } from '../../collection-types/mod.ts';
import type { ArrayNonEmpty } from '../../common/mod.ts';
import { Reducer } from '../../common/mod.ts';
import { StreamSource } from '../../stream/mod.ts';
import {
  BiMultiMapBase,
  BiMultiMapBuilder,
  BiMultiMapEmpty,
  BiMultiMapNonEmpty,
} from '../bimultimap-custom.ts';

export interface ContextTypesImpl extends BiMultiMapBase.Types {
  context: BiMultiMapContext<this['_K'], this['_V'], string>;
}

export class BiMultiMapContext<
  UK,
  UV,
  N extends string,
  Tp extends ContextTypesImpl = ContextTypesImpl
> implements BiMultiMapBase.Context<UK, UV, Tp>
{
  constructor(
    readonly typeTag: N,
    readonly keyValueMultiMapContext: CB.WithKeyValue<
      Tp,
      UK,
      UV
    >['keyValueMultiMapContext'],
    readonly valueKeyMultiMapContext: CB.WithKeyValue<
      Tp,
      UK,
      UV
    >['valueKeyMultiMapContext']
  ) {}

  get _types(): Tp {
    return undefined as any;
  }

  readonly _empty = new BiMultiMapEmpty<UK, UV, Tp>(this) as CB.WithKeyValue<
    Tp,
    UK,
    UV
  >['normal'];

  empty = <K extends UK, V extends UV>(): CB.WithKeyValue<
    Tp,
    K,
    V
  >['normal'] => {
    return this._empty;
  };

  of: any = <K extends UK, V extends UV>(
    ...entries: ArrayNonEmpty<readonly [K, V]>
  ): [K, V] extends [UK, UV]
    ? CB.WithKeyValue<Tp, K, V>['nonEmpty']
    : never => {
    return this.from(entries);
  };

  from = <K extends UK, V extends UV>(
    ...sources: ArrayNonEmpty<StreamSource<readonly [K, V]>>
  ): [K, V] extends [UK, UV]
    ? CB.WithKeyValue<Tp, K, V>['normal'] | any
    : never => {
    if (sources.length === 1) {
      const source = sources[0];
      if (source instanceof BiMultiMapNonEmpty && source.context === this)
        return source as any;
    }

    let builder = this.builder<K, V>();

    let i = -1;
    const length = sources.length;

    while (++i < length) {
      const source = sources[i];

      if (StreamSource.isEmptyInstance(source)) continue;
      if (
        builder.isEmpty &&
        source instanceof BiMultiMapNonEmpty &&
        source.context === this
      ) {
        if (i === length - 1) return source as any;
        builder = source.toBuilder();
        continue;
      }

      builder.addEntries(source);
    }

    return builder.build() as any;
  };

  builder = <K extends UK, V extends UV>(): CB.WithKeyValue<
    Tp,
    K,
    V
  >['builder'] => {
    return new BiMultiMapBuilder<K, V, Tp>(this) as CB.WithKeyValue<
      Tp,
      K,
      V
    >['builder'];
  };

  reducer = <K extends UK, V extends UV>(
    source?: StreamSource<readonly [K, V]>
  ): Reducer<[K, V], CB.WithKeyValue<Tp, K, V>['normal']> => {
    return Reducer.create(
      () =>
        undefined === source
          ? this.builder<K, V>()
          : (
              this.from(source) as CB.WithKeyValue<Tp, K, V>['normal']
            ).toBuilder(),
      (builder, entry) => {
        builder.add(entry[0], entry[1]);
        return builder;
      },
      (builder) => builder.build()
    );
  };

  createBuilder<K extends UK, V extends UV>(
    source?: CB.WithKeyValue<Tp, K, V>['nonEmpty']
  ): CB.WithKeyValue<Tp, K, V>['builder'] {
    return new BiMultiMapBuilder<K, V, Tp>(this, source) as CB.WithKeyValue<
      Tp,
      K,
      V
    >['builder'];
  }

  createNonEmpty<K, V>(
    keyValueMultiMap: CB.WithKeyValue<Tp, K, V>['keyValueMultiMapNonEmpty'],
    valueKeyMultiMap: CB.WithKeyValue<Tp, K, V>['valueKeyMultiMapNonEmpty']
  ): CB.WithKeyValue<Tp, K, V>['nonEmpty'] {
    return new BiMultiMapNonEmpty<K, V, Tp>(
      this,
      keyValueMultiMap,
      valueKeyMultiMap
    ) as CB.WithKeyValue<Tp, K, V>['nonEmpty'];
  }
}
