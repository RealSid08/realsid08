/** Models sometimes leave private-use citation tokens (e.g. \uE200cite\uE202turn0\uE201) in their text. */
export const withoutCitationTokens = (text: string) => text.replace(/\uE200[^\uE201]*\uE201/g, '').replace(/[\uE000-\uF8FF]/g, '');
