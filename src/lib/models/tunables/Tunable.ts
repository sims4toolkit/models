const XML_DECLARATION = '<?xml version="1.0" encoding="utf-8"?>';

//#region Types

type Tag = 'I' | 'M' | 'T' | 'E' | 'V' | 'U' | 'L' | 'C';
type AttributeKey = 'n' | 'c' | 't' | 'm' | 'i' | 'ev' | 'p';
type TunableAttributes = { [key in AttributeKey]?: any; }

//#endregion Types

//#region Classes

export abstract class TunableNode {
  abstract readonly tag: Tag;
  readonly attributes: TunableAttributes;
  readonly value?: any;
  readonly children?: TunableNode[];
  readonly comment?: string;

  constructor({ attrs = {}, value, children, comment }: {
    attrs?: TunableAttributes;
    value?: any;
    children?: TunableNode[];
    comment?: string;
  }) {
    this.attributes = attrs;
    this.value = value;
    this.children = children;
    this.comment = comment;
  }

  /**
   * Finds the first child of this node that has the given tag and attributes.
   * Neither argument is required - if one is left out, the first child matching
   * the other will be returned. If neither argument is supplied, the first 
   * child will be returned. If no children match the arguments or this node
   * does not have any children, `undefined` is returned.
   * 
   * Arguments
   * - `tag`: The tag that the child must have
   * - `attrs`: The attribute values that the child must have
   * 
   * @param args Object containing arguments
   */
  getChild({ tag, attrs }: { tag?: Tag; attrs?: TunableAttributes; } = {}): TunableNode {
    return this.children?.find(child => {
      if (tag && (child.tag !== tag)) return false;
      if (attrs === undefined) return true;
      for (const key in attrs) 
        if (child.attributes[key] !== attrs[key]) return false;
      return true;
    });
  }

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
   * 
   * @param options Object containing options
   */
  toXML({ indents = 0, spacesPerIndent = 2, includeDeclaration = false, alphabetize = false }: {
    indents?: number;
    spacesPerIndent?: number;
    includeDeclaration?: boolean;
    alphabetize?: boolean;
  } = {}): string {
    const spaces = " ".repeat(indents * spacesPerIndent);
    const lines: string[] = [];

    // declaration
    if (includeDeclaration) lines.push(`${spaces}${XML_DECLARATION}`);

    // attributes
    const attrKeys = Object.keys(this.attributes);
    const attrNodes: string[] = [];
    if (attrKeys.length > 0) {
      if (alphabetize) attrKeys.sort();
      attrKeys.forEach(key => {
        const value = formatValue(this.attributes[key]);
        attrNodes.push(`${key}="${value}"`);
      });
    }

    // writing self & children
    const attrString = attrNodes.join(' ');
    const comment = this.comment === undefined ? '' : `<!--${this.comment}-->`;
    if (this.children?.length > 0) {
      // node has children
      lines.push(`${spaces}<${this.tag}${attrString}>`);
      if (comment) {
        const extraSpaces = " ".repeat(spacesPerIndent);
        lines.push(`${spaces}${extraSpaces}${comment}`);
      }
      this.children.forEach(child => {
        lines.push(child.toXML({
          indents: indents + 1,
          spacesPerIndent,
          alphabetize
        }));
      });
      lines.push(`${spaces}</${this.tag}>`);
    } else if (this.value !== undefined) {
      // node has value
      const value = `${formatValue(this.value)}${comment}`;
      lines.push(`${spaces}<${this.tag}${attrString}>${value}</${this.tag}>`);
    } else {
      // node is empty
      lines.push(`${spaces}<${this.tag}${attrString}/>${comment}`);
    }

    return lines.join('\n');
  }
}

abstract class ValueTunable extends TunableNode {
  constructor({ attrs, value, comment }: {
    attrs?: TunableAttributes;
    value?: any;
    comment?: string;
  }) {
    super({ attrs, value, comment });
  }
}

abstract class ParentTunable extends TunableNode {
  constructor({ attrs, children, comment }: {
    attrs?: TunableAttributes;
    children?: TunableNode[];
    comment?: string;
  }) {
    super({ attrs, children, comment });
  }
}

export class InstanceTuning extends ParentTunable { readonly tag = 'I'; }
export class ModuleTuning   extends ParentTunable { readonly tag = 'M'; }
export class Tunable        extends ValueTunable  { readonly tag = 'T'; }
export class TunableEnum    extends ValueTunable  { readonly tag = 'E'; }
export class TunableVariant extends ParentTunable { readonly tag = 'V'; }
export class TunableTuple   extends ParentTunable { readonly tag = 'U'; }
export class TunableList    extends ParentTunable { readonly tag = 'L'; }
export class TunableClass   extends ParentTunable { readonly tag = 'C'; }

//#endregion Classes

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
