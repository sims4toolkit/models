import type Resource from "../resources/resource";
import type { WritableModelFromOptions } from "../base/writable-model";

type ResourceCondition = (type: number, buffer?: Buffer) => boolean;

interface ConditionalResourceClass {
  condition: ResourceCondition;
  cls: any; // any class
}

/**
 * A singleton class that keeps track of resources and when to initialize them.
 */
class _ResourceRegistry {
  private _conditionalClasses: ConditionalResourceClass[] = [];
  private _typedClasses: Map<number, any> = new Map();

  /**
   * Registers a resource class so that it can be parsed in a package.
   * 
   * @param cls Class that is being registered
   * @param condition Function that checks the type of a resource and returns
   * true if this class should be used for it
   */
  register(cls: any, condition: ResourceCondition) {
    this._conditionalClasses.push({ cls, condition });
  }

  /**
   * Registers a resource class that is associated with a closed set of types.
   * 
   * @param cls Class that is being registered
   * @param types The specific types associated with the given resource
   */
  registerTypes(cls: any, ...types: number[]) {
    types.forEach(type => this._typedClasses.set(type, cls));
  }

  /**
   * Generates the appropriate resource for the given properties using the
   * resources that have been registered.
   * 
   * @param type Type of resource to generate
   * @param buffer Decompressed buffer containing the resource's data
   * @param options Options to pass to the `from()` method
   */
  generateResourceFromBuffer(
    type: number,
    buffer: Buffer,
    options?: WritableModelFromOptions
  ): Resource {
    const cls = this.getResourceClass(type, buffer);
    // throwing exception if "from" doesn't exist is fine, there is an option
    // when parsing packages that will decide what to do
    return cls["from"](buffer, options);
  }

  private getResourceClass(type: number, buffer: Buffer): any {
    return this._typedClasses.get(type) ?? this._conditionalClasses.find(
      ({ condition }) => condition(type, buffer)
    ).cls;
  }
}

const ResourceRegistry = new _ResourceRegistry();
export default ResourceRegistry;
