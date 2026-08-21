// Browser-environment smoke test: fake window/document/__ModuleLoader__, load
// client.browser.js, run its factory + apply() with a stub ctx, and confirm a
// valid <style> tag is injected. Verifies the client half runs without throwing.
import { readFileSync } from "node:fs";

// --- minimal fake DOM ---
const headChildren = [];
function makeEl(tag) {
  return {
    tagName: tag,
    id: "",
    textContent: "",
    parentNode: null,
    get nextElementSibling() {
      if (!this.parentNode) return null;
      const i = headChildren.indexOf(this);
      return i >= 0 ? headChildren[i + 1] ?? null : null;
    },
  };
}
globalThis.window = globalThis;
globalThis.document = {
  head: {
    appendChild(el) {
      el.parentNode = globalThis.document.head;
      const i = headChildren.indexOf(el);
      if (i >= 0) headChildren.splice(i, 1);
      headChildren.push(el);
      return el;
    },
  },
  createElement: (tag) => makeEl(tag),
  getElementById: (id) => headChildren.find((e) => e.id === id) ?? null,
};
let captured = null;
globalThis.__ModuleLoader__ = { load: (reg) => { captured = reg; } };

// --- load the client bundle (registers its factory) ---
const src = readFileSync(new URL("./lib/client.browser.js", import.meta.url), "utf8");
(0, eval)(src);
if (!captured) throw new Error("factory was not registered");
console.log("registered id:", captured.id);

// --- run the factory with a stub require ---
const fakeRequire = (name) => {
  if (name === "react") return { createElement: (...a) => ({ a }) };
  if (name === "@deepseek-ai/dsh-client-runtime/client")
    return { createSnapshotStore: (init) => ({ set: () => {} }) };
  return {};
};
const exports = captured.factory(fakeRequire);
console.log("factory ran OK; exports:", Object.keys(exports).join(", "));
console.log("inject services:", exports.inject.join(", "));

// --- run apply() with a stub ctx (theme = claude) ---
let registeredCard = null;
const stubCtx = {
  effect: (fn) => { fn(); },
  locale: { register: () => {}, bind: () => (k) => k },
  settingsScope: {
    bind: () => ({
      getSnapshot: () => ({ status: "ready", writable: true, value: { theme: "claude" } }),
      subscribe: () => {},
      set: async () => {},
    }),
  },
  slots: {
    inject: (_name, gen) => {
      const it = gen();
      const step = it.next();
      registeredCard = step.value;
    },
    register: (config, component) => ({ config, component }),
  },
};
exports.apply(stubCtx);
console.log("apply() ran OK");
const regCfg = registeredCard?.config ?? {};
console.log("slot registered:", regCfg.name, "key:", regCfg.key, "order:", regCfg.order);

// --- verify the injected stylesheet ---
const style = globalThis.document.getElementById("dsh-theme-pack-style");
if (!style) throw new Error("no style tag injected");
const css = style.textContent;
console.log("style tag injected, length:", css.length);
console.log("has claude light bg (#faf9f5):", css.includes("#faf9f5"));
console.log("has claude dark bg (#181715):", css.includes("#181715"));
console.log("has card css (.tp_card):", css.includes(".tp_card"));
console.log("all decls !important:", !/;--dsw-[a-z0-9-]+:[^!]+(?<!!important);/.test(css));
console.log("\nBROWSER SMOKE TEST PASSED");
