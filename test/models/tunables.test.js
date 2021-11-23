// const { expect } = require('chai');
// const { inspect } = require('util');
// const { TunableNodes, Hashing, StringTableResource } = require('../../../dst/api');
// const { parseXML } = require('../../../dst/lib/services/Parsing');

// const { I, M, T, E, V, L, U, S } = TunableNodes;

// describe('TunableNodes', function() {
//   describe('#nodeToString()', function() {
//     it('temporary test', function() {
//       const stbl = StringTableResource.create();
//       const S = TunableNodes.getStringFn(stbl);

//       const node = I({
//         c: "Trait",
//         i: "trait",
//         m: "traits.trait",
//         n: "frankk_TEST:trait_Example",
//         s: Hashing.fnv32("frankk_TEST:trait_Example"),
//         children: [
//           L({
//             name: "ages",
//             children: [
//               E({ value: "YOUNGADULT" }),
//               E({ value: "ADULT" }),
//               E({ value: "ELDER" })
//             ]
//           }),
//           T({
//             name: "display_name",
//             value: S("Trait Name")
//           }),
//           U({
//             name: "example_tuple",
//             children: [
//               V({
//                 name: "variant1",
//                 type: "disabled"
//               }),
//               V({
//                 name: "variant2",
//                 type: "enabled",
//                 child: T({
//                   name: "enabled",
//                   value: true
//                 })
//               })
//             ]
//           })
//         ]
//       });

//       const xml = TunableNodes.nodeToXML(node, { includeDeclaration: true });
//       console.log(xml);
//     });

//     it('temp test 2', function() {
//       const xml = `<?xml version="1.0" encoding="utf-8"?>
// <I c="Class" i="type" m="module.path" n="example_file" s="12345">
//   <L>
//     <U>
//       <T n="first">50</T>
//       <V n="third" t="disabled" />
//       <E n="enabled">ADULT</E>
//       <V n="fourth" t="enabled">
//         <T n="enabled">0x12345678<!--String--></T>
//       </V>
//     </U>
//     <U>
//       <T n="first">50</T>
//       <V n="third" t="disabled" />
//       <E n="enabled">ADULT</E>
//       <V n="fourth" t="enabled">
//         <T n="enabled">0x12345678<!--String--></T>
//       </V>
//     </U>
//   </L>
// </I>`;

//       const nodes = parseXML(xml);
//       console.log(inspect(nodes, {showHidden: false, depth: null, colors: true}));
//     })
//   });
// });
