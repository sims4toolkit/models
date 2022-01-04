import { XMLParser } from "fast-xml-parser";
import { XML_DECLARATION } from "../../utils/constants";

//#region Types

/** Generic interface that can support any attributes. */
type Attributes = { [key: string]: any; };

/** Types that may appear in a value node. */
type XmlValue = number | bigint | boolean | string;

//#endregion Types

//#region Models

/** A node in an XML DOM. */
export interface XmlNode {
  //#region Getters

  /**
   * An object containing the attributes of this node. This is guaranteed to be
   * an object if the node is able to have attributes, but if it cannot have
   * attributes (e.g. value nodes, comment nodes), it is undefined.
   */
  get attributes(): Attributes;

  /**
   * The first child of this node. If there are no children, it is undefined.
   */
  get child(): XmlNode;

  /**
   * The children of this node. This is guaranteed to be an array if this node
   * can have children (e.g. a document or an element), but is undefined if it
   * cannot (e.g. values or comments).
   */
  get children(): XmlNode[];

  /** Whether or not this node has an array for children. */
  get hasChildren(): boolean;

  /** Shorthand for the `s` attribute. */
  get id(): string | number | bigint;

  /** The value of this node's first child, if it has one. */
  get innerValue(): XmlValue;

  /** Shorthand for the `n` attribute. */
  get name(): string;

  /** The number of children on this node. */
  get numChildren(): number;

  /** The tag of this node. */
  get tag(): string;

  /** Shorthand for the `t` attribute. */
  get type(): string;

  /** The value of this node. */
  get value(): XmlValue;

  //#endregion Getters

  //#region Setters

  /**
   * Sets the first child of this node, if it can have children. If it cannot,
   * an error is thrown. If it can have children, but doesn't one is added.
   */
  set child(child: XmlNode);

  /**
   * Shorthand for setting the `s` attribute. If this node is not an element, an
   * exception is thrown.
   */
  set id(id: string | number | bigint);

  /**
   * Shorthand for setting the value of this node's first child. If this node
   * cannot have children, or if its first child cannot have a value, an
   * exception is thrown. If this node can have children, but doesn't, one will
   * be created.
   */
  set innerValue(value: XmlValue);

  /**
   * Shorthand for setting the `n` attribute. If this node is not an element, an
   * exception is thrown.
   */
  set name(name: string);

  /**
   * Sets the tag of this node. If this node is not an element or if the given
   * tag is not a non-empty string, an exception is thrown.
   */
  set tag(tag: string);

  /**
   * Shorthand for setting the `t` attribute. If this node is not an element, an
   * exception is thrown.
   */
  set type(type: string);

  /**
   * Sets the value of this node. If this node cannot have a value (i.e. it has
   * children instead), an exception is thrown.
   */
  set value(value: XmlValue);

  //#endregion Setters

  //#region Methods

  /**
   * Adds the given children to this node by object reference. If you are adding
   * these children to multiple nodes and plan on mutating them, it is
   * recommended that you use `addClones()` instead in order to prevent 
   * unexpected mutation.
   * 
   * @param children Child nodes to append to this one
   * @throws If this node cannot have children
   */
  addChildren(...children: XmlNode[]): void;

  /**
   * Adds the given children to this node by value. All children are cloned
   * prior to being added.
   * 
   * @param children Child nodes to append to this one
   * @throws If this node cannot have children
   */
  addClones(...children: XmlNode[]): void;

  /**
   * Returns a deep copy of this node.
   */
  clone(): XmlNode;

  /**
   * Calls the `sort()` method on this node and all of its descendants.
   * 
   * @param compareFn Function used to determine the order of the elements. It
   * is expected to return a negative value if first argument is less than
   * second argument, zero if they're equal and a positive value otherwise. If
   * omitted, the elements are sorted in ascending, ASCII character order.
   * [Copied from `Array.sort()` documentation]
   * @throws If this node cannot have children
   */
  deepSort(compareFn?: (a: XmlNode, b: XmlNode) => number): void;

  /**
   * Sorts the children of this node using the provided function. If no function
   * is given, they are sorted in ascending alphanumeric order by their `n`
   * attribute (their name). Children without names will retain their order
   * relative to one another and will appear at the end.
   * 
   * @param compareFn Function used to determine the order of the elements. It
   * is expected to return a negative value if first argument is less than
   * second argument, zero if they're equal and a positive value otherwise. If
   * omitted, the elements are sorted in ascending, ASCII character order.
   * [Copied from `Array.sort()` documentation]
   * @throws If this node cannot have children
   */
  sort(compareFn?: (a: XmlNode, b: XmlNode) => number): void;

  /**
   * Serializes this node and all of its descendants as XML code.
   * 
   * Options
   * - `indents`: Number of times to indent this node. This will increase by 1
   * for each recursive call. (Default = 0)
   * - `spacesPerIndent`: Number of spaces to use per indent. (Default = 2)
   * 
   * @param options Object containing options for serializing
   */
  toXml(options?: { indents?: number; spacesPerIndent?: number;}): string;

  //#endregion Methods
}

