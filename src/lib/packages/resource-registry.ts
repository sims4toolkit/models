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
  constructor(private _resourceClasses: ConditionalResourceClass[] = []) { }

  /**
   * Registers a resource class so that it can be parsed in a package.
   * 
   * @param cls Class that is being registered
   * @param condition Function that checks the type of a resource and returns
   * true if this class should be used for it
   */
  register(cls: any, condition: ResourceCondition) {
    this._resourceClasses.push({ cls, condition });
  }

  /**
   * Generates the appropriate resource for the given properties using the
   * resources that have been registered.
   * 
   * @param type Type of resource to generate
   * @param buffer Decompressed buffer containing the resource's data
   * @param options Options to pass to the `from()` method
   */
  generateResourceFromBuffer(type: number, buffer: Buffer, options?: WritableModelFromOptions): Resource {
    for (let i = 0; i < this._resourceClasses.length; i++) {
      const { cls, condition } = this._resourceClasses[i];
      if (condition(type, buffer)) return cls['from'](buffer, options);
    }
  }
}

const ResourceRegistry = new _ResourceRegistry();
export default ResourceRegistry;
