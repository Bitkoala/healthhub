<!--
  @file src/components/ToastNotification.vue
  @description A global component to display toast notifications.
-->
<script setup lang="ts">
import { useToastStore } from '@/stores/toast';
import { storeToRefs } from 'pinia';

const toastStore = useToastStore();
const { toast } = storeToRefs(toastStore);
</script>

<template>
  <div
    v-if="toast.visible"
    :class="[
      'fixed',
      'bottom-24',
      'md:bottom-5',
      'right-5',
      'p-4',
      'rounded-lg',
      'shadow-lg',
      'text-white',
      'z-50',
      toast.type === 'success' ? 'bg-green-500' : 'bg-red-500',
    ]"
  >
    {{ toast.message }}
  </div>
</template>
