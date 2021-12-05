import { XMLParser } from "fast-xml-parser";
import type StringTable from "./resources/stringtable";
import { XML_DECLARATION } from "../utils/constants";
import { formatStringKey } from "../utils/formatting";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  commentPropName: "comment",
  preserveOrder: true,
  textNodeName: "value"
});

//#region Types & Classes

type Tag = 'I' | 'M' | 'T' | 'E' | 'V' | 'U' | 'L' | 'C';
type AttributeKey = 'n' | 'c' | 't' | 'm' | 'i' | 'ev' | 'p' | 's';
type TunableAttributes = { [key in AttributeKey]?: any; };

// this is to export the base class as a type only, so that it can be used for
// TS typing but cannot actually be used in JS
export type TunableNode = InstanceType<typeof _TunableNode>;
export type TuningDom = InstanceType<typeof _TuningDom>;

/**
 * Base class for all tunable nodes.
 */
abstract class _TunableNode {
  abstract readonly tag?: Tag;
  readonly attributes: TunableAttributes;
  readonly children?: TunableNode[];
  value?: any;
  comment?: string;

  /** Shortcut to get the first child. Mainly for use with variants. */
  get child(): TunableNode {
    return this.children[0];
  }

  /** Shortcut to get the 'n' attribute. */
  get name(): string {
    return this.attributes.n;
  }

  /** Shortcut to set the 'n' attribute. */
  set name(name: string) {
    this.attributes.n = name;
  }

  //#region Initialization

  constructor({ attributes = {}, value, children = [], comment }: {
    attributes?: TunableAttributes;
    children?: TunableNode[];
    value?: any;
    comment?: string;
  }) {
    this.attributes = attributes;
    this.children = children;
    this.value = value;
    this.comment = comment;
  }

  /** Returns a deep copy of this node. */
  abstract clone(): TunableNode;

  /** Provides arguments needed for cloning. */
  protected _internalClone(): ({
    tag: Tag;
    attributes: TunableAttributes;
    children: TunableNode[];
    value: any;
    comment: string;
  }) {
    return {
      tag: this.tag,
      attributes: Object.assign({}, this.attributes),
      children: this.children.map(child => child.clone()),
      value: this.value,
      comment: this.comment
    };
  }

  //#endregion Initialization

  //#region Create

  /**
   * Adds the given nodes as children of this one. Beware that the children that
   * are added will be the same references that are provided, so mutating any
   * of them will result in mutating the children of this node.
   * 
   * @param children List of children to add
   */
  add(...children: TunableNode[]) {
    this.children.push(...children);
  }

  /**
   * Clones the given nodes before adding them as children to this one. This
   * makes it easy to share children between nodes without worrying about what
   * happens when you mutate them, since the references will not be the same.
   * 
   * @param children List of children to clone and add
   */
  addClones(...children: TunableNode[]) {
    return this.add(...children.map(child => child.clone()));
  }

  //#endregion Create

  //#region Read

