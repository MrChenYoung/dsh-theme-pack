/*
 * dsh-theme-pack — browser half.
 *
 * Bundles six popular palettes (Tokyo Night, Catppuccin, Claude, GitHub,
 * Dracula, Nord), each with a light and a dark variant. The selected palette
 * is read from the `ui-theme-pack` settings namespace (persisted in
 * $DSH_HOME/settings.yaml) and applied by rebinding the --dsw-alias-* design
 * tokens on `body` / `body[data-ds-dark-theme]`. The built-in light/dark/
 * system preference (ui-theme) is untouched — this pack only changes WHICH
 * palette each mode uses.
 *
 * A "Theme Pack" card is registered into Settings -> Plugins with a palette
 * swatch grid + a select, so the user can switch themes in place.
 *
 * Loaded through window.__ModuleLoader__ like every shipped client bundle.
 */
window.__ModuleLoader__.load({
	id: "dsh-theme-pack",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		let react = require("react");
		let runtime = require("@deepseek-ai/dsh-client-runtime/client");
		const h = react.createElement;

		//#region color helpers
		/** Expand #rgb / #rrggbb to {r,g,b}. */
		function rgbOf(hex) {
			let s = String(hex).replace("#", "");
			if (s.length === 3) s = s.split("").map((c) => c + c).join("");
			return {
				r: parseInt(s.slice(0, 2), 16),
				g: parseInt(s.slice(2, 4), 16),
				b: parseInt(s.slice(4, 6), 16),
			};
		}
		/** hex + alpha -> rgba() string. */
		function withAlpha(hex, alpha) {
			const { r, g, b } = rgbOf(hex);
			return `rgba(${r}, ${g}, ${b}, ${alpha})`;
		}
		/** Lighten (percent>0) or darken (percent<0) a hex color. */
		function shade(hex, percent) {
			const { r, g, b } = rgbOf(hex);
			const target = percent < 0 ? 0 : 255;
			const p = Math.min(100, Math.abs(percent)) / 100;
			const mix = (v) => Math.round((target - v) * p + v);
			const to2 = (v) => v.toString(16).padStart(2, "0");
			return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}`;
		}
		//#endregion

		//#region palettes
		/*
		 * Each palette defines the core colors; `normalize` fills the derived
		 * ones (hover tints, borders, scrollbar, toast/tooltip) so a palette
		 * only needs to state what actually differs between themes.
		 */
		const THEMES = {
			"tokyo-night": {
				label: "Tokyo Night",
				dark: {
					bg: "#1a1b26", surface1: "#16161e", surface2: "#1f2335", surface3: "#24283b",
					text: "#c0caf5", textDim: "#a9b1d6", textFaint: "#565f89",
					border: "#292e42", accent: "#7aa2f7",
					codeBg: "#16161e", bubble: "#1f2335", sidebar: "#16161e",
				},
				light: {
					bg: "#e8ebf0", surface1: "#f2f4f8", surface2: "#d8dee9", surface3: "#cfd8e3",
					text: "#383a42", textDim: "#545c7e", textFaint: "#9aa5ce",
					border: "#c0caf5", accent: "#3d59a1",
					codeBg: "#f2f4f8", bubble: "#d8dee9", sidebar: "#eef1f6",
				},
			},
			catppuccin: {
				label: "Catppuccin",
				dark: {
					bg: "#1e1e2e", surface1: "#181825", surface2: "#313244", surface3: "#45475a",
					text: "#cdd6f4", textDim: "#bac2de", textFaint: "#a6adc8",
					border: "#45475a", accent: "#89b4fa",
					codeBg: "#11111b", bubble: "#313244", sidebar: "#181825",
				},
				light: {
					bg: "#eff1f5", surface1: "#e6e9ef", surface2: "#ccd0da", surface3: "#bcc0cc",
					text: "#4c4f69", textDim: "#5c5f77", textFaint: "#7c7f93",
					border: "#ccd0da", accent: "#1e66f5",
					codeBg: "#e6e9ef", bubble: "#ccd0da", sidebar: "#e6e9ef",
				},
			},
			claude: {
				label: "Claude",
				dark: {
					bg: "#181715", surface1: "#1f1e1b", surface2: "#252320", surface3: "#2e2b27",
					text: "#faf9f5", textDim: "#a09d96", textFaint: "#6c6a64",
					border: "#2e2b27", accent: "#d97757",
					codeBg: "#1f1e1b", bubble: "#252320", sidebar: "#1f1e1b",
				},
				light: {
					bg: "#faf9f5", surface1: "#f5f0e8", surface2: "#efe9de", surface3: "#e8e0d2",
					text: "#141413", textDim: "#3d3d3a", textFaint: "#6c6a64",
					border: "#e6dfd8", accent: "#cc785c",
					codeBg: "#f5f0e8", bubble: "#efe9de", sidebar: "#f5f0e8",
				},
			},
			github: {
				label: "GitHub",
				dark: {
					bg: "#0d1117", surface1: "#010409", surface2: "#21262d", surface3: "#30363d",
					text: "#e6edf3", textDim: "#7d8590", textFaint: "#6e7681",
					border: "#30363d", accent: "#58a6ff",
					codeBg: "#010409", bubble: "#21262d", sidebar: "#010409",
				},
				light: {
					bg: "#ffffff", surface1: "#f6f8fa", surface2: "#eaeef2", surface3: "#dde3e8",
					text: "#1f2328", textDim: "#656d76", textFaint: "#6e7781",
					border: "#d0d7de", accent: "#0969da",
					codeBg: "#f6f8fa", bubble: "#f6f8fa", sidebar: "#f6f8fa",
				},
			},
			dracula: {
				label: "Dracula",
				dark: {
					bg: "#282a36", surface1: "#21222c", surface2: "#44475a", surface3: "#6272a4",
					text: "#f8f8f2", textDim: "#c7c9e3", textFaint: "#6272a4",
					border: "#44475a", accent: "#bd93f9",
					codeBg: "#21222c", bubble: "#44475a", sidebar: "#21222c",
				},
				light: {
					bg: "#f6f7f9", surface1: "#e9eaf0", surface2: "#dcdfe8", surface3: "#cfd3e0",
					text: "#282a36", textDim: "#62647e", textFaint: "#9791ad",
					border: "#cfd3e0", accent: "#6c5ce7",
					codeBg: "#e9eaf0", bubble: "#dcdfe8", sidebar: "#e9eaf0",
				},
			},
			nord: {
				label: "Nord",
				dark: {
					bg: "#2e3440", surface1: "#292e39", surface2: "#3b4252", surface3: "#434c5e",
					text: "#eceff4", textDim: "#d8dee9", textFaint: "#7b8494",
					border: "#4c566a", accent: "#88c0d0",
					codeBg: "#2e3440", bubble: "#3b4252", sidebar: "#2e3440",
				},
				light: {
					bg: "#eceff4", surface1: "#e5e9f0", surface2: "#d8dee9", surface3: "#c8d0dc",
					text: "#2e3440", textDim: "#4c566a", textFaint: "#7b8494",
					border: "#c8d0dc", accent: "#5e81ac",
					codeBg: "#e5e9f0", bubble: "#d8dee9", sidebar: "#e5e9f0",
				},
			},
			/* Rosé Pine — official main/dawn variants (rose-pine/neovim palette). */
			"rose-pine": {
				label: "Rosé Pine",
				dark: {
					bg: "#191724", surface1: "#1f1d2e", surface2: "#26233a", surface3: "#403d52",
					text: "#e0def4", textDim: "#908caa", textFaint: "#6e6a86",
					border: "#403d52", accent: "#eb6f92",
					codeBg: "#1f1d2e", bubble: "#26233a", sidebar: "#1f1d2e",
				},
				light: {
					bg: "#faf4ed", surface1: "#fffaf3", surface2: "#f2e9e1", surface3: "#dfdad9",
					text: "#575279", textDim: "#797593", textFaint: "#9893a5",
					border: "#dfdad9", accent: "#b4637a",
					codeBg: "#fffaf3", bubble: "#f2e9e1", sidebar: "#fffaf3",
				},
			},
			kanagawa: {
				label: "Kanagawa",
				dark: {
					bg: "#181616", surface1: "#12120f", surface2: "#282727", surface3: "#393836",
					text: "#c5c9c5", textDim: "#c8c093", textFaint: "#7a8382",
					border: "#393836", accent: "#b6927b",
					codeBg: "#12120f", bubble: "#282727", sidebar: "#12120f",
				},
				light: {
					bg: "#f2ecbc", surface1: "#dcd5ac", surface2: "#e7dba0", surface3: "#e4d794",
					text: "#545464", textDim: "#43436c", textFaint: "#716e61",
					border: "#e4d794", accent: "#cc6d00",
					codeBg: "#dcd5ac", bubble: "#e7dba0", sidebar: "#dcd5ac",
				},
			},
		};
		const THEME_IDS = Object.keys(THEMES);
		//#endregion

		//#region css generation
		/** Fill derived tokens so a palette only states its core colors. */
		function normalize(p, isDark) {
			return {
				...p,
				modulePlatform: p.modulePlatform ?? p.surface2,
				overlay: p.overlay ?? p.surface3,
				borderSubtle: p.borderSubtle ?? withAlpha(p.text, 0.08),
				borderStrong: p.borderStrong ?? withAlpha(p.text, 0.2),
				accentText: p.accentText ?? (isDark ? "#ffffff" : "#0f1115"),
				inlineCode: p.inlineCode ?? p.surface2,
				bubbleHighlight: p.bubbleHighlight ?? p.surface3,
				input: p.input ?? p.surface1,
				sidebarActive: p.sidebarActive ?? p.surface2,
				sidebarHover: p.sidebarHover ?? p.surface2,
				scrollbar: p.scrollbar ?? withAlpha(p.text, 0.22),
				scrollbarHover: p.scrollbarHover ?? withAlpha(p.text, 0.38),
				toast: p.toast ?? (isDark ? p.surface3 : shade(p.bg, -68)),
				tooltip: p.tooltip ?? (isDark ? p.surface3 : shade(p.bg, -74)),
			};
		}
		/** One mode's full --dsw-alias-* binding. */
		function cssVars(p, isDark) {
			const accentHover = isDark ? shade(p.accent, 14) : shade(p.accent, -14);
			const vars = {
				"--dsw-alias-bg-base": p.bg,
				"--dsw-alias-bg-layer-1": p.surface1,
				"--dsw-alias-bg-layer-2": p.surface2,
				"--dsw-alias-bg-layer-3": p.surface3,
				"--dsw-alias-bg-module-platform": p.modulePlatform,
				"--dsw-alias-bg-overlay": p.overlay,
				"--dsw-alias-bg-multi-select": p.surface2,
				"--dsw-alias-bg-skeleton": withAlpha(p.text, 0.06),
				"--dsw-alias-label-primary": p.text,
				"--dsw-alias-label-secondary": p.textDim,
				"--dsw-alias-label-tertiary": p.textFaint,
				"--dsw-alias-label-caption": p.textFaint,
				"--dsw-alias-label-dimmed": p.textFaint,
				"--dsw-alias-label-primary-bluish": p.accent,
				"--dsw-alias-label-primary-foreground": p.accentText,
				"--dsw-alias-label-primary-inverted": p.accentText,
				"--dsw-alias-border-l1": p.borderSubtle,
				"--dsw-alias-border-l2": p.border,
				"--dsw-alias-border-l2-darkmode-thin": p.borderSubtle,
				"--dsw-alias-border-l3": p.borderStrong,
				"--dsw-alias-border-l4": p.borderStrong,
				"--dsw-alias-border-inverted": withAlpha(p.text, 0.1),
				"--dsw-alias-border-inverted2": withAlpha(p.text, 0.16),
				"--dsw-alias-brand-primary": p.accent,
				"--dsw-alias-brand-primary-invert": p.accentText,
				"--dsw-alias-brand-text": p.accent,
				// Design-system typo token, but dsh-client-ui-trajectory uses it
				// for accent elements — keep it in step with the theme accent.
				"--dsw-alias-brand-primary-new-colorprimary-new-color": p.accent,
				"--dsw-alias-interactive-bg-hover": withAlpha(p.accent, 0.08),
				"--dsw-alias-interactive-bg-active": withAlpha(p.accent, 0.16),
				"--dsw-alias-interactive-bg-hover-solid": p.surface2,
				"--dsw-alias-interactive-bg-hover-accent": withAlpha(p.accent, 0.14),
				"--dsw-alias-interactive-bg-hover-danger": "rgba(239, 68, 68, 0.08)",
				"--dsw-alias-button-primary-fill": p.accent,
				"--dsw-alias-button-primary-hover": accentHover,
				"--dsw-alias-button-primary-dimmed": withAlpha(p.accent, 0.2),
				"--dsw-alias-button-contrast-fill": p.accentText,
				"--dsw-alias-button-elevated-fill": p.surface3,
				"--dsw-alias-button-floating-fill": p.surface2,
				"--dsw-alias-button-floating-hover": p.surface3,
				"--dsw-alias-button-ghost-active-border": withAlpha(p.accent, 0.4),
				"--dsw-alias-button-ghost-active-fill": withAlpha(p.accent, 0.12),
				"--dsw-alias-button-ghost-active-hover": withAlpha(p.accent, 0.18),
				"--dsw-alias-button-info-fill": p.accent,
				"--dsw-alias-button-info-hover": accentHover,
				"--dsw-alias-markdown-code-block": p.codeBg,
				"--dsw-alias-markdown-code-block-banner": p.codeBg,
				"--dsw-alias-markdown-inline-code": p.inlineCode,
				"--dsw-alias-markdown-citation": p.surface2,
				"--dsw-alias-markdown-placeholder": p.surface2,
				"--dsw-alias-markdown-tag": p.surface2,
				"--dsw-alias-markdown-code-segment-selected": p.surface1,
				"--dsw-alias-markdown-code-segment-unselected": p.surface2,
				"--dsw-specific-bubble": p.bubble,
				"--dsw-specific-bubble-highlight": p.bubbleHighlight,
				"--dsw-specific-input-major": p.input,
				"--dsw-specific-login-input": p.input,
				"--dsw-specific-menu": p.surface3,
				"--dsw-specific-selector": p.surface2,
				"--dsw-specific-tip": p.surface2,
				"--dsw-specific-sidebar-fill": p.sidebar,
				"--dsw-specific-sidebar-nav-item-active": p.sidebarActive,
				"--dsw-specific-sidebar-nav-item-active-accent": withAlpha(p.accent, 0.14),
				"--dsw-specific-sidebar-nav-item-hover": p.sidebarHover,
				"--dsw-alias-scrollbar-bg-l1": p.scrollbar,
				"--dsw-alias-scrollbar-bg-l2": p.scrollbar,
				"--dsw-alias-scrollbar-hover-l1": p.scrollbarHover,
				"--dsw-alias-scrollbar-hover-l2": p.scrollbarHover,
				"--dsw-alias-toast-bg": p.toast,
				"--dsw-alias-tooltip-bg": p.tooltip,
				"--dsw-alias-state-business-primary": p.accent,
				"--dsw-alias-state-business-tertiary": withAlpha(p.accent, 0.14),
			};
			return Object.entries(vars).map(([k, v]) => `${k}:${v}!important`).join(";");
		}
		/** Full stylesheet for one palette (light + dark). */
		function buildCss(themeId) {
			const theme = THEMES[themeId];
			if (!theme) return "";
			return [
				`/* dsh-theme-pack: ${theme.label} */`,
				`body{${cssVars(normalize(theme.light, false), false)}}`,
				`body[data-ds-dark-theme]{${cssVars(normalize(theme.dark, true), true)}}`,
			].join("\n");
		}
		//#endregion

		//#region css injection
		const STYLE_ID = "dsh-theme-pack-style";
		const CARD_CSS = [
			".tp_card{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;padding:16px}",
			".tp_head{display:flex;flex-direction:column;gap:4px;margin-bottom:14px}",
			".tp_name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}",
			".tp_desc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}",
			".tp_body{display:flex;flex-direction:column;gap:14px}",
			".tp_swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px}",
			".tp_swatch{display:flex;flex-direction:column;align-items:center;gap:6px;border:2px solid transparent;border-radius:10px;cursor:pointer;padding:8px;font:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);transition:border-color .15s,transform .1s}",
			".tp_swatch:hover:not(:disabled){transform:translateY(-1px)}",
			".tp_swatchActive{border-color:var(--dsw-alias-brand-primary)}",
			".tp_swatch:disabled{cursor:default;opacity:.6}",
			".tp_swatchPreview{display:flex;align-items:center;justify-content:center;width:100%;height:38px;border-radius:6px;box-shadow:inset 0 0 0 1px rgb(0 0 0 / 12%)}",
			".tp_swatchDot{width:16px;height:16px;border-radius:50%;box-shadow:0 0 0 2px rgb(255 255 255 / 28%)}",
			".tp_swatchLabel{font-size:12px;line-height:1.3;text-align:center;color:var(--dsw-alias-label-secondary)}",
			".tp_field{display:flex;flex-direction:column;gap:6px}",
			".tp_label{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500}",
			".tp_select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 8px;font-size:13px}",
			".tp_select:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}",
			".tp_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}",
		].join("");
		/** Inject / update the palette stylesheet (always last in <head>). */
		function applyTheme(themeId) {
			if (typeof document === "undefined") return;
			const css = buildCss(themeId) + "\n" + CARD_CSS;
			let tag = document.getElementById(STYLE_ID);
			if (!tag) {
				tag = document.createElement("style");
				tag.id = STYLE_ID;
				document.head.appendChild(tag);
			}
			tag.textContent = css;
			// Re-append so we sit after the built-in theme sheets and win the cascade.
			if (tag.nextElementSibling !== null) tag.parentNode.appendChild(tag);
		}
		//#endregion

		//#region controller
		var ThemePackController = class {
			constructor(scope) {
				this.scope = scope;
				this.store = (0, runtime.createSnapshotStore)(this.project());
				scope.subscribe(() => {
					this.publish();
					this.apply();
				});
				this.publish();
				this.apply();
			}
			value() {
				return this.scope.getSnapshot().value ?? {};
			}
			selected() {
				const v = this.value().theme;
				return typeof v === "string" && THEMES[v] ? v : "tokyo-night";
			}
			project() {
				const snapshot = this.scope.getSnapshot();
				return {
					available: snapshot.status === "ready",
					writable: !!snapshot.writable,
					theme: this.selected(),
				};
			}
			publish() {
				this.store.set(this.project());
			}
			apply() {
				applyTheme(this.selected());
			}
			actions() {
				return {
					setTheme: (themeId) => {
						if (!THEMES[themeId]) return;
						applyTheme(themeId); // instant visual feedback
						Promise.resolve(this.scope.set("theme", themeId)).catch(() => {});
					},
				};
			}
			inject() {
				return { hooks: { themePackCard: this.store }, ...this.actions() };
			}
		};
		//#endregion

		//#region card
		function ThemePackCard(props) {
			const { t } = props;
			const state = props.useThemePackCard((s) => s);
			if (!state || !state.available) return null;
			const disabled = !state.writable;
			const selected = state.theme;
			return h("li", { className: "tp_card" },
				h("div", { className: "tp_head" },
					h("span", { className: "tp_name" }, t("title")),
					h("span", { className: "tp_desc" }, t("description"))
				),
				h("div", { className: "tp_body" },
					h("div", { className: "tp_swatches" },
						THEME_IDS.map((id) => {
							const th = THEMES[id];
							const active = id === selected;
							return h("button", {
								key: id,
								type: "button",
								className: "tp_swatch" + (active ? " tp_swatchActive" : ""),
								disabled: disabled,
								onClick: () => props.setTheme(id),
								title: th.label,
							},
								h("span", { className: "tp_swatchPreview", style: { background: th.dark.bg } },
									h("span", { className: "tp_swatchDot", style: { background: th.dark.accent } })
								),
								h("span", { className: "tp_swatchLabel" }, th.label)
							);
						})
					),
					h("div", { className: "tp_field" },
						h("label", { className: "tp_label", htmlFor: "tp-theme" }, t("theme")),
						h("select", {
							id: "tp-theme",
							className: "tp_select",
							value: selected,
							disabled: disabled,
							onChange: (e) => props.setTheme(e.target.value),
						},
							THEME_IDS.map((id) => h("option", { key: id, value: id }, THEMES[id].label))
						),
						h("p", { className: "tp_hint" }, t("themeHint"))
					),
					h("p", { className: "tp_hint" }, t("lightDarkHint"))
				)
			);
		}
		//#endregion

		//#region apply
		const NS = "ui-theme-pack";
		const inject = ["slots", "locale", "settingsScope"];
		const zh = {
			title: "主题包",
			description: "切换界面配色（亮 / 暗跟随系统主题开关）",
			theme: "配色方案",
			themeHint: "选择一套内置配色，立即生效并自动保存。",
			lightDarkHint: "亮色 / 暗色模式由主题开关控制，这里只切换配色。",
		};
		const en = {
			title: "Theme Pack",
			description: "Switch the UI palette (light / dark follows the theme toggle)",
			theme: "Palette",
			themeHint: "Pick a bundled palette; it applies instantly and is saved.",
			lightDarkHint: "Light / dark mode is controlled by the theme toggle; this only changes the palette.",
		};
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-theme-pack: section dictionaries");
			const controller = new ThemePackController(ctx.settingsScope.bind({ namespace: NS }));
			ctx.slots.inject("settings.plugin.item", function* () {
				yield ctx.slots.register({
					name: "settings.plugin.item",
					key: NS,
					order: 40,
					locale: NS,
					inject: () => controller.inject(),
				}, ThemePackCard);
			});
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
