// This file is used to declare global properties on Vue instances.
// By declaring them here, we get full TypeScript support in our components.
import 'vue'

declare module 'vue' {
  /**
   * Extends the global component properties.
   */
  interface ComponentCustomProperties {
    /**
     * The global translation function provided by our custom i18n plugin.
     * @param key The translation key from the locale JSON files.
     * @param replacements Optional replacements for placeholders in the translation string.
     * @returns The translated string.
     */
    $t: (key: string, replacements?: { [key: string]: string | number }) => string
  }
}

// It's necessary to export something to make this file a module
export {}
