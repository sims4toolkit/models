type BufferReadNumberMethod = 'readUInt8' | 'readUInt16LE' | 'readUInt32LE' | 'readInt8' | 'readInt16LE' | 'readInt32LE' | 'readFloatLE';
type BufferReadBigIntMethod = 'readBigUInt64LE' | 'readBigInt64LE';
type BufferWriteNumberMethod = 'writeUInt8' | 'writeUInt16LE' | 'writeUInt32LE' | 'writeInt8' | 'writeInt16LE' | 'writeInt32LE' | 'writeFloatLE';
type BufferWriteBigIntMethod = 'writeBigUInt64LE' | 'writeBigInt64LE';

/**
 * A base class for classes that work with binary files.
 */
abstract class BinaryEncodingBase {
	protected readonly buffer: Buffer;
  protected offset: number;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

	/**
	 * Advances the offset by the given number of bytes.
	 * 
	 * @param {number | bigint} offset The number of bytes to skip
	 * @returns {number} The new offset after skipping bytes
	 */
	skip(offset: number | bigint): number {
		return this.offset += Number(offset);
	}

	/**
	 * Moves the offset to a specific byte.
	 * 
	 * @param {number | bigint} offset The value to set the offset to
	 * @returns {void}
	 */
	seek(offset: number | bigint): void {
		this.offset = Number(offset);
	}

	/**
	 * Gets the current offset.
	 * 
	 * @returns {number} The current offset
	 */
	tell(): number {
		return this.offset;
	}

	/**
	 * Preserves the original offset after calling the given function.
	 * 
	 * @param fn Function to call
	 */
	savePos<T>(fn: () => T): T {
		const pos = this.tell();
		const result = fn();
		this.seek(pos);
		return result;
	}

	/**
	 * Returns whether or not the offset is at the last byte of the file.
	 * 
	 * @returns {boolean} Whether or not offset is at EOF
	 */
	isEOF(): boolean {
		return this.offset === this.buffer.length;
	}

	/**
	 * Returns a new BinaryEncoder using this object's buffer.
	 */
	getEncoder(): BinaryEncoder {
		return new BinaryEncoder(this.buffer);
	}

	/**
	 * Returns a new BinaryDecoder using this object's buffer.
	 */
	getDecoder(): BinaryDecoder {
		return new BinaryDecoder(this.buffer);
	}
}

/**
 * A class for decoding binary files.
 */
export class BinaryDecoder extends BinaryEncodingBase {
	constructor(buffer: Buffer) {
		super(buffer);
	}

	//#region Text / Encoded Bytes

	/**
	 * Reads the given number of bytes as characters in the given encoding.
	 * 
	 * @private
	 * @param {number} num Number of bytes to read
	 * @param {string} encoding Encoding to read bytes as
	 * @returns {string} The characters read as a string
	 */
	private _chars(num: number, encoding: string): string {
		const end = this.offset + num;
		//@ts-ignore: Importing Encoding is a pain, and is not necessary at all
		const result = this.buffer.toString(encoding, this.offset, end);
		this.seek(end);
		return result;
	}

	/**
	 * Reads the given number of bytes as a srting of UTF-8 characters.
	 * 
	 * @param {number} num Number of bytes to read
	 * @returns {string} The characters read
	 */
	charsUtf8(num: number): string {
		return this._chars(num, 'utf-8');
	}

	/**
	 * Reads the given number of bytes as a srting of Base64 characters.
	 * 
	 * @param {number} num Number of bytes to read
	 * @returns {string} The characters read
	 */
	charsBase64(num: number): string {
		return this._chars(num, 'base64');
	}

	/**
	 * Reads bytes until a null byte is found, parses them as a UTF-8 string.
	 * 
	 * @returns {string} The string read
	 */
	string(): string {
		const start = this.tell();
		let nextByte = this.uint8();
		if (!nextByte) return '';
		while (nextByte) nextByte = this.uint8();
		return this.buffer.toString('utf8', start, this.offset - 1);
	}

	//#endregion Text / Encoded Bytes
	
	//#region Raw Bytes / Buffers

