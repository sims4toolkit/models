import type { TuningFileNode } from '../models/tunables/TunableNodes';
import Tuning from '../models/resources/tuning';
import StringTable from '../models/resources/stringtable';
import Record, { ResourceKey } from '../models/keyResourcePair';
import { I, M, L, U, V, E, T, getStringFn } from '../models/tunables/TunableNodes';
import { fnv32, fnv64 } from '../utils/hashing';
import DBPF from '../models/dbpf';
import fs from 'fs';


function getResourceKey(entry: GeneratorEntry, node: TuningFileNode): ResourceKey {
  return undefined;
}


export function generate<DataType>({ data, converter, template, stbl }: {
  data: DataType[];
  converter: (value: DataType) => GeneratorEntry;
  template: (entry: GeneratorEntry, stbl?: StringTable) => TuningFileNode;
  stbl?: StringTable;
}): Record<Tuning>[] {
  return data.map(converter).map(entry => {
    const node = template(entry, stbl);
    const resource = Tuning.fromNode(node);
    return new Record<Tuning>(getResourceKey(entry, node), resource);
  });
}

interface GeneratorEntry {
  /** The filename. */
  name: string;

  /** The type ID. If left out, the type will be determined automatically. */
  type?: number;

  /** The group ID. If left out, the type will be 0x00000000. */
  group?: number;

  /** The instance ID. */
  instance: number | bigint;

  /** An object containing any additional arguments you may need. */
  args?: { [key: string]: any; };
}

const stbl = StringTable.create();

const traits = generate<string>({
  stbl,
  data: [
    'First',
    'Second',
    'Third'
  ],
  converter(value: string): GeneratorEntry {
    const name = `frankk_TEST:trait_${value}`;
    return { name, instance: fnv32(name), args: { text: value } };
  },
  template(entry: GeneratorEntry, stbl: StringTable): TuningFileNode {
    const S = getStringFn(stbl);

    return I({
      c: "Trait",
      i: "trait",
      m: "traits.trait",
      n: entry.name,
      s: entry.instance,
      children: [
        L({
          name: "ages",
          children: [
            E({ value: "YOUNGADULT" }),
            E({ value: "ADULT" }),
            E({ value: "ELDER" })
          ]
        }),
        T({
          name: "display_name",
          value: S(`${entry.args.text} Trait`)
        }),
        T({
          name: "trait_description",
          value: S(`This is a trait about ${entry.args.text}.`) 
        }),
        // etc...
      ]
    });
  }
});
