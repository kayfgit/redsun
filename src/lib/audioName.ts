/**
 * Maps a character or phrase to its bundled audio filename (no extension).
 *
 * Files are named by Unicode code point(s) in hex — e.g. 你 → "4f60",
 * 你好 → "4f60_597d" — so they stay filesystem- and URL-safe on every
 * platform. Both the build script and the runtime use this, so a generated
 * file and the path the app requests are guaranteed to agree.
 */
export function audioName(text: string): string {
  return Array.from(text)
    .map((ch) => ch.codePointAt(0)!.toString(16))
    .join('_');
}
