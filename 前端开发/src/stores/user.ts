/**
 * @file src/stores/user.ts
 * @description Pinia store for managing user authentication and profile data.
 *
 * This store handles the user's login state, stores user information,
 * and provides actions for fetching user data and logging out.
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiRequest } from '@/api'

/**
 * @interface User
 * @description Defines the structure of the user object.
 */
interface User {
  id: number;
  username: string | null;
  email: string | null;
  has_password?: boolean;
  is_admin?: boolean;
  show_womens_health?: boolean;
}

export const useUserStore = defineStore('user', () => {
  /**
   * @state {ref<User | null>} user - The current user's profile information. Null if not logged in.
   */
  const user = ref<User | null>(null)

  /**
   * @state {ref<boolean>} isLoggedIn - A reactive flag indicating if the user is currently logged in.
   */
  const isLoggedIn = ref(false)

  /**
   * @getter {computed<boolean>} isAdmin - A computed property that returns true if the logged-in user is an admin.
   */
  const isAdmin = computed(() => !!user.value?.is_admin)

  /**
   * @action fetchUser - Fetches user data from the API using the token from localStorage.
   *
   * This function is crucial for session persistence. It's called by the router guard
   * on page load to restore the user's session. If the token is invalid or expired,
   * it automatically logs the user out and re-throws the error to be handled by the caller.
   */
  async function fetchUser() {
    const token = localStorage.getItem('authToken')
    if (token) {
      try {
        const userData = await apiRequest('/me', 'GET')
        user.value = userData
        isLoggedIn.value = true
      } catch (error) {
        console.error('Failed to fetch user (session may have expired):', error)
        // If fetching user fails (e.g., token expired), perform a full logout.
        logout()
        // Re-throw the error so the router guard can catch it and redirect properly.
        throw error
      }
    } else {
      // Ensure state is clean if no token is found.
      isLoggedIn.value = false
      user.value = null
    }
  }

  /**
   * @action logout - Clears the user's session.
   *
   * Removes the auth token from localStorage and resets the user state in Pinia.
   * The redirection logic is handled by the component or view that calls this action.
   */
  function logout() {
    localStorage.removeItem('authToken')
    user.value = null
    isLoggedIn.value = false
  }

  /**
   * @action setUser - Manually sets the user data in the store.
   * @param {User} newUser - The new user data object.
   */
  function setUser(newUser: User) {
    user.value = newUser;
  }

  /**
   * @action updateShowWomensHealth - Updates the user's preference for showing the Women's Health module.
   * @param {boolean} show - The new value for the setting.
   */
  async function updateShowWomensHealth(show: boolean) {
    if (user.value) {
      try {
        await apiRequest('/me/settings', 'PUT', { show_womens_health: show });
        // Update local state on success
        user.value.show_womens_health = show;
      } catch (error) {
        console.error('Failed to update Women\'s Health setting:', error);
        // Optionally, show a toast notification to the user
        throw error; // Re-throw to be handled by the component
      }
    }
  }

  return { user, isLoggedIn, isAdmin, fetchUser, logout, setUser, updateShowWomensHealth }
})
