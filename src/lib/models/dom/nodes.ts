//#region Types

/** Tags that are valid in tuning. */
type TuningTag = 'I' | 'M' | 'T' | 'E' | 'V' | 'U' | 'L' | 'C';

/** Attribute keys that are valid in tuning. */
type TuningAttributeKey = 'n' | 'c' | 't' | 'm' | 'i' | 'ev' | 'p' | 's';

/** Interface that only supports attributes that should be in tuning. */
type TuningAttributes = { [key in TuningAttributeKey]?: any; };

/** Generic interface that can support any attributes. */
type Attributes = { [key: string]: any; };

/** Types that may appear as the value of a tuning node. */
type TuningValue = number | bigint | boolean | string;

//#endregion Types

/**
 * TODO:
 */
export interface TuningNode {
  //#region Getters

  /**
   * An object containing the attributes of this node. This is guaranteed to be
   * an object if the node is able to have attributes, but if it cannot have
   * attributes (e.g. value nodes, comment nodes), it is undefined.
   */
  get attributes(): Attributes;

  /**
   * The first child of this node. If there are no children, it is undefined.
   * Intended for use with tunable variants.
   */
  get child(): TuningNode;

  /**
   * The children of this node. This is guaranteed to be an array if this node
   * can have children (e.g. a document or an element), but is undefined if it
   * cannot (e.g. values or comments).
   */
  get children(): TuningNode[];

  /** Shorthand for the `s` attribute. */
  get id(): string | number | bigint;

  /** Shorthand for the `n` attribute. */
  get name(): string;

  /** The number of children on this node. */
  get numChildren(): number;

  /** The tag of this node. */
  get tag(): string;

  /** Shorthand for the `t` attribute. */
  get type(): string;

  /** The value of this node. */
  get value(): TuningValue;

  //#endregion Getters

  //#region Setters

  /**
   * Sets the first child of this node, if it can have children. If it cannot,
   * an error is thrown. Intended for use with tunable variants.
   */
  set child(child: TuningNode);

  /**
   * Shorthand for setting the `s` attribute. If this node is not an element, an
   * exception is thrown.
   */
  set id(id: string | number | bigint);

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
  set value(value: TuningValue);

  //#endregion Setters

  //#region Methods

  addChildren(...children: TuningNode[]): void;

  addClones(...children: TuningNode[]): void;

  clone(): TuningNode;

  deepSort(): void;

  sort(): void;

  toXml(): string;

  //#endregion Methods
}

/**
 * TODO:
 */
abstract class TuningNodeBase implements TuningNode {
  protected _attributes?: Attributes;
  protected _children?: TuningNode[];
  protected _tag?: string;
  protected _value?: TuningValue;

  //#region Getters

  get attributes(): Attributes {
    return this._attributes;
  }

  get child(): TuningNode {
    return this.children?.[0];
  }

  get children(): TuningNode[] {
    return this._children;
  }

  get id(): string | number | bigint {
    return this._attributes?.s;
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

  get value(): TuningValue {
    return this._value;
  }

  //#endregion Getters

  //#region Setters

  set child(child: TuningNode) {
    if (!this.children)
      throw new Error("Cannot set child of childless node.");
    this.children[0] = child;
  }

  set id(id: string | number | bigint) {
    this._setAttribute('s', id);
  }

  set name(name: string) {
    this._setAttribute('n', name);
  }

  set tag(tag: string) {
    if (!this._tag) throw new Error("Cannot set tag of non-element node.");
    if (!tag) throw new Error("Tag must be a non-empty string.");
    this._tag = tag;
  }

  set type(type: string) {
    this._setAttribute('t', type);
  }

  set value(value: TuningValue) {
    if (this.children)
      throw new Error("Cannot set value of node with children.");
    this._value = value;
  }

  //#endregion Setters

  //#region Methods

  abstract addChildren(...children: TuningNode[]): void;

  abstract addClones(...children: TuningNode[]): void;

  abstract clone(): TuningNode;

  abstract deepSort(): void;

  abstract sort(): void;

  abstract toXml(): string;

  //#endregion Methods

  //#region Private Methods

  private _setAttribute(key: string, value: any) {
    if (this.attributes === undefined)
      throw new Error("Cannot set attribute of non-element node.")
    this.attributes[key] = value;
  }

  //#endregion Private Methods
}
