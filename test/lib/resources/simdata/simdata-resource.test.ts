import fs from "fs";
import path from "path";
import { expect } from "chai";
import { SimDataResource } from "../../../../dst/models";
import { SimDataType, SimDataSchema, SimDataInstance, cells } from "../../../../dst/simdata";
import MockOwner from "../../../mocks/mock-owner";
import { EncodingType } from "../../../../dst/enums";

//#region Helpers

const cachedBuffers: { [key: string]: Buffer; } = {};
function getBuffer(filename: string) {
  if (cachedBuffers[filename]) {
    return cachedBuffers[filename];
  } else {
    const folder = filename.split('.')[1] === "xml" ? "xml" : "binary";
    const filepath = path.resolve(__dirname, `../../../data/simdatas/${folder}/${filename}`);
    const buffer = fs.readFileSync(filepath);
    cachedBuffers[filename] = buffer;
    return buffer;
  }
}

function getSimDataFromBinary(filename: string, saveBuffer = false) {
  return SimDataResource.from(getBuffer(`${filename}.simdata`), { saveBuffer });
}

function getSimDataFromXml(filename: string, saveBuffer = false) {
  return SimDataResource.fromXml(getBuffer(`${filename}.xml`), { saveBuffer });
}

interface SimDataTestArgs {
  filename: string;
  unused: number;
  numInstances: number;
  instanceName: string;
  numSchemas: number;
  schemaName: string;
  schemaHash: number;
  numColumns: number;
  firstColumnName: string;
  cellTest(cell: cells.Cell): void;
  firstColumnType: SimDataType;
}

function testSimData(simdata: SimDataResource, args: SimDataTestArgs) {
  // header
  expect(simdata.version).to.equal(0x101);
  expect(simdata.unused).to.equal(args.unused);

  // instances
  expect(simdata.instances).to.have.lengthOf(args.numInstances);
  expect(simdata.instance.name).to.equal(args.instanceName);
  expect(simdata.instance.schema.name).to.equal(args.schemaName);
  expect(simdata.instance.rowLength).to.equal(args.numColumns);
  args.cellTest(simdata.instance.row[args.firstColumnName]);

  // schemas
  expect(simdata.schemas).to.have.lengthOf(args.numSchemas);
  expect(simdata.schema.name).to.equal(args.schemaName);
  expect(simdata.schema.hash).to.equal(args.schemaHash);
  expect(simdata.schema.columns).to.have.lengthOf(args.numColumns);
  const column = simdata.schema.columns.find(column => {
    return column.name === args.firstColumnName;
  });
  expect(column).to.not.be.undefined;
  expect(column.type).to.equal(args.firstColumnType);
  expect(column.flags).to.equal(0);
}

//#endregion Helpers

