/*
 * dsh-theme-pack — host half.
 *
 * Registers one live settings section (`ui-theme-pack`) that owns a single
 * field, `theme`, selecting which bundled palette the browser half applies.
 * The value is persisted in `$DSH_HOME/settings.yaml` under `ui-theme-pack:`
 * and pushed to the browser over the settings scope, exactly like the
 * built-in `ui-theme` preference. No model-facing behavior is touched.
 */
import z from '@deepseek-ai/schemastery';
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings';

/** Stable Cordis plugin name. */
export const name = 'ui-theme-pack';

/** Host services this plugin needs (none beyond the settings seam). */
export const inject = [];

/**
 * The palette ids this pack ships. Kept in sync with the browser half's
 * `THEMES` table; the union is the single source of truth for the schema.
 */
export const THEME_IDS = [
  'tokyo-night',
  'catppuccin',
  'claude',
  'github',
  'dracula',
  'nord',
];

/** Section schema: one enum field with a default. */
export const Config = z.object({
  theme: z.union(THEME_IDS).default('tokyo-night'),
});

/** Settings namespace owning this plugin's section (Settings -> Plugins card). */
export const THEME_PACK_SETTINGS_NAMESPACE = settingsNamespace('ui-theme-pack');

/** Register the live settings section. */
export function apply(ctx, config) {
  let current = () => config;
  installSettingsSection(ctx, THEME_PACK_SETTINGS_NAMESPACE, Config, config, {
    setSource: (source) => {
      current = source;
    },
    onChange: () => {},
  });
}
