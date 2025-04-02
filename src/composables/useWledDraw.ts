import { ref, computed, watch, onMounted } from "vue";

// Clear type definitions for history actions
interface DrawAction {
  type: "draw";
  index: number;
  color: string; // The previous color before change
}

interface ClearAction {
  type: "clear";
  pixels: string[]; // The previous state of all pixels
}

type HistoryAction = DrawAction | ClearAction;

export function useWledDraw() {
  // ===== STATE VARIABLES =====
  const apiUrl = ref(""); // WLED API endpoint URL
  const wledUrl = ref(""); // Base WLED interface URL
  const cellSize = ref(10); // Size of each pixel cell in the drawing grid
  const gridWidth = ref(14); // Matrix width (in pixels)
  const gridHeight = ref(20); // Matrix height (in pixels)
  const pixelData = ref<string[]>([]); // Holds color values for each pixel
  const currentColor = ref("#ff2500"); // Currently selected drawing color

  // Default color palette
  const colorPalette = ref([
    "#ff2500", // Red
    "#ff9305", // Orange
    "#fdfc00", // Yellow
    "#20f80f", // Green
    "#0533ff", // Blue
    "#ffffff", // White
    "#929292", // Gray
    "#000000", // Black
  ]);

  // ===== APPLICATION STATE =====
  const loading = ref(true); // Loading status
  const error = ref(false); // Error status
  const ignoreApi = ref(false); // Flag to continue without API connection

  // ===== HISTORY TRACKING FOR UNDO =====
  const history = ref<HistoryAction[]>([]);
  const maxHistoryLength = 50; // Limit history size to avoid memory issues

  // ===== COMPUTED VALUES FOR WLED API =====
  // Format JSON payload for sending to WLED API
  const wledJson = computed(() => {
    return `{"on": true,"bri": 230, "v": true, "seg": {"i":[${formattedColors.value}]}}`;
  });

  // Format pixel colors for WLED API (removes # from hex codes)
  const formattedColors = computed(() => {
    return pixelData.value
      .map((color) => `"${color || "#000000"}"`)
      .join(",")
      .replaceAll("#", "");
  });

  // ===== CORE METHODS =====

  // Save an action to history for undo functionality
  function saveToHistory(action: HistoryAction): void {
    // Add action to history
    history.value.push(action);

    // Keep history within size limit
    if (history.value.length > maxHistoryLength) {
      history.value.shift();
    }

    // Save history to localStorage
    try {
      localStorage.drawHistory = JSON.stringify(history.value);
    } catch (e) {
      console.error("Failed to save history to localStorage:", e);
    }
  }

  // Undo the last action (draw or clear)
  function undo(): void {
    if (history.value.length === 0) return;

    const lastAction = history.value.pop();

    if (lastAction?.type === "draw") {
      // Restore a single pixel
      const { index, color } = lastAction;
      pixelData.value[index] = color;
    } else if (lastAction?.type === "clear") {
      // Restore the entire grid
      pixelData.value = [...lastAction.pixels];
    }

    // Save updated history to localStorage
    try {
      localStorage.drawHistory = JSON.stringify(history.value);
    } catch (e) {
      console.error("Failed to save history to localStorage:", e);
    }

    // Save pixel data and update WLED
    saveToLocalStorage();
    sendToWled();
  }

  // Clear the screen (set all pixels to black)
  function clearScreen(): void {
    // Save current state to history for undo
    saveToHistory({
      type: "clear",
      pixels: [...pixelData.value],
    });

    // Clear grid by setting all pixels to black
    pixelData.value = Array(gridWidth.value * gridHeight.value).fill("#000000");

    // Save to localStorage and update WLED
    saveToLocalStorage();
    sendToWled();
  }

  // Initialize or reset the drawing grid
  function setupGrid(): void {
    const gridSize = gridWidth.value * gridHeight.value;

    // Clear the current pixel data
    pixelData.value = [];

    // Load from localStorage if available
    let localData: string[] = [];
    if (localStorage.pixelData) {
      try {
        localData = localStorage.pixelData.split(",");
      } catch (e) {
        console.error("Error loading from localStorage:", e);
      }
    }

    // Fill the grid with data from localStorage or default to black
    for (let i = 0; i < gridSize; i++) {
      pixelData.value.push(localData[i] || "#000000");
    }

    // Load history from localStorage
    loadHistoryFromStorage();
  }

  // Update a single pixel with a new color
  function updatePixel(index: number, newColor: string): void {
    // Don't add to history if the color is the same
    if (pixelData.value[index] === newColor) return;

    // Save the old color to history for undo before changing the pixel
    saveToHistory({
      type: "draw",
      index,
      color: pixelData.value[index],
    });

    // Update the pixel
    pixelData.value[index] = newColor;

    // Save to localStorage
    saveToLocalStorage();
  }

  // Send the current pixel data to the WLED device
  function sendToWled(): void {
    if (ignoreApi.value) return;

    fetch(apiUrl.value, {
      method: "POST",
      body: wledJson.value,
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Success - nothing specific to do
      })
      .catch((error) => {
        console.error("WLED API Error:", error);
        error.value = true;
      });
  }

  // Fetch information from the WLED device
  function fetchWledInfo(): void {
    loading.value = true;

    fetch(apiUrl.value, {
      method: "GET",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Extract WLED URL from the API URL
        const url = new URL(apiUrl.value);
        wledUrl.value = `${url.protocol}//${url.hostname}`;

        // Update grid dimensions from WLED if available
        if (data.info && data.info.leds && data.info.leds.matrix) {
          gridWidth.value = data.info.leds.matrix.w;
          gridHeight.value = data.info.leds.matrix.h;

          // Save to localStorage
          localStorage.gridWidth = gridWidth.value;
          localStorage.gridHeight = gridHeight.value;
        }

        loading.value = false;
        error.value = false;

        // Setup grid with the new dimensions
        setupGrid();
      })
      .catch((error) => {
        console.error("WLED API Error:", error);
        loading.value = false;
        error.value = true;
      });
  }

  // Continue using the app without API connection
  function ignoreApiAndContinue(): void {
    ignoreApi.value = true;
    loading.value = false;
    error.value = false;
    setupGrid();
  }

  // ===== PERSISTENCE METHODS =====

  // Save current state to localStorage
  function saveToLocalStorage(): void {
    localStorage.pixelData = pixelData.value.toString();
    localStorage.currentColor = currentColor.value;
    localStorage.colorPalette = colorPalette.value.toString();
    localStorage.gridWidth = gridWidth.value;
    localStorage.gridHeight = gridHeight.value;
    // Note: History is saved separately to avoid circular calls
  }

  // Load history from localStorage
  function loadHistoryFromStorage(): void {
    if (localStorage.drawHistory) {
      try {
        history.value = JSON.parse(localStorage.drawHistory);
      } catch (e) {
        console.error("Error loading history from localStorage:", e);
        history.value = [];
      }
    }
  }

  // Load all settings from localStorage
  function loadFromLocalStorage(): void {
    if (localStorage.currentColor) {
      currentColor.value = localStorage.currentColor;
    }

    if (localStorage.colorPalette) {
      colorPalette.value = localStorage.colorPalette.split(",");
    }

    if (localStorage.gridWidth) {
      gridWidth.value = Number(localStorage.gridWidth);
    }

    if (localStorage.gridHeight) {
      gridHeight.value = Number(localStorage.gridHeight);
    }
  }

  // ===== KEYBOARD SHORTCUTS =====

  // Setup keyboard shortcuts (Ctrl+Z for undo)
  function setupKeyboardShortcuts(): void {
    document.addEventListener("keydown", (e) => {
      // Undo shortcut: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
    });
  }

  // ===== INITIALIZATION =====

  // Initialize the application
  function initialize(): void {
    // Load settings from localStorage
    loadFromLocalStorage();

    // Set default API URL
    const defaultHost = "192.168.68.132";
    apiUrl.value = `http://${defaultHost}/json`;

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    // Fetch WLED information
    fetchWledInfo();
  }

  // ===== WATCHERS =====

  // Watch for changes to grid dimensions and update the grid
  watch([gridWidth, gridHeight], () => {
    setupGrid();
  });

  // Watch for changes to the API URL and fetch WLED info
  watch(apiUrl, () => {
    fetchWledInfo();
  });

  // Initialize on component mount
  onMounted(() => {
    initialize();
  });

  // Return everything needed by components
  return {
    // State
    apiUrl,
    wledUrl,
    cellSize,
    gridWidth,
    gridHeight,
    pixelData,
    currentColor,
    colorPalette,
    loading,
    error,
    ignoreApi,
    wledJson,

    // Methods
    updatePixel,
    sendToWled,
    undo,
    clearScreen,
    ignoreApiAndContinue,
    setupGrid,
  };
}