describe("SimDataResource", () => {
  //#region Properties

  describe("#buffer", () => {
    function testReserialization(filename: string) {
      const original = SimDataResource.fromXml(getBuffer(filename));
      original.onChange();
      const simdata = SimDataResource.from(original.buffer);
      expect(simdata.equals(original)).to.be.true;
    }

    it("should be the same as the original buffer if saveBuffer = true", () => {
      const buffer = getBuffer("buff.simdata");
      const simdata = SimDataResource.from(buffer, { saveBuffer: true });
      expect(simdata.buffer).to.equal(buffer);
    });

    it("should not be the same as the original buffer if saveBuffer = false", () => {
      const buffer = getBuffer("buff.simdata");
      const simdata = SimDataResource.from(buffer, { saveBuffer: false });
      expect(simdata.buffer).to.not.equal(buffer);
    });

    it("should not be the same as the original buffer by default", () => {
      const buffer = getBuffer("buff.simdata");
      const simdata = SimDataResource.from(buffer);
      expect(simdata.buffer).to.not.equal(buffer);
    });

    it("should throw if the current model cannot be serialized", () => {
      const simdata = SimDataResource.create({
        instances: [
          new SimDataInstance("", undefined, undefined)
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
      const simdata = getSimDataFromBinary("two_instances", true);
      expect(simdata.isCached).to.be.true;
      simdata.instance = simdata.instances[1];
      expect(simdata.isCached).to.be.false;
    });
  });

  describe("#instances", () => {
    it("should uncache the owner when pushed to", () => {
      const simdata = getSimDataFromBinary("buff", true);
      expect(simdata.isCached).to.be.true;
      simdata.instances.push(simdata.instance.clone());
      expect(simdata.isCached).to.be.false;
    });

    it("should uncache the owner when spliced", () => {
      const simdata = getSimDataFromBinary("two_instances", true);
      expect(simdata.isCached).to.be.true;
      simdata.instances.splice(1, 1);
      expect(simdata.isCached).to.be.false;
    });

    it("should uncache the owner when child is set", () => {
      const simdata = getSimDataFromBinary("two_instances", true);
      expect(simdata.isCached).to.be.true;
      simdata.instances[0] = simdata.instances[1];
      expect(simdata.isCached).to.be.false;
    });

    it("should uncache the owner when child is mutated", () => {
      const simdata = getSimDataFromBinary("buff", true);
      expect(simdata.isCached).to.be.true;
      simdata.instances[0].name = "Better_Name";
      expect(simdata.isCached).to.be.false;
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
      const simdata = getSimDataFromBinary("mood");
      expect(simdata.schema.name).to.equal("Mood");
      expect(simdata.schema.hash).to.equal(0xBF8FFCF2);
      expect(simdata.schema.columns).to.have.lengthOf(24);
    });

    it("should set the first child of the schemas array", () => {
      const simdata = getSimDataFromBinary("mood");
      simdata.schema = simdata.schemas[1];
      expect(simdata.schema.name).to.equal("TunableColorRGBA");
    });

    it("should uncache the owner when set", () => {
      const simdata = getSimDataFromBinary("mood", true);
      expect(simdata.isCached).to.be.true;
      simdata.schema = simdata.schemas[1];
      expect(simdata.isCached).to.be.false;
    });

    it("should mutate the first schema", () => {
      const simdata = getSimDataFromBinary("mood");
      expect(simdata.schemas[0].name).to.equal("Mood");
      simdata.schema.name = "NewName";
      expect(simdata.schemas[0].name).to.equal("NewName");
    });
  });

  describe("#schemas", () => {
    it("should uncache the owner when pushed to", () => {
      const simdata = getSimDataFromBinary("buff", true);
      expect(simdata.isCached).to.be.true;
      simdata.schemas.push(simdata.schema.clone());
      expect(simdata.isCached).to.be.false;
    });

    it("should uncache the owner when spliced", () => {
      const simdata = getSimDataFromBinary("buff", true);
      expect(simdata.isCached).to.be.true;
      simdata.schemas.splice(0, 1);
      expect(simdata.isCached).to.be.false;
    });

    it("should uncache the owner when child is set", () => {
      const simdata = getSimDataFromBinary("buff", true);
      expect(simdata.isCached).to.be.true;
      simdata.schemas[0] = simdata.schema.clone();
      expect(simdata.isCached).to.be.false;
    });

    it("should uncache the owner when child is mutated", () => {
      const simdata = getSimDataFromBinary("buff", true);
      expect(simdata.isCached).to.be.true;
      simdata.schemas[0].name = "NewName";
      expect(simdata.isCached).to.be.false;
    });

    it("should set the owner of a pushed child to this simdata", () => {
      const simdata = getSimDataFromBinary("buff");
      const child = simdata.schema.clone();
      expect(child.owner).to.be.undefined;
      simdata.schemas.push(child);
      expect(child.owner).to.equal(simdata);
    });

    it("should set the owner of a set child to this simdata", () => {
      const simdata = getSimDataFromBinary("buff");
      const child = simdata.schema.clone();
      expect(child.owner).to.be.undefined;
      simdata.schemas[0] = child;
      expect(child.owner).to.equal(simdata);
    });
  });

  describe("#unused", () => {
    it("should uncache when set", () => {
      const simdata = getSimDataFromBinary("buff", true);
      expect(simdata.isCached).to.be.true;
      simdata.unused = 0x12;
      expect(simdata.isCached).to.be.false;
    });
  });

  describe("#encodingType", () => {
    it("should be 'DATA'", () => {
      const simdata = getSimDataFromBinary("buff");
      expect(simdata.encodingType).to.equal(EncodingType.DATA);
    });
  });

  describe("#version", () => {
    it("should uncache when set", () => {
      const simdata = getSimDataFromBinary("buff", true);
      expect(simdata.isCached).to.be.true;
      simdata.version = 0x100;
      expect(simdata.isCached).to.be.false;
    });
  });

  //#endregion Properties

  //#region Initialization

  describe("#clone()", () => {
    it("should copy all properties", () => {
      const simdata = getSimDataFromBinary("buff");
      const clone = simdata.clone();
      expect(simdata).to.not.equal(clone);
      expect(simdata.equals(clone)).to.be.true;
    });

    it("should not copy the owner", () => {
      const owner = new MockOwner();
      const simdata = getSimDataFromBinary("buff");
      simdata.owner = owner;
      const clone = simdata.clone();
      expect(simdata.owner).to.equal(owner);
      expect(clone.owner).to.be.undefined;
    });

    it("should not mutate the original", () => {
      const simdata = getSimDataFromBinary("buff");
      const clone = simdata.clone();
      clone.unused = 0x12;
      expect(simdata.unused).to.equal(0);
    });

    it("should not mutate the schemas of the original", () => {
      const simdata = getSimDataFromBinary("buff");
      const clone = simdata.clone();
      clone.schema.name = "NewName";
      expect(clone.schema.name).to.equal("NewName");
      expect(simdata.schema.name).to.equal("Buff");
    });

    it("should not mutate the instances of the original", () => {
      const simdata = getSimDataFromBinary("buff");
      const clone = simdata.clone();
      clone.instance.name = "NewName";
      expect(clone.instance.name).to.equal("NewName");
      expect(simdata.instance.name).to.equal("Buff_Memory_scared");
    });

    it("should set self as owner of new schemas/instances", () => {
      const simdata = getSimDataFromBinary("buff");
      const clone = simdata.clone();

      clone.schemas.forEach(schema => {
        expect(schema.owner).to.equal(clone);
      });

      clone.instances.forEach(inst => {
        expect(inst.owner).to.equal(clone);
      });
    });
  });

  describe("static#create()", () => {
    it("should use all properties that are given", () => {
      const schema = new SimDataSchema("Shema", 0, []);
      const instance = new SimDataInstance("", schema, {});

      const simdata = SimDataResource.create({
        version: 0x102,
        unused: 0x1A,
        schemas: [ schema ],
        instances: [ instance ]
      });

      expect(simdata.version).to.equal(0x102);
      expect(simdata.unused).to.equal(0x1A);
      expect(simdata.schema).to.equal(schema);
      expect(simdata.instance).to.equal(instance);
    });

    it("should use a default version of 0x101", () => {
      const simdata = SimDataResource.create();
      expect(simdata.version).to.equal(0x101);
    });

    it("should use a default unused value of 0", () => {
      const simdata = SimDataResource.create();
      expect(simdata.unused).to.equal(0);
    });

    it("should use an empty list as default for schemas", () => {
      const simdata = SimDataResource.create();
      expect(simdata.schemas).to.be.an('Array').that.is.empty;
    });

    it("should use an empty list as default for instances", () => {
      const simdata = SimDataResource.create();
      expect(simdata.instances).to.be.an('Array').that.is.empty;
    });

    it("should set self as owner of new schemas/instances", () => {
      const schema = new SimDataSchema("Shema", 0, []);
      const instance = new SimDataInstance("", schema, {});

      expect(schema.owner).to.be.undefined;
      expect(instance.owner).to.be.undefined;

      const simdata = SimDataResource.create({
        schemas: [ schema ],
        instances: [ instance ]
      });

      expect(schema.owner).to.equal(simdata);
      expect(instance.owner).to.equal(simdata);
    });

    it("should not cache the buffer by default", () => {
      const original = getSimDataFromBinary("buff");
      const simdata = SimDataResource.create({
        schemas: original.schemas,
        instances: original.instances
      });

      expect(simdata.isCached).to.be.false;
      simdata.buffer;
      expect(simdata.isCached).to.be.false;
    });

    it("should not cache the buffer if saveBuffer = false", () => {
      const original = getSimDataFromBinary("buff");
      const simdata = SimDataResource.create({
        schemas: original.schemas,
        instances: original.instances,
        saveBuffer: false
      });

      expect(simdata.isCached).to.be.false;
      simdata.buffer;
      expect(simdata.isCached).to.be.false;
    });

    it("should cache the buffer if saveBuffer = true", () => {
      const original = getSimDataFromBinary("buff");
      const simdata = SimDataResource.create({
        schemas: original.schemas,
        instances: original.instances,
        saveBuffer: true
      });

      expect(simdata.isCached).to.be.false;
      simdata.buffer;
      expect(simdata.isCached).to.be.true;
    });
  });

  describe("static#from()", () => {
    function testBinarySimData(args: SimDataTestArgs) {
      const simdata = SimDataResource.from(getBuffer(`${args.filename}.simdata`));
      testSimData(simdata, args);
    }

    it("should read all_data_types.simdata correctly", () => {
      testBinarySimData({
        filename: "all_data_types",
        unused: 0x1A,
        numInstances: 1,
        instanceName: "all_data_types",
        numSchemas: 2,
        schemaName: "AllDataTypes",
        schemaHash: 0xA9DE97E9,
        numColumns: 14,
        firstColumnName: "float",
        firstColumnType: SimDataType.Float,
        cellTest(cell: cells.NumberCell) {
          expect(cell.value).to.be.approximately(1.5, 0.0001);
        }
      });
    });

    it("should read buff.simdata correctly", () => {
      testBinarySimData({
        filename: "buff",
        unused: 0,
        numInstances: 1,
        instanceName: "Buff_Memory_scared",
        numSchemas: 1,
        schemaName: "Buff",
        schemaHash: 0x0D045687,
        numColumns: 10,
        firstColumnName: "audio_sting_on_add",
        firstColumnType: SimDataType.ResourceKey,
        cellTest(cell: cells.ResourceKeyCell) {
          expect(cell.type).to.equal(0xFD04E3BE);
          expect(cell.group).to.equal(0x001407EC);
          expect(cell.instance).to.equal(0x8AF8B916CF64C646n);
        }
      });
    });

    it("should read mood.simdata correctly", () => {
      testBinarySimData({
        filename: "mood",
        unused: 0,
        numInstances: 1,
        instanceName: "Mood_Playful",
        numSchemas: 6,
        schemaName: "Mood",
        schemaHash: 0xBF8FFCF2,
        numColumns: 24,
        firstColumnName: "base_color",
        firstColumnType: SimDataType.Object,
        cellTest(cell: cells.ObjectCell) {
          expect(cell.rowLength).to.equal(4);
          expect(cell.schema.name).to.equal("TunableColorRGBA");
          expect(cell.row.a.asAny.value).to.equal(255);
          expect(cell.row.b.asAny.value).to.equal(234);
          expect(cell.row.g.asAny.value).to.equal(81);
          expect(cell.row.r.asAny.value).to.equal(240);
        }
      });
    });

    it("should read trait.simdata correctly", () => {
      testBinarySimData({
        filename: "trait",
        unused: 0,
        numInstances: 1,
        instanceName: "trait_HotHeaded",
        numSchemas: 1,
        schemaName: "Trait",
        schemaHash: 0xDE2EAF66,
        numColumns: 17,
        firstColumnName: "ages",
        firstColumnType: SimDataType.Vector,
        cellTest(cell: cells.VectorCell) {
          expect(cell.length).to.equal(5);
          expect(cell.children[0].asAny.value).to.equal(8n);
        }
      });
    });

    it("should read two_instances.simdata correctly", () => {
      testBinarySimData({
        filename: "two_instances",
        unused: 0,
        numInstances: 2,
        instanceName: "first_inst",
        numSchemas: 2,
        schemaName: "FirstSchema",
        schemaHash: 0x0D045687,
        numColumns: 1,
        firstColumnName: "number",
        firstColumnType: SimDataType.UInt32,
        cellTest(cell: cells.NumberCell) {
          expect(cell.value).to.equal(5);
        }
      });
    });

    it("should read variant_recursion.simdata correctly", () => {
      testBinarySimData({
        filename: "variant_recursion",
        unused: 0,
        numInstances: 1,
        instanceName: "variant_recursion",
        numSchemas: 2,
        schemaName: "VariantRecursion",
        schemaHash: 0x3EE1E34C,
        numColumns: 3,
        firstColumnName: "vector_variant",
        firstColumnType: SimDataType.Variant,
        cellTest(cell: cells.VariantCell) {
          expect(cell.childType).to.equal(SimDataType.Vector);
          expect(cell.child.asAny.children).to.have.lengthOf(2);
          expect(cell.child.asAny.children[0].asAny.value).to.equal(32);
          expect(cell.child.asAny.children[1].asAny.value).to.equal(64);
        }
      });
    });

    it("should read vector_recursion.simdata correctly", () => {
      testBinarySimData({
        filename: "vector_recursion",
        unused: 0,
        numInstances: 1,
        instanceName: "vector_recursion",
        numSchemas: 2,
        schemaName: "VectorRecursion",
        schemaHash: 0x3EE1E34C,
        numColumns: 3,
        firstColumnName: "vector_vector",
        firstColumnType: SimDataType.Vector,
        cellTest(cell: cells.VectorCell) {
          expect(cell.childType).to.equal(SimDataType.Vector);
          expect(cell.children).to.have.lengthOf(2);
          expect(cell.children[0].asAny.children[0].value).to.equal(32);
          expect(cell.children[0].asAny.children[1].value).to.equal(64);
        }
      });
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

    it("should not cache the buffer by default", () => {
      const simdata = SimDataResource.from(getBuffer("buff.simdata"));
      expect(simdata.isCached).to.be.false;
    });

    it("should not cache the buffer if saveBuffer = false", () => {
      const simdata = SimDataResource.from(getBuffer("buff.simdata"), { saveBuffer: false });
      expect(simdata.isCached).to.be.false;
    });

    it("should cache the buffer if saveBuffer = true", () => {
      const simdata = SimDataResource.from(getBuffer("buff.simdata"), { saveBuffer: true });
      expect(simdata.isCached).to.be.true;
    });
  });

  describe("static#fromXml()", () => {
    function testXmlSimData(args: SimDataTestArgs) {
      const simdata = SimDataResource.fromXml(getBuffer(`${args.filename}.xml`));
      testSimData(simdata, args);
    }

    it("should read all_data_types.simdata correctly", () => {
      testXmlSimData({
        filename: "all_data_types",
        unused: 0x1A,
        numInstances: 1,
        instanceName: "all_data_types",
        numSchemas: 2,
        schemaName: "AllDataTypes",
        schemaHash: 0xA9DE97E9,
        numColumns: 14,
        firstColumnName: "float",
        firstColumnType: SimDataType.Float,
        cellTest(cell: cells.NumberCell) {
          expect(cell.value).to.be.approximately(1.5, 0.0001);
        }
      });
    });

    it("should read buff.simdata correctly", () => {
      testXmlSimData({
        filename: "buff",
        unused: 0,
        numInstances: 1,
        instanceName: "Buff_Memory_scared",
        numSchemas: 1,
        schemaName: "Buff",
        schemaHash: 0x0D045687,
        numColumns: 10,
        firstColumnName: "audio_sting_on_add",
        firstColumnType: SimDataType.ResourceKey,
        cellTest(cell: cells.ResourceKeyCell) {
          expect(cell.type).to.equal(0xFD04E3BE);
          expect(cell.group).to.equal(0x001407EC);
          expect(cell.instance).to.equal(0x8AF8B916CF64C646n);
        }
      });
    });

    it("should read mood.simdata correctly", () => {
      testXmlSimData({
        filename: "mood",
        unused: 0,
        numInstances: 1,
        instanceName: "Mood_Playful",
        numSchemas: 6,
        schemaName: "Mood",
        schemaHash: 0xBF8FFCF2,
        numColumns: 24,
        firstColumnName: "base_color",
        firstColumnType: SimDataType.Object,
        cellTest(cell: cells.ObjectCell) {
          expect(cell.rowLength).to.equal(4);
          expect(cell.schema.name).to.equal("TunableColorRGBA");
          expect(cell.row.a.asAny.value).to.equal(255);
          expect(cell.row.b.asAny.value).to.equal(234);
          expect(cell.row.g.asAny.value).to.equal(81);
          expect(cell.row.r.asAny.value).to.equal(240);
        }
      });
    });

    it("should read trait.simdata correctly", () => {
      testXmlSimData({
        filename: "trait",
        unused: 0,
        numInstances: 1,
        instanceName: "trait_HotHeaded",
        numSchemas: 1,
        schemaName: "Trait",
        schemaHash: 0xDE2EAF66,
        numColumns: 17,
        firstColumnName: "ages",
        firstColumnType: SimDataType.Vector,
        cellTest(cell: cells.VectorCell) {
          expect(cell.length).to.equal(5);
          expect(cell.children[0].asAny.value).to.equal(8n);
        }
      });
    });

    it("should read two_instances.simdata correctly", () => {
      testXmlSimData({
        filename: "two_instances",
        unused: 0,
        numInstances: 2,
        instanceName: "first_inst",
        numSchemas: 2,
        schemaName: "FirstSchema",
        schemaHash: 0x0D045687,
        numColumns: 1,
        firstColumnName: "number",
        firstColumnType: SimDataType.UInt32,
        cellTest(cell: cells.NumberCell) {
          expect(cell.value).to.equal(5);
        }
      });
    });

    it("should read variant_recursion.simdata correctly", () => {
      testXmlSimData({
        filename: "variant_recursion",
        unused: 0,
        numInstances: 1,
        instanceName: "variant_recursion",
        numSchemas: 2,
        schemaName: "VariantRecursion",
        schemaHash: 0x3EE1E34C,
        numColumns: 3,
        firstColumnName: "vector_variant",
        firstColumnType: SimDataType.Variant,
        cellTest(cell: cells.VariantCell) {
          expect(cell.childType).to.equal(SimDataType.Vector);
          expect(cell.child.asAny.children).to.have.lengthOf(2);
          expect(cell.child.asAny.children[0].asAny.value).to.equal(32);
          expect(cell.child.asAny.children[1].asAny.value).to.equal(64);
        }
      });
    });

    it("should read vector_recursion.simdata correctly", () => {
      testXmlSimData({
        filename: "vector_recursion",
        unused: 0,
        numInstances: 1,
        instanceName: "vector_recursion",
        numSchemas: 2,
        schemaName: "VectorRecursion",
        schemaHash: 0x3EE1E34C,
        numColumns: 3,
        firstColumnName: "vector_vector",
        firstColumnType: SimDataType.Vector,
        cellTest(cell: cells.VectorCell) {
          expect(cell.childType).to.equal(SimDataType.Vector);
          expect(cell.children).to.have.lengthOf(2);
          expect(cell.children[0].asAny.children[0].value).to.equal(32);
          expect(cell.children[0].asAny.children[1].value).to.equal(64);
        }
      });
    });

    it("should set self as owner of new schemas/instances", () => {
      const simdata = getSimDataFromXml("buff");

      simdata.schemas.forEach(schema => {
        expect(schema.owner).to.equal(simdata);
      });

      simdata.instances.forEach(inst => {
        expect(inst.owner).to.equal(simdata);
      });
    });

    it("should not cache the buffer by default", () => {
      const simdata = SimDataResource.fromXml(getBuffer("buff.xml"));
      expect(simdata.isCached).to.be.false;
      simdata.buffer;
      expect(simdata.isCached).to.be.false;
    });

    it("should not cache the buffer if saveBuffer = false", () => {
      const simdata = SimDataResource.fromXml(getBuffer("buff.xml"), { saveBuffer: false });
      expect(simdata.isCached).to.be.false;
      simdata.buffer;
      expect(simdata.isCached).to.be.false;
    });

    it("should cache the buffer if saveBuffer = true", () => {
      const simdata = SimDataResource.fromXml(getBuffer("buff.xml"), { saveBuffer: true });
      expect(simdata.isCached).to.be.false;
      simdata.buffer;
      expect(simdata.isCached).to.be.true;
    });
  });

  describe("static#fromXmlDocument()", () => {
    // fromXml() uses this function for everything but parsing the string as an
    // XML document, so tests for it are tests for this
  });

  //#endregion Initialization

  //#region Methods

  describe("#equals()", () => {
    it("should return true if the simdatas are the same", () => {
      const simdata = getSimDataFromBinary("buff");
      const other = simdata.clone();
      expect(simdata.equals(other)).to.be.true;
    });

    it("should return false if the version is different", () => {
      const simdata = getSimDataFromBinary("buff");
      const other = simdata.clone();
      other.version = 0x102;
      expect(simdata.equals(other)).to.be.false;
    });

    it("should return false if the unused is different", () => {
      const simdata = getSimDataFromBinary("buff");
      const other = simdata.clone();
      other.unused = 0x1A;
      expect(simdata.equals(other)).to.be.false;
    });

    it("should return false if the instances are different", () => {
      const simdata = getSimDataFromBinary("buff");
      const other = simdata.clone();
      other.instances.push(other.instance.clone());
      expect(simdata.equals(other)).to.be.false;
    });

    it("should return false if the schemas are different", () => {
      const simdata = getSimDataFromBinary("buff");
      const other = simdata.clone();
      other.schema.name = "NewName";
      expect(simdata.equals(other)).to.be.false;
    });

    it("should return false if the other is undefined", () => {
      const simdata = getSimDataFromBinary("buff");
      expect(simdata.equals(undefined)).to.be.false;
    });
  });

  describe("#isXml()", () => {
    it("should return false", () => {
      const simdata = SimDataResource.create();
      expect(simdata.isXml()).to.be.false;
    });
  });

  describe("#removeInstances()", () => {
    it("should remove the one instance that is given", () => {
      const simdata = getSimDataFromBinary("two_instances");
      expect(simdata.instances).to.have.lengthOf(2);
      simdata.removeInstances(simdata.instance);
      expect(simdata.instances).to.have.lengthOf(1);
    });

    it("should remove the multiple instances that are given", () => {
      const simdata = getSimDataFromBinary("two_instances");
      expect(simdata.instances).to.have.lengthOf(2);
      simdata.removeInstances(simdata.instances[0], simdata.instances[1]);
      expect(simdata.instances).to.be.empty;
    });

    it("should not remove an identical instance that is not the same object", () => {
      const simdata = getSimDataFromBinary("two_instances");
      expect(simdata.instances).to.have.lengthOf(2);
      simdata.removeInstances(simdata.instance.clone());
      expect(simdata.instances).to.have.lengthOf(2);
    });

    it("should uncache the buffer", () => {
      const simdata = getSimDataFromBinary("two_instances", true);
      expect(simdata.isCached).to.be.true;
      simdata.removeInstances(simdata.instance);
      expect(simdata.isCached).to.be.false;
    });
  });

  describe("#removeSchemas()", () => {
    it("should remove the one schema that is given", () => {
      const simdata = getSimDataFromBinary("mood");
      expect(simdata.schemas).to.have.lengthOf(6);
      simdata.removeSchemas(simdata.schema);
      expect(simdata.schemas).to.have.lengthOf(5);
    });

    it("should remove the multiple schemas that are given", () => {
      const simdata = getSimDataFromBinary("mood");
      expect(simdata.schemas).to.have.lengthOf(6);
      simdata.removeSchemas(simdata.schemas[0], simdata.schemas[1]);
      expect(simdata.schemas).to.have.lengthOf(4);
    });

    it("should not remove an identical schema that is not the same object", () => {
      const simdata = getSimDataFromBinary("mood");
      expect(simdata.schemas).to.have.lengthOf(6);
      simdata.removeSchemas(simdata.schema.clone());
      expect(simdata.schemas).to.have.lengthOf(6);
    });

    it("should uncache the owner", () => {
      const simdata = getSimDataFromBinary("mood", true);
      expect(simdata.isCached).to.be.true;
      simdata.removeSchemas(simdata.schema);
      expect(simdata.isCached).to.be.false;
    });
  });

  describe("#toXmlDocument()", () => {
    it("should have a 'SimData' tag with 'version' and 'u' attributes", () => {
      const simdata = getSimDataFromBinary("buff");
      const doc = simdata.toXmlDocument();
      expect(doc.child.tag).to.equal("SimData");
      expect(doc.child.attributes.version).to.equal("0x00000101");
      expect(doc.child.attributes.u).to.equal("0x00000000");
    });

    it("should have an 'Instances' section with all instances written correctly", () => {
      const simdata = getSimDataFromBinary("buff");
      const doc = simdata.toXmlDocument({ sort: true });
      const instances = doc.child.children.find(node => node.tag === "Instances");
      expect(instances.numChildren).to.equal(1);
      expect(instances.child.tag).to.equal("I");
      expect(instances.child.attributes.name).to.equal("Buff_Memory_scared");
      expect(instances.child.numChildren).to.equal(10);
      expect(instances.child.child.innerValue).to.equal("FD04E3BE-001407EC-8AF8B916CF64C646");
    });

    it("should have a 'Schemas' section with all schemas written correctly", () => {
      const simdata = getSimDataFromBinary("mood");
      const doc = simdata.toXmlDocument({ sort: true });
      const schemas = doc.child.children.find(node => node.tag === "Schemas");
      expect(schemas.numChildren).to.equal(6);
      expect(schemas.child.tag).to.equal("Schema");
      expect(schemas.child.child.tag).to.equal("Columns");
      expect(schemas.child.child.numChildren).to.equal(24);
      expect(schemas.child.child.child.attributes.name).to.equal("audio_stings_on_add");
    });
  });

  describe("#onChange()", () => {
    it("should reset the buffer when saveBuffer = true", () => {
      const simdata = getSimDataFromBinary("buff", true);
      expect(simdata.isCached).to.be.true;
      simdata.onChange();
      expect(simdata.isCached).to.be.false;
    });

    it("should not have any effect when saveBuffer = false", () => {
      const simdata = getSimDataFromBinary("buff", false);
      expect(simdata.isCached).to.be.false;
      simdata.onChange();
      expect(simdata.isCached).to.be.false;
    });

    it("should uncache the owner when saveBuffer = true", () => {
      const owner = new MockOwner();
      const simdata = getSimDataFromBinary("buff", true);
      simdata.owner = owner;
      expect(owner.cached).to.be.true;
      simdata.onChange();
      expect(owner.cached).to.be.false;
    });

    it("should uncache the owner when saveBuffer = false", () => {
      const owner = new MockOwner();
      const simdata = getSimDataFromBinary("buff", false);
      simdata.owner = owner;
      expect(owner.cached).to.be.true;
      simdata.onChange();
      expect(owner.cached).to.be.false;
    });
  });

  //#endregion Methods
});
