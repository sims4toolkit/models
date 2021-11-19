const expect = require('chai').expect;
const { BinaryEncoder, BinaryDecoder } = require('../../dst/lib/utils/encoding');

describe('BinaryDecoder', function() {
  const getDecoder = string => new BinaryDecoder(Buffer.from(string));

  describe('#charsUtf8()', function() {
    const decoder = getDecoder("DBPF");

    beforeEach(function() {
      decoder.seek(0);
    });

    it('should read UTF8 characters correctly', function() {
      expect(decoder.charsUtf8(1)).to.equal('D');
      expect(decoder.charsUtf8(2)).to.equal('BP');
      decoder.seek(0);
      expect(decoder.charsUtf8(4)).to.equal('DBPF');
    });

    it('should skip correctly', function() {
      expect(decoder.charsUtf8(1)).to.equal('D');
      decoder.skip(1);
      expect(decoder.charsUtf8(1)).to.equal('P');
    });
  });
});
