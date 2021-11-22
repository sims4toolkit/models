import type StringTable from "../resources/StringTable";

//#region Interfaces

/** Nodes that can form the root of a tuning file. */
export type TuningRootNode = InstanceTuning | ModuleTuning;

/** Nodes that comprise the contents of a tuning file. */
export interface TunableNode {
  tag: string;
  attrs?: { [key: string]: any };
  value?: any;
  children?: TunableNode[];
  comment?: string;
}

/** Nodes that contain a single value. */
interface ValueNode extends TunableNode {
  value: any;
}

/** Nodes that contain other nodes. */
interface ParentNode extends TunableNode {
  children: TunableNode[];
}

/** Root node for instance tuning. */
interface InstanceTuning extends ParentNode {
  tag: 'I';
  attrs: {
    c: string;
    i: string;
    m: string;
    n: string;
    s: string | number | bigint;
  };
}

/** Root node for module tuning. */
interface ModuleTuning extends ParentNode {
  tag: 'M';
  attrs: {
    n: string;
    s: string | number | bigint;
  };
}

/** Node for a tunable value (T tag). */
interface TunableValue extends ValueNode {
  tag: 'T';
  attrs: {
    n?: string;
    ev?: string | number | bigint;
  };
  value: any;
}

/** Node for a tunable enum (E tag). */
interface TunableEnum extends ValueNode {
  tag: 'E';
  attrs: { n?: string; };
  value: string;
}

/** Node for a tunable variant (V tag). */
interface TunableVariant extends ParentNode {
  tag: 'V';
  attrs: { n?: string; t: string; };
}

/** Node for a tunable list (L tag). */
interface TunableList extends ParentNode {
  tag: 'L';
  attrs: { n?: string; };
}

/** Node for a tunable tuple (U tag). */
interface TunableTuple extends ParentNode {
  tag: 'U';
  attrs: { n?: string; };
}

/** Node for a tunable class (C tag). */
interface TunableClass extends ParentNode {
  tag: 'C';
  attrs: { n: string; };
}

//#endregion Interfaces

//#region Helpers

/**
 * Creates and returns a value node.
 * 
 * @param tag Tag for this node
 * @param args Arguments for this node
 */
function valueNode(tag: string, { name, ev, value, comment }: {
  name?: string;
  ev?: string | number | bigint;
  value?: any;
  comment?: string;
}): ValueNode {
  const node: any = { tag, attrs: {} };
  if (name !== undefined) node.attrs.n = name;
  if (ev !== undefined) node.attrs.ev = ev;
  if (value !== undefined) node.value = value;
  if (comment !== undefined) node.comment = comment;
  return node;
}

/**
 * Creates and returns a parent node.
 * 
 * @param tag Tag for this node
 * @param args Arguments for this node
 */
function parentNode(tag: string, { name, type, children, comment }: {
  name?: string;
  type?: string;
  children?: TunableNode[];
  comment?: string;
}): ParentNode {
  const node: any = { tag, attrs: {} };
  if (name !== undefined) node.attrs.n = name;
  if (type !== undefined) node.attrs.t = type;
  if (children !== undefined && children.length > 0) node.children = children;
  if (comment !== undefined) node.comment = comment;
  return node;
}

/**
 * Formats the given value so it can appear in tuning.
 * 
 * @param value Value to format
 */
function formatValue(value: any): string {
  const type = typeof value;
  switch (type) {
    case 'boolean':
      return value ? 'True' : 'False';
    case 'number':
    case 'bigint':
      return value.toString();
    default:
      return value;
  }
}

//#endregion Helpers

//#region Node Functions

/**
 * Creates and returns an InstanceTuning (I tag).
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
export function I({ c, i, m, n, s, children }: {
  c: string;
  i: string;
  m: string;
  n: string;
  s: string | number | bigint;
  children?: TunableNode[];
}): InstanceTuning {
  return {
    tag: 'I',
    attrs: { c, m, i, n, s },
    children
  };
}

/**
 * Creates and returns a ModuleTuning (M tag).
 * 
 * Arguments
 * - `n`: Value to appear in the filename attribute
 * - `s`: Value to appear in the tuning ID attribute
 * - `children`: List of nodes that this one contains
 * 
 * @param args Object containing the arguments
 */
export function M({ n, s, children }: {
  n: string;
  s: string | number | bigint;
  children?: TunableNode[];
}): ModuleTuning {
  return {
    tag: 'M',
    attrs: { n, s },
    children
  };
}

/**
 * Creates and returns a TunableValue (T tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `ev`: The enum value of this node (only for use within `C` nodes)
 * - `value`: The single value that this node contains
 * - `comment`: A comment to write after the value
 * 
 * @param args Object containing the arguments
 */
export function T(args: {
  name?: string;
  ev?: string | number | bigint;
  value?: any;
  comment?: string;
}): TunableValue {
  return valueNode('T', args) as TunableValue;
}

/**
 * Creates and returns a TunableEnum (E tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `value`: The single value that this node contains
 * - `comment`: A comment to write after the value
 * 
 * @param args Object containing the arguments
 */
export function E(args: {
  name?: string;
  value?: string;
  comment?: string;
}): TunableEnum {
  return valueNode('E', args) as TunableEnum;
}