  /**
   * Returns an XML string representation of this node and all of its children
   * following the given options.
   * 
   * Options
   * - `indents`: Number of times to indent this node. This will increase by 1
   * for each recursive call. (Default = 0)
   * - `spacesPerIndent`: Number of spaces to use per indent. (Default = 2)
   * - `includeDeclaration`: Whether an XML declaration should be added to the
   * beginning of this node. This property will not be passed down to children,
   * they will always be false. (Default = false)
   * - `alphabetize`: Whether the nodes and their attributes should be written
   * in alphanumeric order. If set to true, nodes will be organized according to
   * the value of their name attribute. (Default = false)
   * - `includeTag`: Whether or not the tag(s) should be written for this node.
   * This is for internal use, you shouldn't change it. (Default = true)
   * 
   * @param options Object containing options
   */
  toXml({ indents = 0, spacesPerIndent = 2, includeDeclaration = false, alphabetize = false, includeTag = true }: {
    indents?: number;
    spacesPerIndent?: number;
    includeDeclaration?: boolean;
    alphabetize?: boolean;
    includeTag?: boolean;
  } = {}): string {
    const spaces = " ".repeat(indents * spacesPerIndent);
    const lines: string[] = [];

    // declaration
    if (includeDeclaration) lines.push(`${spaces}${XML_DECLARATION}`);

    // attributes
    const attrKeys = Object.keys(this.attributes);
    const attrNodes: string[] = [];
    if (attrKeys.length > 0) {
      attrNodes.push(''); // just for spacing
      if (alphabetize) attrKeys.sort();
      attrKeys.forEach(key => {
        const value = formatValue(this.attributes[key]);
        attrNodes.push(`${key}="${value}"`);
      });
    }

    // writing self & children/value
    const attrString = attrNodes.join(' ');
    const comment = this.comment === undefined ? '' : `<!--${this.comment}-->`;
    if (this.children?.length > 0) {
      // node has children
      const children = alphabetize ? [...this.children].sort((a, b) => {
        const aName = a.attributes.n;
        const bName = b.attributes.n;
        if (!(aName && bName)) return 0;
        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
      }) : this.children;

      if (includeTag) lines.push(`${spaces}<${this.tag}${attrString}>`);

      if (comment) {
        const extraSpaces = " ".repeat(spacesPerIndent);
        lines.push(`${spaces}${extraSpaces}${comment}`);
      }

      const childIndents = includeTag ? indents + 1 : indents;

      children.forEach(child => {
        lines.push(child.toXml({
          indents: childIndents,
          spacesPerIndent,
          alphabetize
        }));
      });

      if (includeTag) lines.push(`${spaces}</${this.tag}>`);
    } else if (this.value != undefined) { // intentionally != for null
      // node has value
      const value = `${formatValue(this.value)}${comment}`;
      if (includeTag) {
        lines.push(`${spaces}<${this.tag}${attrString}>${value}</${this.tag}>`);
      } else {
        lines.push(`${spaces}${value}`);
      }
    } else if (this.comment) {
      // node has comment
      if (includeTag) {
        lines.push(`${spaces}<${this.tag}${attrString}>${comment}</${this.tag}>`);
      } else {
        lines.push(`${spaces}${comment}`);
      }
    } else {
      // node is empty and does not have a comment
      if (includeTag) lines.push(`${spaces}<${this.tag}${attrString}/>`);
    }

    return lines.join('\n');
  }

  /**
   * Finds all children of this node that satisfy all of the search criteria.
   * This is meant to be a convenient way to find a specific child - if you need
   * a more refined / specific search, use `this.children.filter()`.
   * 
   * Arguments
   * - `tag`: Tag that child must have.
   * - `name`: Shortcut for checking the `n` attribute.
   * - `attributes`: Attribute(s) that child must have.
   * - `value`: Value that child must have.
   * - `comment`: Comment that child must have (exact match).
   * 
   * @param criteria Object containing the search criteria
   */
  search({ tag, name, attributes, value, comment }: {
    tag?: Tag;
    name?: string;
    attributes?: TunableAttributes;
    value?: string;
    comment?: string;
  } = {}): TunableNode[] {
    return this.children.filter(child => {
      if (tag && child.tag !== tag) return false;
      if (value && child.value !== value) return false;
      if (comment && child.comment !== comment) return false;
      if (name && child.name !== name) return false;
      if (attributes)
        for (const key in attributes)
          if (child.attributes[key] !== attributes[key]) return false;
      return true;
    });
  }

  //#endregion Read

  //#region Update

  /**
   * Calls the `sort()` method on this node and all of its descendants.
   * 
   * @param compareFn Function used to determine the order of the elements. It
   * is expected to return a negative value if first argument is less than
   * second argument, zero if they're equal and a positive value otherwise. If
   * omitted, the elements are sorted in ascending, ASCII character order.
   * [Copied from `Array.sort()`'s documentation]
   */
  deepSort(compareFn?: (a: TunableNode, b: TunableNode) => number) {
    this.sort(compareFn);
    this.children.forEach(child => child.deepSort());
  }