/** A base implementation of XmlNode. */
abstract class XmlNodeBase implements XmlNode {
  protected _attributes?: Attributes;
  protected _children?: XmlNode[];
  protected _tag?: string;
  protected _value?: XmlValue;

  constructor({ attributes, children, tag, value }: {
    attributes?: Attributes;
    children?: XmlNode[];
    tag?: string;
    value?: XmlValue;
  }) {
    this._attributes = attributes;
    this._children = children;
    this._tag = tag;
    this._value = value;
  }

  //#region Getters

  get attributes(): Attributes {
    return this._attributes;
  }

  get child(): XmlNode {
    return this.children?.[0];
  }

  get children(): XmlNode[] {
    return this._children;
  }

  get hasChildren(): boolean {
    return this.children !== undefined;
  }

  get id(): string | number | bigint {
    return this._attributes?.s;
  }

  get innerValue(): XmlValue {
    return this.child?.value;
  }

  get name(): string {
    return this.attributes?.n;
  }

  get numChildren(): number {
    return this.children?.length || 0;
  }

  get tag(): string {
    return this._tag;
  }

  get type(): string {
    return this.attributes?.t;
  }

  get value(): XmlValue {
    return this._value;
  }

  //#endregion Getters

  //#region Setters

  set child(child: XmlNode) {
    if (!this.hasChildren)
      throw new Error("Cannot set child of childless node.");
    this.children[0] = child;
  }

  set id(id: string | number | bigint) {
    this._setAttribute('s', id);
  }

  set innerValue(value: XmlValue) {
    this._ensureChildren();
    if (this.numChildren === 0) { 
      this.addChildren(new XmlValueNode(value));
    } else {
      this.child.value = value; // might throw, that's OK
    }
  }

  set name(name: string) {
    this._setAttribute('n', name);
  }

  set tag(tag: string) {
    if (!this.tag) throw new Error("Cannot set tag of non-element node.");
    if (!tag) throw new Error("Tag must be a non-empty string.");
    this._tag = tag;
  }

  set type(type: string) {
    this._setAttribute('t', type);
  }

  set value(value: XmlValue) {
    if (this.hasChildren)
      throw new Error("Cannot set value of node with children.");
    this._value = value;
  }

  //#endregion Setters

  //#region Methods

  addChildren(...children: XmlNode[]): void {
    this._ensureChildren();
    this.children.push(...children);
  }

  addClones(...children: XmlNode[]): void {
    this._ensureChildren();
    this.children.push(...(children.map(child => child.clone())));
  }

  abstract clone(): XmlNode;

  deepSort(compareFn?: (a: XmlNode, b: XmlNode) => number): void {
    this._ensureChildren();
    this.sort(compareFn);
    this.children.forEach(child => {
      if (child.children) child.deepSort(compareFn);
    });
  }

  sort(compareFn?: (a: XmlNode, b: XmlNode) => number): void {
    this._ensureChildren();
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

  abstract toXml(options?: {
    indents?: number;
    spacesPerIndent?: number;}
    ): string;

  //#endregion Methods

  //#region Private Methods

  private _setAttribute(key: string, value: any) {
    if (this.attributes === undefined)
      throw new Error("Cannot set attribute of non-element node.")
    this.attributes[key] = value;
  }

  private _ensureChildren() {
    if (!this.hasChildren)
      throw new Error("Cannot mutate children of childless node.");
  }

  //#endregion Private Methods
}

/** A complete XML document with children. */
export class XmlDocumentNode extends XmlNodeBase {
  constructor(root?: XmlNode) {
    super({ children: (root ? [root] : []) })
  }

  /**
   * Parses and returns either a string or a buffer containing XML code as a
   * XmlDocumentNode, if possible.
   * 
   * Options
   * - `allowMultipleRoots`: Whether or not the document should still be created
   * if it will have multiple roots. If false, an exception will be thrown if
   * there is more than one root element. (Default = false)
   * 
   * @param xml XML document to parse as a node
   * @param options Object containing options
   */
  static from(xml: string | Buffer, {
    allowMultipleRoots = false
  }: {
    allowMultipleRoots?: boolean;
  } = {}): XmlDocumentNode {
    const nodes = parseXml(xml);
    if (nodes.length <= 1) return new XmlDocumentNode(nodes[0]);
    if (allowMultipleRoots) {
      const doc = new XmlDocumentNode();
      doc.children.push(...nodes);
      return doc;
    } else {
      throw new Error("XML document should only have one root node.");
    }
  }

  addChildren(...children: XmlNode[]): void {
    if (this.numChildren + children.length > 1)
      throw new Error("XML document should only have one root node.");
    super.addChildren(...children);
  }

  addClones(...children: XmlNode[]): void {
    if (this.numChildren + children.length > 1)
      throw new Error("XML document should only have one root node.");
    super.addClones(...children);
  }

  clone(): XmlDocumentNode {
    return new XmlDocumentNode(...(this.children.map(child => child.clone())));
  }

