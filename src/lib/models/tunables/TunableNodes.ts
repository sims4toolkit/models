import type StringTable from "../resources/StringTable";

//#region Node Interfaces

export type TuningFileNode = InstanceTuning | ModuleTuning;

interface TunableNode {
  tag: string;
  attrs?: { [key: string]: any };
  value?: any;
  children?: TunableNode[];
}

interface ValueNode extends TunableNode {
  value: any;
}

interface ParentNode extends TunableNode {
  children: TunableNode[];
}

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

interface ModuleTuning extends ParentNode {
  tag: 'M';
  attrs: { n: string; s: string | number | bigint; };
  children: TunableClass[];
}

interface TunableValue extends ValueNode {
  tag: 'T';
  attrs: { n?: string; ev?: string | number | bigint; };
  value: any;
}

interface TunableEnum extends ValueNode {
  tag: 'E';
  attrs: { n?: string; };
  value: string;
}

interface TunableVariant extends ParentNode {
  tag: 'V';
  attrs: { n?: string; t: string; };
}

interface TunableList extends ParentNode {
  tag: 'L';
  attrs: { n?: string; };
}

interface TunableTuple extends ParentNode {
  tag: 'U';
  attrs: { n?: string; };
}

interface TunableClass extends ParentNode {
  tag: 'C';
  attrs: { n: string; };
}

//#endregion Node Interfaces

//#region Helpers

/**
 * Creates and returns a value node.
 * 
 * @param tag Tag for this node
 * @param args Name, ev, and value for this node 
 */
function valueNode(tag: string, { name, ev, value }: {
  name?: string;
  ev?: string | number | bigint;
  value?: any;
}): ValueNode {
  const node: any = { tag, attrs: {} };
  if (name !== undefined) node.attrs.n = name;
  if (ev !== undefined) node.attrs.ev = ev;
  if (value !== undefined) node.value = value;
  return node;
}

/**
 * Creates and returns a parent node.
 * 
 * @param tag Tag for this node
 * @param args Name, type, and children for this node 
 */
function parentNode(tag: string, { name, type, children }: {
  name?: string;
  type?: string;
  children?: TunableNode[];
}): ParentNode {
  const node: any = { tag, attrs: {} };
  if (name !== undefined) node.attrs.n = name;
  if (type !== undefined) node.attrs.t = type;
  if (children !== undefined && children.length > 0) node.children = children;
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

//#region Functions

/**
 * Creates and returns an InstanceTuning (I tag).
 * 
 * @param content Object containing the attributes and children of the instance
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
 * @param content Object containing the attributes and children of the module
 */
export function M({ n, s, children }: {
  n: string;
  s: string | number | bigint;
  children?: TunableClass[];
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
 * @param args Object containing the attributes and value of the tunable
 */
export function T(args: {
  name?: string;
  ev?: string | number | bigint;
  value?: any;
}): TunableValue {
  return valueNode('T', args) as TunableValue;
}

/**
 * Creates and returns a TunableEnum (E tag).
 * 
 * @param args Object containing the name and value of the enum
 */
export function E(args: {
  name?: string;
  value?: string;
}): TunableEnum {
  return valueNode('E', args) as TunableEnum;
}

/**
 * Creates and returns a TunableList (L tag).
 * 
 * @param args Object containing the name and children of the list
 */
export function L(args: {
  name?: string,
  children?: TunableNode[]
}): TunableList {
  return parentNode('L', args) as TunableList;
}

/**
 * Creates and returns a TunableTuple (U tag).
 * 
 * @param args Object containing the name and children of the tuple
 */
export function U(args: {
  name?: string,
  children?: TunableNode[]
}): TunableTuple {
  return parentNode('U', args) as TunableTuple;
}

/**
 * Creates and returns a TunableVariant (V tag).
 * 
 * @param args Object containing the name, type, and child of the variant
 */
export function V({ name, type, child }: {
  name?: string,
  type: string,
  child?: TunableNode
}): TunableVariant {
  const children = child === undefined ? undefined : [child];
  return parentNode('V', { name, type, children }) as TunableVariant;
}

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
 * Converts a node to an XML string. By default, it uses 2 spaces per indent,
 * and will increase the indent count by 1 every recursive call. To include an
 * XML declaration at the beginning of the string, set the `includeDeclaration`
 * option to true.
 * 
 * @param node Node to convert to XML
 * @param options Optional parameters
 */
export function nodeToXML(node: TunableNode, options?: {
  indents?: number;
  spacesPerIndent?: number;
  includeDeclaration?: boolean;
}): string {
  const indents = options?.indents || 0;
  const spacesPerIndent = options?.spacesPerIndent || 2;
  const declaration = options?.includeDeclaration || false;
  const spaces = Array(indents * spacesPerIndent).fill(' ').join('');

  const lines: string[] = [];
  if (declaration) lines.push('<?xml version="1.0" encoding="utf-8"?>');

  let attrsString: string = "";
  if (node.attrs !== undefined) {
    const attrs: string[] = [""];
    for (const attr in node.attrs) attrs.push(`${attr}="${node.attrs[attr]}"`);
    attrsString = attrs.join(' ');
  }

  if (node.children === undefined || node.children.length === 0) {
    if (node.value === undefined) {
      // no value or children
      lines.push(`${spaces}<${node.tag}${attrsString}/>`);
    } else {
      // no children, but a value
      lines.push(`${spaces}<${node.tag}${attrsString}>${formatValue(node.value)}</${node.tag}>`);
    }
  } else {
    // don't check for value, children override it
    lines.push(`${spaces}<${node.tag}${attrsString}>`);
    node.children.forEach(childNode => {
      lines.push(nodeToXML(childNode, {
        indents: indents + 1,
        spacesPerIndent
      }));
    });
    lines.push(`${spaces}</${node.tag}>`);
  }
  
  return lines.join('\n');
}

//#endregion Functions
