// This file is for extending global types, e.g., adding properties to the `window` object.

// By declaring this, we inform TypeScript that the `window` object can have an `APP_CONFIG` property.
// This avoids type errors when accessing `window.APP_CONFIG` elsewhere in the codebase.
declare global {
  interface Window {
    APP_CONFIG?: {
      API_BASE_URL: string;
    };
  }
}

// This empty export is crucial. It turns this file into a module,
// which is necessary for the `declare global` block to be applied correctly.
// Without it, this file would be treated as a script, and the declaration would not be merged globally.
export {};