  /**
   * Sorts the children of this node using the provided function. If no function
   * is given, they are sorted in ascending order by their name. Children
   * without names will retain their order relative to one another and will
   * appear at the end.
   * 
   * Note that this method does NOT recursively sort the inner contents of
   * children - to do so, use the `deepSort()` method.
   * 
   * @param compareFn Function used to determine the order of the elements. It
   * is expected to return a negative value if first argument is less than
   * second argument, zero if they're equal and a positive value otherwise. If
   * omitted, the elements are sorted in ascending, ASCII character order.
   * [Copied from `Array.sort()`'s documentation]
   */
  sort(compareFn?: (a: TunableNode, b: TunableNode) => number) {
    this.children.sort(compareFn || ((a, b) => {
      const aName = a.attributes.n;
      const bName = b.attributes.n;
      if (aName) {
        if (bName) {
          if (aName < bName) return -1;
          if (aName > bName) return 1;
          return 0;
        }
        return -1;
      }
      return bName ? 1 : 0;
    }));
  }

  //#endregion Update

  //#region Delete

  /**
   * Removes the given children from this node. Reference equality is used to
   * determine which children should be removed, so ensure you are passing in
   * objects that actually appear in this node.
   * 
   * @param children Children to remove
   */
  remove(...children: TunableNode[]) {
    children.forEach(child => {
      const index = this.children.findIndex(c => c === child);
      if (index !== -1) this._removeAt(index);
    });
  }

  /**
   * Removes children from this node using their index. If the count is left
   * out, only one child is removed. Shortcut for `this.children.splice()`.
   * 
   * @param index Index of child(ren) to remove
   * @param count Number of children to remove
   * @returns The children that were removed
   */
  private _removeAt(index: number, count: number = 1): TunableNode[] {
    return this.children?.splice(index, count);
  }

  //#endregion Delete
}

abstract class ValueTunable extends _TunableNode {
  constructor({ attributes, value, comment }: {
    attributes?: TunableAttributes;
    value?: any;
    comment?: string;
  }) {
    super({ attributes, value, comment });
  }
}

abstract class ParentTunable extends _TunableNode {
  constructor({ attributes, children, comment }: {
    attributes?: TunableAttributes;
    children?: TunableNode[];
    comment?: string;
  }) {
    super({ attributes, children, comment });
  }
}

abstract class NoTagNode extends _TunableNode {
  readonly tag = undefined;

  toXml(options: {
    indents?: number;
    spacesPerIndent?: number;
    includeDeclaration?: boolean;
    alphabetize?: boolean;
    includeTag?: boolean;
  } = {}): string {
    options.includeTag = false;
    return super.toXml(options);
  }
}

/** Node for DOM. */
class _TuningDom extends NoTagNode {
  constructor({ children }: { children?: TunableNode[]; } = {}) {
    super({ children });
  }

  clone(): TuningDom {
    return new _TuningDom({
      children: this.children.map(child => child.clone())
    });
  }
}

/** Node for a single comment that isn't part of a tunable. */
class CommentNode extends NoTagNode {
  constructor({ comment }: {
    comment?: string;
  } = {}) {
    super({ comment });
  }

  clone(): CommentNode {
    return new CommentNode({ comment: this.comment });
  }
}

/** Node for a single value that isn't part of a tunable. */
class ValueNode extends NoTagNode {
  constructor({ value }: {
    value?: any;
  } = {}) {
    super({ value });
  }

  clone(): ValueNode {
    return new ValueNode({ value: this.value });
  }
}

/** Root node for instance tuning (I tag). */
class InstanceTuning extends ParentTunable {
  readonly tag = 'I';

  clone(): InstanceTuning {
    return new InstanceTuning(this._internalClone());
  }
}

/** Root node for module tuning (M tag). */
class ModuleTuning extends ParentTunable {
  readonly tag = 'M';

  clone(): ModuleTuning {
    return new ModuleTuning(this._internalClone());
  }
}

/** Node for primitive values (T tag). */
class Tunable extends ValueTunable {
  readonly tag = 'T';

  clone(): Tunable {
    return new Tunable(this._internalClone());
  }
}

/** Node for enum values (E tag). */
class TunableEnum extends ValueTunable {
  readonly tag = 'E';

  clone(): TunableEnum {
    return new TunableEnum(this._internalClone());
  }
}

/** Node for variants (V tag). */
class TunableVariant extends ParentTunable {
  readonly tag = 'V';

  clone(): TunableVariant {
    return new TunableVariant(this._internalClone());
  }
}

/** Node for tuples (U tag). */
class TunableTuple extends ParentTunable {
  readonly tag = 'U';

  clone(): TunableTuple {
    return new TunableTuple(this._internalClone());
  }
}