/**
 * Creates and returns a TunableList (L tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `children`: List of nodes this one contains
 * - `comment`: A comment to write before the first child
 * 
 * @param args Object containing the arguments
 */
export function L(args: {
  name?: string;
  children?: TunableNode[];
  comment?: string;
}): TunableList {
  return parentNode('L', args) as TunableList;
}

/**
 * Creates and returns a TunableTuple (U tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `children`: List of nodes this one contains
 * - `comment`: A comment to write before the first child
 * 
 * @param args Object containing the arguments
 */
export function U(args: {
  name?: string;
  children?: TunableNode[];
  comment?: string;
}): TunableTuple {
  return parentNode('U', args) as TunableTuple;
}

/**
 * Creates and returns a TunableVariant (V tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `type`: Value to appear in the type attribute
 * - `child`: The node that this one contains
 * - `comment`: A comment to write before the child
 * 
 * @param args Object containing the arguments
 */
export function V({ name, type, child, comment }: {
  name?: string;
  type: string;
  child?: TunableNode;
  comment?: string;
}): TunableVariant {
  const children = child === undefined ? undefined : [child];
  return parentNode('V', { name, type, children, comment }) as TunableVariant;
}

/**
 * Creates and returns a TunableClass (C tag).
 * 
 * Arguments
 * - `name`: Value to appear in the name attribute
 * - `children`: List of nodes this one contains
 * - `comment`: A comment to write before the first child
 * 
 * @param args Object containing the arguments
 */
export function C(args: {
  name: string;
  children?: TunableNode[];
  comment?: string;
}): TunableClass {
  return parentNode('C', args) as TunableClass;
}

//#endregion Node Functions

/**
 * Hashes the given string, puts it in the given string table, and returns the
 * string value for its hash and comment ("0x00000000<!--Like This-->"). To
 * avoid passing in the same string table every time you call this function,
 * consider importing the `getStringFn` function and adding the line
 * `const S = getStringFn(stbl);` in your generator.
 * 
 * @param string String to hash
 * @param stbl String table to put string in
 */
export function S(string: string, stbl: StringTable): string {
  const id = stbl.addStringAndHash(string);
  const { key } = stbl.getEntryById(id);
  return `0x${key.toString(16).padStart(8, '0').toUpperCase()}<!--${string}-->`;
}

/**
 * Will return a function that is shorthand for calling the `S` function on the
 * same string table many times. For example, instead of importing `S` and
 * calling it like `S("string", stbl)`, you can add the line
 * `const S = getStringFn(stbl);` to your generator, and then call
 * `S("string")`.
 * 
 * @param stbl String table to add all strings to
 */
export function getStringFn(stbl: StringTable): (string: string) => string {
  return (string: string) => S(string, stbl);
}

/**
 * Converts a node to an XML string.
 * 
 * Options
 * - `indents`: Number of times to indent this node (default = 0)
 * - `spacesPerIndent`: Number of space to use per indent (default = 2)
 * - `declaration`: Whether an XML declaration should be added (default = false)
 * - `alphabetize`: Whether the nodes and attributes should be sorted in
 *   alphanumeric order before writing them (default = false)
 * 
 * @param node Node to convert to XML
 * @param options Optional parameters
 */
export function nodeToXML(node: TunableNode, options: {
  indents?: number;
  spacesPerIndent?: number;
  includeDeclaration?: boolean;
  alphabetize?: boolean;
}): string {
  const indents = options?.indents || 0;
  const spacesPerIndent = options?.spacesPerIndent || 2;
  const alphabetize = options?.alphabetize || false;
  const spaces = Array(indents * spacesPerIndent).fill(' ').join('');
  const lines: string[] = [];

  // declaration
  if (options?.includeDeclaration || false)
    lines.push(`${spaces}<?xml version="1.0" encoding="utf-8"?>`);

  // attributes
  let attrsString: string = "";
  if (node.attrs !== undefined) {
    const nodeAttrKeys = Object.keys(node.attrs);
    if (alphabetize) nodeAttrKeys.sort();
    const attrFields: string[] = [""];
    nodeAttrKeys.forEach(key => {
      attrFields.push(`${key}="${node.attrs[key]}"`);
    });
    attrsString = attrFields.join(' ');
  }

  // child(ren) TODO:
  const comment = node.comment === undefined ? '' : `<!--${node.comment}-->`;
  if (node.children === undefined || node.children.length === 0) {
    if (node.value === undefined) {
      // no value or children
      lines.push(`${spaces}<${node.tag}${attrsString}/>${comment}`);
    } else {
      // no children, but a value
      lines.push(`${spaces}<${node.tag}${attrsString}>${formatValue(node.value)}${comment}</${node.tag}>`);
    }
  } else {
    // don't check for value, children override it
    lines.push(`${spaces}${comment}`);
    lines.push(`${spaces}<${node.tag}${attrsString}>`);
    node.children.forEach(childNode => {
      lines.push(nodeToXML(childNode, {
        indents: indents + 1,
        spacesPerIndent,
        alphabetize
      }));
    });
    lines.push(`${spaces}</${node.tag}>`);
  }

  return lines.join('\n');
}
