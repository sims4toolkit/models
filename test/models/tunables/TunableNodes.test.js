const { expect } = require('chai');
const { TunableNodes, Hashing, StringTableResource } = require('../../../dst/api');

const { I, M, T, E, V, L, U, S } = TunableNodes;

describe('TunableNodes', function() {
  describe('#nodeToString()', function() {
    it('temporary test', function() {
      const stbl = StringTableResource.create();
      const S = TunableNodes.getStringFn(stbl);

      const node = I({
        c: "Trait",
        i: "trait",
        m: "traits.trait",
        n: "frankk_TEST:trait_Example",
        s: Hashing.fnv32("frankk_TEST:trait_Example"),
        children: [
          L({
            name: "ages",
            children: [
              E({ value: "YOUNGADULT" }),
              E({ value: "ADULT" }),
              E({ value: "ELDER" })
            ]
          }),
          T({
            name: "display_name",
            value: S("Trait Name")
          }),
          U({
            name: "example_tuple",
            children: [
              V({
                name: "variant1",
                type: "disabled"
              }),
              V({
                name: "variant2",
                type: "enabled",
                child: T({
                  name: "enabled",
                  value: true
                })
              })
            ]
          })
        ]
      });

      const xml = TunableNodes.nodeToXML(node);
      console.log(xml);
    });
  });
});
