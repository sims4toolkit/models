import { getAllEnumValues } from "../common/helpers";

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
   * Returns an array of all string table locales.
   */
  export function all(): StringTableLocale[] {
    return getAllEnumValues(StringTableLocale);
  }

  /**
   * Sets the high byte on the instance to the value for the given locale.
   * 
   * @param locale Locale to set on instance
   * @param instance Instance to set locale for
   */
  export function setHighByte(locale: StringTableLocale, instance: bigint): bigint {
    return StringTableLocale.getInstanceBase(instance) | BigInt(locale) << 56n;
  }

  /**
   * Determines and returns the locale for the given instance ID.
   * 
   * @param instance Instance to get locale from
   */
  export function getLocale(instance: bigint): StringTableLocale {
    return Number(instance >> 56n);
  }

  /**
   * Removes the locale code from the given instance and returns the result.
   * 
   * @param instance Instance to get base from
   */
  export function getInstanceBase(instance: bigint): bigint {
    return instance & 0xFFFFFFFFFFFFFFn;
  }

  /**
   * Returns the 5-letter code that is appended to string table packages that
   * are shipped with the game. Returns undefined if locale is not recognized.
   * 
   * @param locale Locale to get code for
   */
  export function getLocaleCode(locale: StringTableLocale): string {
    switch (locale) {
      case StringTableLocale.English: return "ENG_US";
      case StringTableLocale.ChineseSimplified: return "CHS_CN";
      case StringTableLocale.ChineseTraditional: return "CHT_CN";
      case StringTableLocale.Czech: return "CZE_CZ";
      case StringTableLocale.Danish: return "DAN_DK";
      case StringTableLocale.Dutch: return "DUT_NL";
      case StringTableLocale.Finnish: return "FIN_FI";
      case StringTableLocale.French: return "FRE_FR";
      case StringTableLocale.German: return "GER_DE";
      case StringTableLocale.Italian: return "ITA_IT";
      case StringTableLocale.Japanese: return "JPN_JP";
      case StringTableLocale.Korean: return "KOR_KR";
      case StringTableLocale.Norwegian: return "NOR_NO";
      case StringTableLocale.Polish: return "POL_PL";
      case StringTableLocale.Portuguese: return "POR_BR";
      case StringTableLocale.Russian: return "RUS_RU";
      case StringTableLocale.Spanish: return "SPA_EA";
      case StringTableLocale.Swedish: return "SWE_SE";
      default: return undefined;
    }
  }
}

// `export default enum` not supported by TS
export default StringTableLocale;
