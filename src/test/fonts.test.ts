import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import path from "path";

// vitest runs from the project root → resolve src/ from cwd
const SRC_DIR = path.join(process.cwd(), "src");
const INDEX_CSS = path.join(SRC_DIR, "index.css");
const indexCss = readFileSync(INDEX_CSS, "utf8");

// all `font-family:` and `--bs-body-font-family:` declarations (value part)
function fontFamilyValues(css: string): string[] {
  const out: string[] = [];
  const re = /font-family\s*:\s*([^;}{]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    out.push(m[1].trim());
  }
  return out;
}

// recursively list source files under src/ (excluding tests)
function sourceFiles(): string[] {
  const entries = readdirSync(SRC_DIR, {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((e) => e.isFile())
    .map((e) => path.join(e.parentPath, e.name))
    .filter((p) => /\.(css|tsx|ts)$/.test(p))
    .filter((p) => !/\.test\.[tj]sx?$/.test(p) && !/[\\/]test[\\/]/.test(p));
}

describe("fonts – tylko Strawford z assets", () => {
  it("--bs-body-font-family jest nadpisane na Strawforda", () => {
    const match = indexCss.match(/--bs-body-font-family\s*:\s*([^;}{]+)/i);
    expect(match, "brak --bs-body-font-family w index.css").not.toBeNull();
    expect(match![1].trim().startsWith('"Strawford"')).toBe(true);
  });

  it("każda deklaracja font-family ma Strawforda jako podstawowy font", () => {
    const values = fontFamilyValues(indexCss);
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) {
      expect(v.startsWith('"Strawford"'), `niedozwolony font: ${v}`).toBe(true);
    }
  });

  it("każdy @font-face używa Strawforda i wskazuje na ./assets/fonts/", () => {
    const faces = indexCss.match(/@font-face\s*\{[^}]*\}/gi) ?? [];
    expect(faces.length).toBeGreaterThan(0);
    for (const face of faces) {
      expect(/font-family\s*:\s*"Strawford"/i.test(face)).toBe(true);
      expect(/url\(\s*["']?\.\/assets\/fonts\//i.test(face)).toBe(true);
    }
  });

  it("brak zewnętrznych źródeł czcionek", () => {
    expect(/@import/i.test(indexCss)).toBe(false);
    expect(/googleapis|gstatic|typekit|use\.fontawesome/i.test(indexCss)).toBe(
      false
    );
  });

  it("deklaracje czcionek żyją wyłącznie w index.css", () => {
    const offenders = sourceFiles()
      .filter((p) => !p.endsWith("index.css"))
      .filter((p) => /font-family|fontFamily/.test(readFileSync(p, "utf8")));
    expect(offenders, `pliki z własną czcionką: ${offenders.join(", ")}`).toEqual(
      []
    );
  });
});
