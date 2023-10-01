import fs from "fs";
import glob from "glob";
import path from "path";
import { Package, SimDataResource } from "../dst/models";
import { BinaryResourceType, SimDataGroup, TuningResourceType } from "../dst/enums";
import { ResourceKeyPair } from "../dst/lib/packages/types";
import { formatAsHexString } from "@s4tk/hashing/formatting"

const directories = [
  '/Applications/The Sims 4 Packs',
  '/Applications/The Sims 4.app',
  'C:/Program Files/EA Games/The Sims 4',
];

const groupsToIgnore = new Set([
  0x00496642, // client stuff
  0x00ABFFCF, // client stuff
  0x0003C397, // BuildBuy stuff
  0x006CA304, // Modules
  0x0094E9AE, // NativeBuildBuy
  0x003A5A65, // Native_SeasonsWeather
  0x004B5265, // client stuff
  0x00D16262, // Automation,
  0x00057D11, // client stuff
  0x0057C8BA, // RegionSortTuning (client thing)
]);

function findPackagePaths(): Promise<string[]> {
  return new Promise(resolve => {
    const packagePaths: string[] = [];

    directories.forEach(directory => {
      const files = glob.sync(directory + '/**/*.package');
      packagePaths.push(...files.filter((p) => !path.basename(p).startsWith("Strings_")));
    });

    resolve(packagePaths);
  });
}

console.log("Finding packages...");
findPackagePaths().then(packagePaths => {
  console.log(`${packagePaths.length} packages found.`);

  const allFiles: ResourceKeyPair[] = [];

  console.log("Reading packages...");
  packagePaths.forEach((path, i) => {
    const buffer = fs.readFileSync(path);

    const entries = Package.extractResources(buffer, {
      resourceFilter(type, group, inst) {
        if (type !== BinaryResourceType.SimData) return false;
        if (groupsToIgnore.has(group)) return false;
        if (group in SimDataGroup) return false;
        return true;
      }
    });

    allFiles.push(...entries);
    console.log(`(${i + 1}/${packagePaths.length}) Read ${path}`);
  });

  const matched = new Set();
  const matches: { group: string; name: string; }[] = [];
  const nonMatches: { [key: string]: Set<string> } = {};
  allFiles.forEach((entry) => {
    const group = entry.key.group;
    if (matched.has(group)) return;
    // FIXME: there must be a bug... there should always be a schema, but for
    // some reason it's undefined sometimes
    let name = (entry.value as SimDataResource).schema?.name;
    if (name) name = name.replace("CAS", "Cas");
    if (name in TuningResourceType) {
      matched.add(group);
      matches.push({
        group: formatAsHexString(group, 8, true),
        name
      });
    } else {
      if (name?.includes('.')) return; // skip modules
      if (name?.startsWith('Client_')) return; // skip client modules
      const groupSet = nonMatches[formatAsHexString(group, 8, true)] ??= new Set();
      groupSet.add(name);
    }
  });

  console.log("===== MATCHES =====");
  matches.forEach(({ group, name }) => {
    console.log(`${name} = ${group},`);
  });

  console.log("===== NON-MATCHES =====");
  for (const group in nonMatches) {
    console.log(group);
    nonMatches[group].forEach(name => {
      console.log(` | ${name}`);
    });
  }
});