  toXml({ indents = 0, spacesPerIndent = 2 }: {
    indents?: number;
    spacesPerIndent?: number;
  } = {}): string {
    const spaces = " ".repeat(indents * spacesPerIndent);
    const lines: string[] = [`${spaces}${XML_DECLARATION}`];

    this.children.forEach(child => {
      lines.push(child.toXml({ indents, spacesPerIndent }));
    });

    return lines.join('\n');
  }
}

/** A node with a tag, attributes, and children. */
export class XmlElementNode extends XmlNodeBase {
  constructor({ tag, attributes = {}, children = [] }: {
    tag: string;
    attributes?: Attributes;
    children?: XmlNode[];
  }) {
    if (!tag) throw new Error("Element tag must be a non-empty string.");
    super({ tag, attributes, children });
  }

  clone(): XmlElementNode {
    return new XmlElementNode({
      tag: this.tag,
      attributes: Object.assign({}, this.attributes),
      children: this.children.map(child => child.clone())
    });
  }

  toXml({ indents = 0, spacesPerIndent = 2 }: {
    indents?: number;
    spacesPerIndent?: number;
  } = {}): string {
    const spaces = " ".repeat(indents * spacesPerIndent);
    const lines: string[] = [];

    // attributes
    const attrKeys = Object.keys(this.attributes);
    const attrNodes: string[] = [];
    if (attrKeys.length > 0) {
      attrNodes.push(''); // just for spacing
      attrKeys.forEach(key => {
        const value = formatValue(this.attributes[key]);
        attrNodes.push(`${key}="${value}"`);
      });
    }
    const attrString = attrNodes.join(' ');
    
    // tags & children
    if (this.numChildren === 0) {
      lines.push(`${spaces}<${this.tag}${attrString}/>`);
    } else if (this.numChildren <= 2 && !this.child.hasChildren) {
      const value = this.children.map(child => child.toXml()).join('');
      lines.push(`${spaces}<${this.tag}${attrString}>${value}</${this.tag}>`);
    } else {
      lines.push(`${spaces}<${this.tag}${attrString}>`);
      this.children.forEach(child => {
        lines.push(child.toXml({ indents: indents + 1, spacesPerIndent }));
      });
      lines.push(`${spaces}</${this.tag}>`);
    }

    return lines.join('\n');
  }
}

/** A node that contains a single value. */
export class XmlValueNode extends XmlNodeBase {
  constructor(value?: XmlValue) {
    super({ value });
  }

  clone(): XmlValueNode {
    return new XmlValueNode(this.value);
  }

  toXml({ indents = 0, spacesPerIndent = 2 }: {
    indents?: number;
    spacesPerIndent?: number;
  } = {}): string {
    if (this.value == undefined) return '';
    const spaces = " ".repeat(indents * spacesPerIndent);
    return `${spaces}${formatValue(this.value)}`;
  }
}

/** A node that contains a comment. */
export class XmlCommentNode extends XmlNodeBase {
  constructor(value?: string) {
    super({ value })
  }

  clone(): XmlCommentNode {
    return new XmlCommentNode(this.value as string);
  }

  toXml({ indents = 0, spacesPerIndent = 2 }: {
    indents?: number;
    spacesPerIndent?: number;
  } = {}): string {
    const spaces = " ".repeat(indents * spacesPerIndent);
    const comment = this.value == undefined ? '' : formatValue(this.value);
    return `${spaces}<!--${comment}-->`;
  }
}

//#endregion Models

//#region Helpers

/**
 * Formats a value that may appear in XML as a string.
 * 
 * @param value Value to format for XML
 */
function formatValue(value: number | bigint | boolean | string): string {
  switch (typeof value) {
    case 'boolean':
      return value ? 'True' : 'False';
    case 'number':
    case 'bigint':
      return value.toString();
    default:
      return value;
  }
}

/**
 * Parses a string or buffer containing XML as a list of nodes.
 * 
 * @param xml XML document to parse as a node
 */
function parseXml(xml: string | Buffer): XmlNode[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: false,
    parseTagValue: false,
    commentPropName: "comment",
    textNodeName: "value",
    preserveOrder: true,
  });

  interface NodeObj {
    value?: number | bigint | string;
    comment?: { value: string }[];
    attributes?: { [key: string]: string };
    [key: string]: any;
  }

  const nodeObjs: NodeObj[] = parser.parse(xml);

  function parseNodeObj(nodeObj: NodeObj): XmlNode {
    if (nodeObj.comment) {
      return new XmlCommentNode(nodeObj.comment[0].value);
    } else if (nodeObj.value) {
      return new XmlValueNode(nodeObj.value);
    } else {
      let tag: string;
      let children: XmlNode[];
      let attributes: Attributes = {};
      for (const key in nodeObj) {
        if (key === "attributes") {
          Object.assign(attributes, nodeObj[key]);
        } else {
          // guaranteed to execute once and only once
          tag = key;
          children = nodeObj[key].map(parseNodeObj)
        }
      }
      return new XmlElementNode({ tag, children, attributes });
    }
  }

  return nodeObjs.map(parseNodeObj);
}

//#endregion Helpers
