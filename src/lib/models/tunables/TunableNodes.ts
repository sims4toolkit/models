//#region Node Interfaces

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
    m: string;
    i: string;
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

function valueNode(tag: string, { name, ev, value }: {
  name?: string;
  ev?: string | number | bigint;
  value?: any;
}): ValueNode {
  const node: any = { tag };
  if (name !== undefined) node.attrs.n = name;
  if (ev !== undefined) node.attrs.ev = ev;
  if (value !== undefined) node.value = value;
  return node;
}

function parentNode(tag: string, { name, type, children }: {
  name?: string;
  type?: string;
  children?: TunableNode[];
}): ParentNode {
  const node: any = { tag };
  if (name !== undefined) node.attrs.n = name;
  if (type !== undefined) node.attrs.t = type;
  if (children !== undefined && children.length > 0) node.children = children;
  return node;
}

//#endregion Helpers

//#region Node Functions

/**
 * Creates and returns an InstanceTuning (I tag).
 * 
 * @param content Object containing the attributes and children of the instance
 */
export function I({ c, m, i, n, s, children }: {
  c: string;
  m: string;
  i: string;
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
  type?: string,
  child?: TunableNode
}): TunableVariant {
  return parentNode('V', { name, type, children: [child] }) as TunableVariant;
}

//#endregion Node Functions
