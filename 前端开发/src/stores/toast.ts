/**
 * @file src/stores/toast.ts
 * @description Pinia store for managing toast notifications.
 */
import { defineStore } from 'pinia';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export const useToastStore = defineStore('toast', {
  state: (): { toast: ToastState } => ({
    toast: {
      message: '',
      type: 'success',
      visible: false,
    },
  }),
  actions: {
    /**
     * @action showToast - Displays a toast notification.
     * @param {object} payload - The toast configuration.
     * @param {string} payload.message - The message to display.
     * @param {ToastType} [payload.type='success'] - The type of toast ('success' or 'error').
     *
     * The toast will automatically hide after 3 seconds.
     */
    showToast(payload: { message: string; type?: ToastType }) {
      const type = payload.type || 'success';
      this.toast.message = payload.message;
      this.toast.type = type;
      this.toast.visible = true;

      // Automatically hide the toast after a delay.
      setTimeout(() => {
        this.hideToast();
      }, 3000);
    },

    /**
     * @action hideToast - Hides the currently visible toast.
     */
    hideToast() {
      this.toast.visible = false;
    },
  },
});
