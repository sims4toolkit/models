import { unzipSync } from "zlib";
import CompressionType from "./compression-type";

/**
 * Decompresses the given buffer using the given algorithm.
 * 
 * @param buffer Buffer to decompress
 * @param compression Compression algorithm to use
 * @param decompressedSize Size of buffer after decompression
 */
export default function decompressBuffer(buffer: Buffer, compression: CompressionType, decompressedSize: number): Buffer {
  switch (compression) {
    case CompressionType.ZLIB:
      return unzipSync(buffer);
    case CompressionType.InternalCompression:
      return internalDecompression(buffer, decompressedSize)
    case CompressionType.Uncompressed:
      // fallthrough
    case CompressionType.DeletedRecord:
      return buffer;
    default:
      throw new Error(`Unsupported compression type: ${compression}`);
  }
}

/**
 * Decompresses a buffer using the internal compression algorithm.
 * 
 * Heavily based on this Visual Basic code by Scumbumbo:
 * https://modthesims.info/showthread.php?t=618074
 * 
 * Scumbumbo's VB code was put through this VB -> C# translator:
 * https://converter.telerik.com/
 * 
 * Note that the above translator is not perfect, and uses an outdated version
 * of the converter library:
 * https://github.com/icsharpcode/CodeConverter/issues/826#issuecomment-1030841329
 * 
 * The output code had to be touched up manually to fit TS syntax, but other
 * than that, this is basically Scumbumbo's code. Major credit to him.
 * 
 * @param data Buffer to decompress
 * @param decompressedSize Size of buffer when decompressed
 */
function internalDecompression(data: Buffer, decompressedSize: number): Buffer {
  const udata: Buffer = Buffer.alloc(decompressedSize);

  let udata_idx = 0;
  let data_idx = 5; // Skip 2 bytes of flags + 3 indicating decompressedSize
  let compressionFormat = data[0];
  let controlCode: number; // byte
  let size: number;
  let copySize: number;
  let copyOffset: number;
  
  if (compressionFormat & 0x80) data_idx++;

  do {
    controlCode = data[data_idx];
    data_idx += 1;
    if (controlCode <= 0x7F) {
      size = controlCode & 0x3;
      copySize = ((controlCode & 0x1C) / 4) + 3;
      copyOffset = ((controlCode & 0x60) * 8) + data[data_idx];
      data_idx += 1;
      copyBufferRange(data, data_idx, udata, udata_idx, size);
      data_idx += size;
      udata_idx += size;
      for (var I = 0; I <= copySize - 1; I++)
        udata[udata_idx + I] = udata[(udata_idx + I) - copyOffset - 1];
      udata_idx += copySize;
    } else if (controlCode <= 0xBF) {
      size = (data[data_idx] & 0xC0) / 64;
      copySize = (controlCode & 0x3F) + 4;
      copyOffset = ((data[data_idx] & 0x3F) * 256) + data[data_idx + 1];
      data_idx += 2;
      copyBufferRange(data, data_idx, udata, udata_idx, size);
      data_idx += size;
      udata_idx += size;
      for (var I = 0; I <= copySize - 1; I++)
        udata[udata_idx + I] = udata[(udata_idx + I) - copyOffset - 1];
      udata_idx += copySize;
    } else if (controlCode <= 0xDF) {
      size = controlCode & 0x3;
      copySize = ((controlCode & 0xC) * 64) + data[data_idx + 2] + 5;
      copyOffset = ((controlCode & 0x10) * 4096) + (data[data_idx] * 256) + data[data_idx + 1];
      data_idx += 3;
      copyBufferRange(data, data_idx, udata, udata_idx, size);
      data_idx += size;
      udata_idx += size;
      for (var I = 0; I <= copySize - 1; I++)
        udata[udata_idx + I] = udata[(udata_idx + I) - copyOffset - 1];
      udata_idx += copySize;
    } else if (controlCode <= 0xFB) {
      size = ((controlCode & 0x1F) * 4) + 4;
      copyBufferRange(data, data_idx, udata, udata_idx, size);
      data_idx += size;
      udata_idx += size;
    } else {
      size = controlCode & 0x3;
      if (size > 0) {
        copyBufferRange(data, data_idx, udata, udata_idx, size);
        data_idx += size;
        udata_idx += size;
      }
    }
  } while (!(controlCode >= 0xFC));

  return udata;
}

/**
 * Copies bytes from one buffer to another.
 * 
 * @param srcBuffer Buffer to get data from
 * @param srcIndex Start index to copy data from
 * @param dstBuffer Buffer to copy data to
 * @param dstIndex Start index to copy data to
 * @param range Number of bytes to copy
 */
function copyBufferRange(srcBuffer: Buffer, srcIndex: number, dstBuffer: Buffer, dstIndex: number, range: number) {
  for (let i = 0; i < range; i++) {
    dstBuffer[dstIndex + i] = srcBuffer[srcIndex + i];
  }
}
