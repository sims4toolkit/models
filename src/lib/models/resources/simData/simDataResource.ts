import Resource from "../resource";
import { BinaryEncoder, BinaryDecoder } from "../../../utils/encoding";
import { fnv32 } from "../../../utils/hashing";
import { removeFromArray } from "../../../utils/helpers";
import { SimDataInstance, SimDataSchema } from "./fragments";

/**
 * A resource for SimData (binary tuning). SimDatas are essentially mini
 * relational databases, but to simplify working with them (and for consistency
 * with Sims 4 Studio), this model uses the concept of "instances". An
 * "instance" is an object cell that has a name.
 */
export default class SimDataResource extends Resource {
  readonly variant = 'DATA';
  
  private _schemas: SimDataSchema[];
  private _instances: SimDataInstance[];

  /**
   * The schemas in this SimData. Individual schemas can be mutated and cacheing
   * will be handled (e.g. `schemas[0].name = "Schema"` is perfectly safe),
   * however, mutating the array itself by adding or removing schemas should be
   * avoided whenever possible, because doing so is a surefire way to mess up
   * the cache. 
   * 
   * To add schemas, use the `addSchemas()` or `addSchemaClones()` methods. To
   * remove schemas, use the `removeSchemas()` method or call `delete()` on
   * individual schemas.
   * 
   * If you insist on removing from or sorting the array manually, you can, as
   * long as you remember to call `uncache()` when you are done. If you insist
   * on adding columns manually, it's your funeral.
   */
  get schemas() { return this._schemas; }
  
  /** The instances (named objects) in this SimData. */
  get instances() { return this._instances; }

  protected constructor(schemas: SimDataSchema[], instances: SimDataInstance[], buffer?: Buffer) {
    super({ buffer });
    schemas.forEach(schema => schema.owner = this);
    this._schemas = schemas;
    instances.forEach(instance => instance.owner = this);
    this._instances = instances; 
  }

  clone(): SimDataResource {
    return undefined;
  }

  /**
   * TODO:
   */
  static create(): SimDataResource {
    // TODO:
    return
  }

  /**
   * TODO:
   */
  static from(buffer: Buffer): SimDataResource {
    // TODO:
    return
  }

  /**
   * Adds schemas to this SimData and uncaches the buffer.
   * 
   * @param schemas Schemas to add
   */
  addSchemas(...schemas: SimDataSchema[]) {
    schemas.forEach(schema => schema.owner = this);
    this.schemas.push(...schemas);
    this.uncache();
  }

  /**
   * Removes schemas from this SimData and uncaches the buffer.
   * 
   * @param schemas Schemas to remove
   */
  removeSchemas(...schemas: SimDataSchema[]) {
    if (removeFromArray(schemas, this.schemas)) this.uncache();
  }

  /**
   * Adds instances to this SimData and uncaches the buffer.
   * 
   * @param instances Instances to add
   */
  addInstances(...instances: SimDataInstance[]) {
    instances.forEach(instance => instance.owner = this);
    this.instances.push(...instances);
    this.uncache();
  }

  /**
   * Removes instances from this SimData and uncaches the buffer.
   * 
   * @param instances Instances to remove
   */
  removeInstances(...instances: SimDataInstance[]) {
    if (removeFromArray(instances, this.instances)) this.uncache();
  }

  protected _serialize(): Buffer {
    return undefined; // TODO: impl
  }
}
