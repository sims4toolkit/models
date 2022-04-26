import ApiModel from "../../dst/lib/base/api-model";
import WritableModel, { WritableModelCreationOptions } from "../../dst/lib/base/writable-model";

/**
 * A bare-bones implementation of WritableModel to test the shared functionality
 * provided by the abstract class. If other classes that extend WritableModel
 * override any of its implemented methods, that method should be tested again.
 */
export default class MockWritableModel extends WritableModel {
  constructor(public content: string = "", options?: WritableModelCreationOptions) {
    super(options);
    this._watchProps("content");
  }

  protected _serialize(): Buffer {
    return Buffer.from(this.content);
  }

  clone(): ApiModel {
    throw new Error("Method not implemented.");
  }

  equals(other: any): boolean {
    throw new Error("Method not implemented.");
  }
}
