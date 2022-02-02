/**
 * High bytes to set for specific locales for String Table instances.
 */
enum StringTableLocale {
  English = 0x00,
  ChineseSimplified = 0x01,
  ChineseTraditional = 0x02,
  Czech = 0x03,
  Danish = 0x04,
  Dutch = 0x05,
  Finnish = 0x06,
  French = 0x07,
  German = 0x08,
  Italian = 0x0B,
  Japanese = 0x0C,
  Korean = 0x0D,
  Norwegian = 0x0E,
  Polish = 0x0F,
  Portuguese = 0x11,
  Russian = 0x12,
  Spanish = 0x13,
  Swedish = 0x15,
}

namespace StringTableLocale {
  /**
   * Sets the high byte on the instance to the value for the given locale.
   * 
   * @param locale Locale to set on instance
   * @param instance Instance to set locale for
   */
  export function setHighByte(locale: StringTableLocale, instance: bigint): bigint {
   return (instance & 0x00FFFFFFFFFFFFFFn) | BigInt(locale) << 56n;
  }

  /**
   * Determines and returns the locale for the given instance ID.
   * 
   * @param instance Instance to get locale from
   */
  export function getLocale(instance: bigint): StringTableLocale {
    return Number(instance >> 56n);
  }
}

// `export default enum` not supported by TS
export default StringTableLocale;