/** Node for lists (L tag). */
class TunableList extends ParentTunable {
  readonly tag = 'L';

  clone(): TunableList {
    return new TunableList(this._internalClone());
  }
}

/** Node for classes (C tag). */
class TunableClass extends ParentTunable {
  readonly tag = 'C';

  clone(): TunableClass {
    return new TunableClass(this._internalClone());
  }
}

//#endregion Types & Classes

//#region Functions

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
 * - `comment`: Comment to add to this instance
 * 
 * @param args Object containing the arguments
 */
export function I({ c, i, m, n, s, children, comment }: {
  c: string;
  i: string;
  m: string;
  n: string;
  s: string | number | bigint;
  children?: TunableNode[];
  comment?: string;
}): InstanceTuning {
  return new InstanceTuning({
    attributes: { c, i, m, n, s: formatValue(s) },
    children,
    comment
  });
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
export function M({ n, s, children, comment }: {
  n: string;
  s: string | number | bigint;
  children?: TunableNode[];
  comment?: string;
}): ModuleTuning {
  return new ModuleTuning({
    attributes: { n, s: formatValue(s) },
    children,
    comment
  });
}

/**
 * Creates and returns a Tunable (T tag).
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
} = {}): Tunable {
  const attributes: TunableAttributes = {};
  if (name !== undefined) attributes.n = name;
  if (ev !== undefined) attributes.ev = formatValue(ev);
  return new Tunable({ attributes, value, comment });
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
export function E({ name, value, comment }: {
  name?: string;
  value?: string;
  comment?: string;
} = {}): TunableEnum {
  const attributes: TunableAttributes = {};
  if (name !== undefined) attributes.n = name;
  return new TunableEnum({ attributes, value, comment });
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
export function L({ name, children, comment }: {
  name?: string;
  children?: TunableNode[];
  comment?: string;
} = {}): TunableList {
  const attributes: TunableAttributes = {};
  if (name !== undefined) attributes.n = name;
  return new TunableList({ attributes, children, comment });
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
export function U({ name, children, comment }: {
  name?: string;
  children?: TunableNode[];
  comment?: string;
} = {}): TunableTuple {
  const attributes: TunableAttributes = {};
  if (name !== undefined) attributes.n = name;
  return new TunableTuple({ attributes, children, comment });
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
  type?: string;
  child?: TunableNode;
  comment?: string;
} = {}): TunableVariant {
  const children: TunableNode[] = child ? [child] : undefined;
  const attributes: TunableAttributes = {};
  if (name !== undefined) attributes.n = name;
  if (type !== undefined) attributes.t = type;
  return new TunableVariant({ attributes, children, comment });
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
export function C({ name, children, comment }: {
  name: string;
  children?: TunableNode[];
  comment?: string;
}): TunableClass {
  const attributes: TunableAttributes = {};
  if (name !== undefined) attributes.n = name;
  return new TunableClass({ attributes, children, comment });
}

/**
 * Creates a standalone comment node. It is recommended to put comments in other
 * nodes; this function primarily exists for parsing nodes from XML.
 * 
 * @param comment Comment to put in the node
 */
export function Comment(comment: string): CommentNode {
  return new CommentNode({ comment });
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
  stbl: StringTable;
}): Tunable {
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
export function getLocStringFn(stbl: StringTable): ({ name, toHash, string }: {
  name?: string;
  toHash?: string;
  string: string;
}) => Tunable {
  return ({ name, toHash, string }: { name?: string; toHash?: string; string: string }) => {
    return LocString({ name, string, toHash, stbl });
  };
}

/**
 * Wraps the given nodes in a TuningDom object.
 * 
 * @param nodes Top-level nodes in the DOM
 */
export function makeDom(...nodes: TunableNode[]): TuningDom {
  return new _TuningDom({ children: nodes });
}

/**
 * Parse an XML string as a TuningDom.
 * 
 * @param xml String containing the XML code to parse as a DOM
 */
export function parseDom(xml: string): TuningDom {
  const dom = parser.parse(xml);
  // TODO: impl
  return dom;
  // return new NoTagNode();
}

//#endregion Functions

//#region Helpers

/**
 * Formats the given value so it can appear in tuning XML.
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
