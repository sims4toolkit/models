import type StringTableResource from "../stringTable/stringTableResource";
import type { TuningNode } from "../../dom/nodes";
import { formatStringKey } from "../../../utils/formatting";
import { TuningElementNode, TuningCommentNode, TuningValueNode } from "../../dom/nodes";

//#region Types

/** Attribute keys that are valid in tuning. */
type TuningAttributeKey = 'n' | 'c' | 't' | 'm' | 'i' | 'ev' | 'p' | 's';

/** Interface that only supports attributes that should be in tuning. */
type TuningAttributes = { [key in TuningAttributeKey]?: any; };

//#endregion Types

//#region Functions

/**
 * Creates and returns an instance tunable (I tag).
 * 
 * Arguments
 * - `c`: Value to appear in the class attribute
 * - `i`: Value to appear in the instance type attribute
 * - `m`: Value to appear in the module path attribute
 * - `n`: Value to appear in the filename attribute
 * - `s`: Value to appear in the tuning ID attribute
 * - `children`: List of nodes that this one contains
 * 
 * @param args Object containing the arguments
 */
 export function I({ c, i, m, n, s, children = [] }: {
  c: string;
  i: string;
  m: string;
  n: string;
  s: string | number | bigint;
  children?: TuningNode[];
}): TuningElementNode {
  return new TuningElementNode({
    tag: 'I',
    attributes: { c, i, m, n, s },
    children
  });
}

/**
 * Creates and returns a module tunable (M tag).
 * 
 * Arguments
 * - `n`: Value to appear in the filename attribute
 * - `s`: Value to appear in the tuning ID attribute
 * - `children`: List of nodes that this one contains
 * 
 * @param args Object containing the arguments
 */
export function M({ n, s, children = [] }: {
  n: string;
  s: string | number | bigint;
  children?: TuningNode[];
}): TuningElementNode {
  return new TuningElementNode({ tag: 'M', attributes: { n, s }, children });
}

/**
 * Creates and returns a tunable (T tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `ev`: The enum value of this node (only for use within `C` nodes)
 * - `value`: The single value that this node contains
 * - `comment`: A comment to write after the value
 * 
 * @param args Object containing the arguments
 */
export function T({ name, ev, value, comment }: {
  name?: string;
  ev?: string | number | bigint;
  value?: any;
  comment?: string;
} = {}): TuningElementNode {
  const attributes: TuningAttributes = {};
  if (name != undefined) attributes.n = name;
  if (ev != undefined) attributes.ev = ev;
  const children: TuningNode[] = [];
  if (value != undefined) children.push(new TuningValueNode(value));
  if (comment) children.push(new TuningCommentNode(comment));
  return new TuningElementNode({ tag: 'T', attributes, children });
}

/**
 * Creates and returns an enum tunable (E tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `value`: The single value that this node contains
 * - `comment`: A comment to write after the value
 * 
 * @param args Object containing the arguments
 */
export function E({ name, value, comment }: {
  name?: string;
  value?: string;
  comment?: string;
} = {}): TuningElementNode {
  const attributes: TuningAttributes = {};
  if (name != undefined) attributes.n = name;
  const children: TuningNode[] = [];
  if (value != undefined) children.push(new TuningValueNode(value));
  if (comment) children.push(new TuningCommentNode(comment));
  return new TuningElementNode({ tag: 'E', attributes, children });
}

/**
 * Creates and returns a list tunable (L tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `children`: List of nodes this one contains
 * 
 * @param args Object containing the arguments
 */
export function L({ name, children = [] }: {
  name?: string;
  children?: TuningNode[];
} = {}): TuningElementNode {
  const attributes: TuningAttributes = {};
  if (name != undefined) attributes.n = name;
  return new TuningElementNode({ tag: 'L', attributes, children });
}

/**
 * Creates and returns a tuple tunable (U tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `children`: List of nodes this one contains
 * 
 * @param args Object containing the arguments
 */
export function U({ name, children = [] }: {
  name?: string;
  children?: TuningNode[];
} = {}): TuningElementNode {
  const attributes: TuningAttributes = {};
  if (name != undefined) attributes.n = name;
  return new TuningElementNode({ tag: 'U', attributes, children });
}

/**
 * Creates and returns a variant tunable (V tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `type`: Value to appear in the type attribute
 * - `child`: The node that this one contains
 * 
 * @param args Object containing the arguments
 */
export function V({ name, type, child }: {
  name?: string;
  type?: string;
  child?: TuningNode;
} = {}): TuningElementNode {
  const attributes: TuningAttributes = {};
  if (name != undefined) attributes.n = name;
  if (type != undefined) attributes.t = type;
  const children = child ? [child] : [];
  return new TuningElementNode({ tag: 'V', attributes, children });
}

/**
 * Creates and returns a class tunable (C tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `children`: List of nodes this one contains
 * 
 * @param args Object containing the arguments
 */
export function C({ name, children = [] }: {
  name: string;
  children?: TuningNode[];
}): TuningNode {
  const attributes: TuningAttributes = {};
  if (name != undefined) attributes.n = name;
  return new TuningElementNode({ tag: 'C', attributes, children });
}

/**
 * Creates a standalone comment node.
 * 
 * @param comment Comment to put in the node
 */
export function Comment(comment: string): TuningCommentNode {
  return new TuningCommentNode(comment);
}

/**
 * Creates and returns a Tunable for a new string. It will put the string in the
 * given string table, and return a node that contains its hash as a value and
 * its string as a comment. If `toHash` is supplied, it will be hashed. If
 * not, then the string itself will be hashed.
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `string`: The string to add to the table
 * - `toHash`: Text to hash instead of hashing the string itself
 * - `stbl`: The string table to add this string to
 * 
 * @param args Object containing the arguments
 */
export function LocString({ name, string, toHash, stbl }: {
  name?: string;
  string: string;
  toHash?: string;
  stbl: StringTableResource;
}): TuningElementNode {
  const entry = stbl.addAndHash(string, { toHash });
  return T({
    name,
    value: formatStringKey(entry.key),
    comment: string
  });
}

/**
 * Returns a version of `LocString` that already has a string table baked into
 * it, so that you do not need to pass it every time. Example usage is:
 * 
 * ```ts
 * const stbl = StringTableResource.create();
 * const LocString = getLocStringFn(stbl);
 * const tunable = LocString({ string: "This is the string!" });
 * ```
 *  
 * @param stbl String table to use 
 */
export function getLocStringFn(stbl: StringTableResource): ({ name, toHash, string }: {
  name?: string;
  toHash?: string;
  string: string;
}) => TuningElementNode {
  return ({ name, toHash, string }: {
    name?: string;
    toHash?: string;
    string: string;
  }) => {
    return LocString({ name, string, toHash, stbl });
  };
}

//#endregion Functions
