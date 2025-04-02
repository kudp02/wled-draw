// src/composables/useDarkMode.ts
import { ref, onMounted, watch } from "vue";

export function useDarkMode() {
  const isDarkMode = ref(false);

  const initDarkMode = () => {
    // Check for user preference in localStorage
    const savedMode = localStorage.getItem("darkMode");

    // Check for system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    // Use saved preference if available, otherwise use system preference
    isDarkMode.value = savedMode ? JSON.parse(savedMode) : prefersDark;

    // Apply dark mode immediately
    applyDarkMode(isDarkMode.value);
  };

  const applyDarkMode = (value) => {
    // In Tailwind v4, the dark mode can use a class on any parent element
    // but for consistency with previous versions, we'll still use the HTML element
    if (value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode.value));
  };

  // Watch for changes and apply them
  watch(isDarkMode, (newValue) => {
    applyDarkMode(newValue);
  });

  // Initialize on component mount
  onMounted(() => {
    initDarkMode();
  });

  return {
    isDarkMode,
    toggleDarkMode,
  };
}