	/**
	 * Reads the next byte as a boolean (first, reads it as a UInt8, then checks if it's != 0).
	 * 
	 * @returns {boolean} The boolean value of the next byte
	 */
	boolean(): boolean {
		return this.uint8() !== 0;
	}

	/**
	 * Reads the given number of raw bytes.
	 * 
	 * @param {number} num The number of bytes to read
	 * @returns {number[]} An array of bytes
	 */
	bytes(num: number): number[] {
		const bytes = [];
		for (let i = 0; i < num; i++) bytes.push(this.uint8());
		return bytes;
	}

	/**
	 * Slices a sub-buffer of the given size starting at the current offset.
	 * 
	 * @param {number} size Size of the sub-buffer to slice
	 * @returns {Buffer} The sliced buffer
	 */
	slice(size: number): Buffer {
		const end = this.offset + size + 1;
		const slice = this.buffer.slice(this.offset, end);
		this.seek(end);
		return slice;
	}

	//#endregion Raw Bytes / Buffers
	
	//#region Numbers

	/**
	 * Reads a number using the given Buffer method.
	 * 
	 * @private
	 * @param {BufferReadNumberMethod} methodName The method to call on the buffer
	 * @param {number} numBytes The number of bytes to advance the offset by
	 * @returns {number} The read number
	 */
	private _number(methodName: BufferReadNumberMethod, numBytes: number): number {
		const result = this.buffer[methodName](this.offset);
		this.skip(numBytes);
		return result;
	}

	/**
	 * Reads a bigint using the given Buffer method.
	 * 
	 * @private
	 * @param {BufferReadBigIntMethod} methodName The method to call on the buffer
	 * @returns {number} The read bigint
	 */
	private _bigint(methodName: BufferReadBigIntMethod): bigint {
		const result = this.buffer[methodName](this.offset);
		this.skip(8);
		return result;
	}

	/**
	 * Reads an 8-bit unsigned integer.
	 * 
	 * @returns {number} The read uint8
	 */
	uint8(): number {
		return this._number('readUInt8', 1);
	}

	/**
	 * Reads a 16-bit unsigned integer, using little endian.
	 * 
	 * @returns {number} The read uint16
	 */
	uint16(): number {
		return this._number('readUInt16LE', 2);
	}

	/**
	 * Reads a 32-bit unsigned integer, using little endian.
	 * 
	 * @returns {number} The read uint32
	 */
	uint32(): number {
		return this._number('readUInt32LE', 4);
	}

	/**
	 * Reads a 64-bit unsigned integer, using little endian.
	 * 
	 * @returns {bigint} The read uint64
	 */
	uint64(): bigint {
		return this._bigint('readBigUInt64LE');
	}

	/**
	 * Reads an 8-bit signed integer.
	 * 
	 * @returns {number} The read int8
	 */
	int8(): number {
		return this._number('readInt8', 1);
	}

	/**
	 * Reads a 16-bit signed integer, using little endian.
	 * 
	 * @returns {number} The read int16
	 */
	int16(): number {
		return this._number('readInt16LE', 2);
	}

	/**
	 * Reads a 32-bit signed integer, using little endian.
	 * 
	 * @returns {number} The read int32
	 */
	int32(): number {
		return this._number('readInt32LE', 4);
	}

	/**
	 * Reads a 64-bit signed integer, using little endian.
	 * 
	 * @returns {bigint} The read int64
	 */
	int64(): bigint {
		return this._bigint('readBigInt64LE');
	}

	/**
	 * Reads a float, using little endian.
	 * 
	 * @returns {number} The read float
	 */
	float(): number {
		return this._number('readFloatLE', 4);
	}

	//#endregion Numbers
}

/**
 * An abstraction for encoding binary files.
 */
export class BinaryEncoder extends BinaryEncodingBase {
	constructor(buffer: Buffer) {
		super(buffer);
	}

	//#region Text / Encoded Bytes

	/**
	 * Writes a string to the buffer using the given encoding.
	 * 
	 * @private
	 * @param {string} value The characters to write
	 * @param {string} encoding The encoding to write the string as
	 */
	private _chars(value: string, encoding: string) {
		// intentionally += because write() returns # bytes written
		//@ts-ignore: Importing Encoding is a pain, and is not necessary at all
		this.offset += this.buffer.write(value, this.offset, Buffer.byteLength(value, encoding), encoding);
	}

