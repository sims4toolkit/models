import fs from "fs";
import path from "path";
import util from 'util';
import { expect } from "chai";
import { simDataFragments, SimDataResource } from "../../../dst/api";

const cachedBuffers: { [key: string]: Buffer; } = {};

function getBuffer(filename: string) {
  if (cachedBuffers[filename]) {
    return cachedBuffers[filename];
  } else {
    const folder = filename.split('.')[1] === "xml" ? "xml" : "binary";
    const filepath = path.resolve(__dirname, `../../data/simdatas/${folder}/${filename}`);
    const buffer = fs.readFileSync(filepath);
    cachedBuffers[filename] = buffer;
    return buffer;
  }
}

function getSimDataFromBinary(filename: string) {
  return SimDataResource.from(getBuffer(`${filename}.simdata`));
}

function getSimDataFromXml(filename: string) {
  return SimDataResource.fromXml(getBuffer(`${filename}.xml`));
}

describe("SimDataResource", () => {
  //#region Properties

  describe("#buffer", () => {
    function testReserialization(filename: string) {
      const original = SimDataResource.fromXml(getBuffer(filename));
      original.uncache();
      const simdata = SimDataResource.from(original.buffer);
      expect(simdata.equals(original)).to.be.true;
    }

    it("should be the same as the buffer it was created with if no changes were made", () => {
      const buffer = getBuffer("buff.simdata");
      const simdata = SimDataResource.from(buffer);
      expect(simdata.buffer).to.equal(buffer);
    });

    it("should throw if the current model cannot be serialized", () => {
      const simdata = SimDataResource.create({
        instances: [
          new simDataFragments.SimDataInstance("", undefined, undefined)
        ]
      });

      expect(() => simdata.buffer).to.throw();
    });

    it("should reserialize all_data_types.xml correctly", () => {
      testReserialization("all_data_types.xml");
    });

    it("should reserialize buff.xml correctly", () => {
      testReserialization("buff.xml");
    });

    it("should reserialize mood.xml correctly", () => {
      testReserialization("mood.xml");
    });

    it("should reserialize trait.xml correctly", () => {
      testReserialization("trait.xml");
    });

    it("should reserialize two_instances.xml correctly", () => {
      testReserialization("two_instances.xml");
    });

    it("should reserialize variant_recursion.xml correctly", () => {
      testReserialization("variant_recursion.xml");
    });

    it("should reserialize vector_recursion.xml correctly", () => {
      testReserialization("vector_recursion.xml");
    });

    it("should reserialize correctly when intances reference different schema objects", () => {
      const original = getSimDataFromXml("buff");
      const originalSchema = original.schema;
      expect(original.instance.schema).to.equal(originalSchema);
      expect(original.instance.schema).to.equal(original.schema);
      original.schema = originalSchema.clone();
      expect(original.instance.schema).to.equal(originalSchema);
      expect(original.instance.schema).to.not.equal(original.schema);
      const simdata = SimDataResource.from(original.buffer);
      expect(simdata.equals(original)).to.be.true;
    });
  });

  describe("#hasChanged", () => {
    it("should be false after loading from a buffer", () => {
      const simdata = getSimDataFromBinary("buff");
      expect(simdata.hasChanged).to.be.false;
    });

    it("should be true after loading from xml", () => {
      const simdata = getSimDataFromXml("buff");
      expect(simdata.hasChanged).to.be.true;
    });

    it("should be true after creating", () => {
      const simdata = SimDataResource.create();
      expect(simdata.hasChanged).to.be.true;
    });

    it("should be false after getting buffer", () => {
      const simdata = getSimDataFromXml("buff");
      simdata.buffer;
      expect(simdata.hasChanged).to.be.false;
    });
  });

  describe("#instance", () => {
    it("should return the first child of the instances array when there is only one", () => {
      const simdata = getSimDataFromBinary("buff");
      expect(simdata.instance.name).to.equal("Buff_Memory_scared");
    });

    it("should return the first child of the instances array when there are two", () => {
      const simdata = getSimDataFromBinary("two_instances");
      expect(simdata.instance.name).to.equal("first_inst");
    });

    it("should be undefined when there are no instances in this simdata", () => {
      const simdata = SimDataResource.create();
      expect(simdata.instance).to.be.undefined;
    });

    it("should set the first child of the instances array", () => {
      const simdata = getSimDataFromBinary("two_instances");
      simdata.instance = simdata.instances[1];
      expect(simdata.instance.name).to.equal("second_inst");
    });

    it("should uncache the owner when set", () => {
      const simdata = getSimDataFromBinary("two_instances");
      expect(simdata.hasChanged).to.be.false;
      simdata.instance = simdata.instances[1];
      expect(simdata.hasChanged).to.be.true;
    });
  });

  describe("#instances", () => {
    it("should uncache the owner when pushed to", () => {
      const simdata = getSimDataFromBinary("buff");
      expect(simdata.hasChanged).to.be.false;
      simdata.instances.push(simdata.instance.clone());
      expect(simdata.hasChanged).to.be.true;
    });

    it("should uncache the owner when spliced", () => {
      const simdata = getSimDataFromBinary("two_instances");
      expect(simdata.hasChanged).to.be.false;
      simdata.instances.splice(1, 1);
      expect(simdata.hasChanged).to.be.true;
    });

    it("should uncache the owner when child is set", () => {
      const simdata = getSimDataFromBinary("two_instances");
      expect(simdata.hasChanged).to.be.false;
      simdata.instances[0] = simdata.instances[1];
      expect(simdata.hasChanged).to.be.true;
    });

    it("should uncache the owner when child is mutated", () => {
      const simdata = getSimDataFromBinary("buff");
      expect(simdata.hasChanged).to.be.false;
      simdata.instances[0].name = "Better_Name";
      expect(simdata.hasChanged).to.be.true;
    });

    it("should set the owner of a pushed child to this simdata", () => {
      const simdata = getSimDataFromBinary("buff");
      const newChild = simdata.instance.clone();
      expect(newChild.owner).to.be.undefined;
      simdata.instances.push(newChild);
      expect(newChild.owner).to.equal(simdata);
    });

    it("should set the owner of a set child to this simdata", () => {
      const simdata = getSimDataFromBinary("buff");
      const newChild = simdata.instance.clone();
      expect(newChild.owner).to.be.undefined;
      simdata.instances[0] = newChild;
      expect(newChild.owner).to.equal(simdata);
    });
  });

  describe("#props", () => {
    it("should return an object containing the cells in the first instance", () => {
      const simdata = getSimDataFromBinary("buff");
      const { audio_sting_on_add, buff_description, mood_type, mood_weight } = simdata.props;
      expect(audio_sting_on_add.asAny.type).equals(0xFD04E3BE);
      expect(audio_sting_on_add.asAny.group).equals(0x001407EC);
      expect(audio_sting_on_add.asAny.instance).equals(0x8AF8B916CF64C646n);
      expect(buff_description.asAny.value).equals(0x9D3FD52C);
      expect(mood_type.asAny.value).equals(251719n);
      expect(mood_weight.asAny.value).equals(1);
    });

    it("should mutate the first instance's cells", () => {
      const simdata = getSimDataFromBinary("buff");
      expect(simdata.props.mood_weight.asAny.value).equals(1);
      simdata.props.mood_weight.asAny.value = 2;
      expect(simdata.props.mood_weight.asAny.value).equals(2);
    });
  });
  
  describe("#schema", () => {
    it("should return the first child of the schemas array", () => {
      // TODO:
    });

    it("should set the first child of the schemas array", () => {
      // TODO:
    });

    it("should uncache the owner when set", () => {
      // TODO:
    });

    it("should mutate the first instance", () => {
      // TODO:
    });
  });

  describe("#schemas", () => {
    it("should uncache the owner when pushed to", () => {
      // TODO:
    });

    it("should uncache the owner when spliced", () => {
      // TODO:
    });

    it("should uncache the owner when sorted", () => {
      // TODO:
    });

    it("should uncache the owner when child is set", () => {
      // TODO:
    });

    it("should uncache the owner when child is mutated", () => {
      // TODO:
    });

    it("should set the owner of a pushed child to this simdata", () => {
      // TODO:
    });

    it("should set the owner of a set child to this simdata", () => {
      // TODO:
    });
  });

  describe("#unused", () => {
    it("should uncache when set", () => {
      const simdata = getSimDataFromBinary("buff");
      expect(simdata.hasChanged).to.be.false;
      simdata.unused = 0x12;
      expect(simdata.hasChanged).to.be.true;
    });
  });

  describe("#variant", () => {
    it("should be 'DATA'", () => {
      const simdata = getSimDataFromBinary("buff");
      expect(simdata.variant).to.equal("DATA");
    });
  });

  describe("#version", () => {
    it("should uncache when set", () => {
      const simdata = getSimDataFromBinary("buff");
      expect(simdata.hasChanged).to.be.false;
      simdata.version = 0x100;
      expect(simdata.hasChanged).to.be.true;
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("#clone()", () => {
    it("should copy all properties", () => {
      // TODO:
    });

    it("should not copy the owner", () => {
      // TODO:
    });

    it("should not mutate the original", () => {
      // TODO:
    });

    it("should not mutate the schemas of the original", () => {
      // TODO:
    });

    it("should not mutate the instances of the original", () => {
      // TODO:
    });

    it("should set self as owner of new schemas/instances", () => {
      // TODO:
    });
  });

  describe("static#create()", () => {
    it("should use all properties that are given", () => {
      // TODO:
    });

    it("should use a default version of 0x101", () => {
      // TODO:
    });

    it("should use a default unused value of 0", () => {
      // TODO:
    });

    it("should use an empty list as default for schemas", () => {
      // TODO:
    });

    it("should use an empty list as default for instances", () => {
      // TODO:
    });

    it("should set self as owner of new schemas/instances", () => {
      // TODO:
    });
  });

  describe("static#from()", () => {
    it("should read all_data_types.simdata correctly", () => {
      // TODO:
    });

    it("should read buff.simdata correctly", () => {
      // TODO:
    });

    it("should read mood.simdata correctly", () => {
      // TODO:
    });

    it("should read trait.simdata correctly", () => {
      // TODO:
    });

    it("should read two_instances.simdata correctly", () => {
      // TODO:
    });

    it("should read variant_recursion.simdata correctly", () => {
      // TODO:
    });

    it("should read vector_recursion.simdata correctly", () => {
      // TODO:
    });

    it("should set self as owner of new schemas/instances", () => {
      const simdata = getSimDataFromBinary("buff");

      simdata.schemas.forEach(schema => {
        expect(schema.owner).to.equal(simdata);
      });

      simdata.instances.forEach(inst => {
        expect(inst.owner).to.equal(simdata);
      });
    });
  });

  describe("static#fromXml()", () => {
    it("should work with an XML declaration", () => {
      // TODO:
    });

    it("should work without an XML declaration", () => {
      // TODO:
    });

    it("should read all_data_types.xml correctly", () => {
      // TODO:
    });

    it("should read buff.xml correctly", () => {
      // TODO:
    });

    it("should read mood.xml correctly", () => {
      // TODO:
    });

    it("should read trait.xml correctly", () => {
      // TODO:
    });

    it("should read two_instances.xml correctly", () => {
      // TODO:
    });

    it("should read variant_recursion.xml correctly", () => {
      // TODO:
    });

    it("should read vector_recursion.xml correctly", () => {
      // TODO:
    });

    it("should set self as owner of new schemas/instances", () => {
      // TODO:
    });
  });

  describe("static#fromXmlDocument()", () => {
    // fromXml() uses this function for everything but parsing the string as an
    // XML document, so tests for it are tests for this
  });

  //#endregion Initialization

  //#region Methods

  describe("#equals()", () => {
    // TODO:
  });

  describe("#removeInstances()", () => {
    it("should remove the one instance that is given", () => {
      // TODO:
    });

    it("should remove the multiple instances that are given", () => {
      // TODO:
    });

    it("should not remove an identical instance that is not the same object", () => {
      // TODO:
    });

    it("should uncache the owner", () => {
      // TODO:
    });
  });

  describe("#removeSchemas()", () => {
    it("should remove the one schema that is given", () => {
      // TODO:
    });

    it("should remove the multiple schemas that are given", () => {
      // TODO:
    });

    it("should not remove an identical schema that is not the same object", () => {
      // TODO:
    });

    it("should uncache the owner", () => {
      // TODO:
    });
  });

  describe("#toXmlDocument()", () => {
    it("should have an XML declaration", () => {
      // TODO:
    });

    it("should have a 'SimData' tag with 'version' and 'u' attributes", () => {
      // TODO:
    });

    it("should have an 'Instances' section with all instances written correctly", () => {
      // TODO:
    });

    it("should have a 'Schemas' section with all schemas written correctly", () => {
      // TODO:
    });
  });

  describe("#uncache()", () => {
    it("should reset the buffer", () => {
      // TODO:
    });

    it("should uncache the owner", () => {
      // TODO:
    });
  });

  //#endregion Methods
});
