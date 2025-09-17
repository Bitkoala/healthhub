/**
 * @file src/stores/language.ts
 * @description Pinia store for managing internationalization (i18n).
 *
 * This store handles the application's language state, loads translation files,
 * and provides a global translation function.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// --- 动态加载语言环境文件 ---
// 使用 Vite 的 `import.meta.glob` 功能，自动发现并加载 `src/locales` 目录下的所有 .json 文件。
// `eager: true` 确保文件在模块加载时被同步导入。
const localeModules = import.meta.glob('@/locales/*.json', { eager: true, import: 'default' })

// 将加载的模块处理成一个更易于使用的 `translations` 对象，
// 结构为：{ "en": { "key": "value" }, "zh": { "key": "值" } }
const translations: Record<string, Record<string, string>> = {}
for (const path in localeModules) {
  const lang = path.split('/').pop()?.replace('.json', '')
  if (lang) {
    translations[lang] = localeModules[path] as Record<string, string>
  }
}

export const useLanguageStore = defineStore('language', () => {
  /**
   * @state {ref<string>} lang - The current active language code (e.g., 'zh', 'en').
   * It is initialized from localStorage to persist the user's language choice across sessions.
   * Defaults to 'zh' if no language is set in localStorage.
   */
  const lang = ref<string>(localStorage.getItem('language') || 'zh')

  /**
   * @action setLanguage - Sets the application's language.
   * @param {string} newLang - The new language code to set.
   *
   * This action updates the `lang` state, persists the choice to localStorage,
   * and sets the `lang` attribute on the `<html>` element for CSS and accessibility purposes.
   */
  function setLanguage(newLang: string) {
    if (translations[newLang]) {
      lang.value = newLang
      localStorage.setItem('language', newLang)
      document.documentElement.lang = newLang === 'zh' ? 'zh-CN' : 'en'
    }
  }

  /**
   * @getter {computed} t - The translation function.
   *
   * This computed property returns a function that takes a translation key and returns
   * the corresponding string in the currently active language.
   * It also supports placeholder replacements.
   * If a translation is not found for the given key, it returns the key itself as a fallback.
   *
   * @example
   * const languageStore = useLanguageStore();
   * const greeting = languageStore.t('welcomeMessage', { name: 'World' });
   */
  const t = computed(() => {
    return (key: string, replacements?: { [key: string]: string | number }): string => {
      let translation = translations[lang.value]?.[key] || key;
      if (replacements) {
        for (const placeholder in replacements) {
          const regex = new RegExp(`{${placeholder}}`, 'g');
          translation = translation.replace(regex, String(replacements[placeholder]));
        }
      }
      return translation;
    }
  })

  return { lang, setLanguage, t }
})