	/**
	 * Writes a string to the buffer using UTF-8 encoding.
	 * 
	 * @param {string} value The characters to write
	 */
	charsUtf8(value: string) {
		this._chars(value, 'utf-8');
	}

	/**
	 * Writes a string to the buffer using Base64 encoding.
	 * 
	 * @param {string} value The characters to write
	 */
	charsBase64(value: string) {
		this._chars(value, 'base64');
	}

	//#endregion Text / Encoded Bytes

	//#region Raw Bytes / Buffers

	/**
	 * Writes a UInt8 value of 1 if the given boolean is true, or 0 if it is false.
	 * 
	 * @param value Boolean value to write as a UInt8
	 */
	boolean(value: boolean) {
		this.uint8(value ? 1 : 0);
	}

	// TODO: raw bytes/buffers

	//#endregion Raw Bytes / Buffers

	//#region Numbers

	/**
	 * Writes a number to the buffer using the given method.
	 * 
	 * @private
	 * @param {number} value The number to write
	 * @param {BufferWriteNumberMethod} methodName The method to write the number with
	 */
	private _number(value: number, methodName: BufferWriteNumberMethod) {
		// intentionally = because all number methods return current offset + # bytes written
		this.offset = this.buffer[methodName](value, this.offset);
	}

	/**
	 * Writes a bigint to the buffer using the given method. This is separate from _number
	 * because this module was originally written in TypeScript.
	 * 
	 * @private
	 * @param {bigint} value The bigint to write
	 * @param {BufferWriteBigIntMethod} methodName The method to write the bigint with
	 */
	private _bigint(value: bigint, methodName: BufferWriteBigIntMethod) {
		// intentionally = because all number methods return current offset + # bytes written
		this.offset = this.buffer[methodName](value, this.offset);
	}

	/**
	 * Writes an 8-bit unsigned integer to the buffer.
	 * 
	 * @param {number} value The uint8 to write
	 */
	uint8(value: number) {
		this._number(value, 'writeUInt8');
	}

	/**
	 * Writes a 16-bit unsigned integer to the buffer, using little endian.
	 * 
	 * @param {number} value The uint16 to write
	 */
	uint16(value: number) {
		this._number(value, 'writeUInt16LE');
	}

	/**
	 * Writes a 32-bit unsigned integer to the buffer, using little endian.
	 * 
	 * @param {number} value The uint32 to write
	 */
	uint32(value: number) {
		this._number(value, 'writeUInt32LE');
	}

	/**
	 * Writes a 64-bit unsigned integer to the buffer, using little endian.
	 * 
	 * @param {number | bigint} value The uint64 to write
	 */
	uint64(value: number | bigint) {
		this._bigint(BigInt(value), 'writeBigUInt64LE');
	}

	/**
	 * Writes an 8-bit signed integer to the buffer.
	 * 
	 * @param {number} value The int8 to write
	 */
	int8(value: number) {
		this._number(value, 'writeInt8');
	}

	/**
	 * Writes a 16-bit signed integer to the buffer, using little endian.
	 * 
	 * @param {number} value The int16 to write
	 */
	int16(value: number) {
		this._number(value, 'writeInt16LE');
	}

	/**
	 * Writes a 32-bit signed integer to the buffer, using little endian.
	 * 
	 * @param {number} value The int32 to write
	 */
	int32(value: number) {
		this._number(value, 'writeInt32LE');
	}

	/**
	 * Writes a 64-bit signed integer to the buffer, using little endian.
	 * 
	 * @param {number | bigint} value The int64 to write
	 */
	int64(value: number | bigint) {
		this._bigint(BigInt(value), 'writeBigInt64LE');
	}

	/**
	 * Writes a float to the buffer, using little endian.
	 * 
	 * @param {number} value The float to write
	 */
	float(value: number) {
		this._number(value, 'writeFloatLE');
	}

	//#endregion Numbers
}
