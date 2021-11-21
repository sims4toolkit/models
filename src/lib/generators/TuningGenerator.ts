import type Record from '../models/Record';
import type Tuning from '../models/resources/Tuning';
import type StringTable from '../models/resources/StringTable';
import type { TuningFile } from '../models/tunables/TunableNodes';
import { I, M, L, U, V, E, T } from '../models/tunables/TunableNodes';
import { fnv32 } from '../services/Hashing';



export function generate<T>({ data, converter, template, stbl }: {
  data: T[];
  converter: (value: T) => GeneratorEntry;
  template: (entry: GeneratorEntry, stbl?: StringTable) => TuningFile;
  stbl?: StringTable;
}): Record<Tuning>[] {
  
}

interface GeneratorEntry {
  name?: string;

  key?: {
    type?: string | number;
    group?: string | number;
    instance?: string | number | bigint;
  };
}


generate<string>({
  data: [
    'First',
    'Second',
    'Third'
  ],
  converter(value: string): GeneratorEntry {
    return undefined; // TODO: impl
  },
  template(entry: GeneratorEntry, stbl: StringTableResource): TuningFile {
    const name = `frankk_TEST:trait_${entry.name}`;

    return I({
      c: "Trait",
      i: "trait",
      m: "traits.trait",
      n: name,
      s: fnv32(name),
      children: [

      ]
    });
  }
});