// Test harness: extract the pure CSS-generation logic from client.browser.js
// (color helpers + palettes + css generation regions) and run buildCss for
// every theme. Verifies the logic is self-consistent and emits valid CSS.
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./lib/client.browser.js", import.meta.url), "utf8");

const start = src.indexOf("//#region color helpers");
const injectRegion = src.indexOf("//#region css injection");
const endMarker = src.lastIndexOf("//#endregion", injectRegion);
const code = src.slice(start, endMarker + "//#endregion".length);

const fn = new Function(code + "\nreturn { buildCss, THEMES, THEME_IDS, normalize, withAlpha, shade };");
const { buildCss, THEMES, THEME_IDS, normalize, withAlpha, shade } = fn();

// Sanity checks on helpers.
console.log("withAlpha('#7aa2f7', 0.08) =", withAlpha("#7aa2f7", 0.08));
console.log("shade('#7aa2f7', 14)      =", shade("#7aa2f7", 14));
console.log("shade('#cc785c', -14)     =", shade("#cc785c", -14));
console.log("themes:", THEME_IDS.join(", "));
console.log("");

let problems = 0;
for (const id of THEME_IDS) {
  const css = buildCss(id);
  const lightBlock = css.match(/body\{([^}]*)\}/);
  const darkBlock = css.match(/body\[data-ds-dark-theme\]\{([^}]*)\}/);
  const lightVars = lightBlock ? lightBlock[1].split(";").filter(Boolean) : [];
  const darkVars = darkBlock ? darkBlock[1].split(";").filter(Boolean) : [];
  // Every declaration must be `--dsw-...:value!important`.
  const bad = [...lightVars, ...darkVars].filter((d) => !/^--dsw-[a-z0-9-]+:.+!important$/.test(d));
  if (bad.length) {
    problems++;
    console.log(`[FAIL] ${id}: ${bad.length} malformed declarations`);
    bad.slice(0, 5).forEach((b) => console.log("   ", b));
  } else {
    console.log(`[ok]   ${id}: light=${lightVars.length} vars, dark=${darkVars.length} vars`);
  }
}
console.log("");
console.log(problems === 0 ? "ALL THEMES OK" : `${problems} THEME(S) FAILED`);

// Dump one full theme for visual inspection.
console.log("\n===== SAMPLE: tokyo-night =====");
console.log(buildCss("tokyo-night"));
