import { expect } from "chai";
import { simDataFragments, simDataTypes } from "../../../dst/api";

const { SimDataSchema, SimDataSchemaColumn, SimDataInstance } = simDataFragments;
const { SimDataType } = simDataTypes;

describe("SimDataSchema", () => {
  describe("#owner", () => {
    // TODO:
  });

  describe("#columns", () => {
    // TODO:
  });

  describe("#hash", () => {
    // TODO:
  });

  describe("#name", () => {
    // TODO:
  });

  describe("#constructor", () => {
    // TODO:
  });

  describe("#addColumnClones()", () => {
    // TODO:
  });

  describe("#clone()", () => {
    // TODO:
  });

  describe("#removeColumns()", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });
});

describe("SimDataSchemaColumn", () => {
  describe("#owner", () => {
    // TODO:
  });

  describe("#flags", () => {
    // TODO:
  });

  describe("#name", () => {
    // TODO:
  });

  describe("#type", () => {
    // TODO:
  });

  describe("#clone()", () => {
    // TODO:
  });

  describe("#removeColumns()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });
});

describe("SimDataInstance", () => {
  describe("#owner", () => {
    // TODO:
  });

  describe("#name", () => {
    // TODO:
  });

  describe("#clone", () => {
    // TODO:
  });

  describe("#toXmlNode()", () => {
    // TODO:
  });

  describe("static#fromObjectCell()", () => {
    // TODO:
  });

  describe("static#fromXmlNode()", () => {
    // TODO:
  });
});
