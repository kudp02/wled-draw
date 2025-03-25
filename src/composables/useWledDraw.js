import { ref, computed, watch, onMounted } from "vue";

export function useWledDraw() {
  // State variables
  const title = ref("Draw Something");
  const version = ref("2.0");
  const apiUrl = ref("");
  const wledUrl = ref("");
  const cellSize = ref(10);
  const gridWidth = ref(16);
  const gridHeight = ref(16);
  const nightlightTimer = ref(0);
  const pixelData = ref([]);
  const currentColor = ref("#ff2500");
  const colorPalette = ref([
    "#ff2500",
    "#ff9305",
    "#fdfc00",
    "#20f80f",
    "#0533ff",
    "#ffffff",
    "#929292",
    "#000000",
  ]);

  // App state
  const loading = ref(true);
  const error = ref(false);
  const ignoreApi = ref(false);

  // History tracking for undo
  const history = ref([]);
  const maxHistoryLength = 50;

  // Computed values for the WLED API
  const wledJson = computed(() => {
    return `{"on": true,"bri": 128,${nightlightTimerString.value} "v": true, "seg": {"i":[${formattedColors.value}]}}`;
  });

  const nightlightTimerString = computed(() => {
    if (nightlightTimer.value > 0) {
      return `"nl": {"on": true, "dur": ${nightlightTimer.value}},`;
    }
    return "";
  });

  const formattedColors = computed(() => {
    // Create a new array to hold the rearranged colors
    let serpentine = [];

    // Loop through each row
    for (let y = 0; y < gridHeight.value; y++) {
      // Get the colors for this row
      const rowStart = y * gridWidth.value;
      const rowEnd = rowStart + gridWidth.value;
      const rowColors = pixelData.value.slice(rowStart, rowEnd);

      // If this is an even-indexed row (0, 2, 4, etc.), the direction is left to right
      // If this is an odd-indexed row (1, 3, 5, etc.), the direction is right to left
      const isReversedRow = y % 2 !== 0;

      // Add the colors to the serpentine array in the correct order for this row
      if (isReversedRow) {
        // For odd-indexed rows, reverse the order
        serpentine = serpentine.concat([...rowColors].reverse());
      } else {
        // For even-indexed rows, keep the original order
        serpentine = serpentine.concat(rowColors);
      }
    }

    // Format the colors for the JSON API
    return serpentine
      .map((color) => `"${color}"`)
      .join(",")
      .replaceAll("#", "");
  });

  // Methods
  function saveToHistory(action) {
    history.value.push(action);
    // Limit history size to avoid memory issues
    if (history.value.length > maxHistoryLength) {
      history.value.shift();
    }

    // Save to localStorage
    saveToLocalStorage();
  }

  function undo() {
    if (history.value.length === 0) return;

    const lastAction = history.value.pop();

    if (lastAction.type === "draw") {
      // Restore a single pixel
      const { index, color } = lastAction;
      pixelData.value[index] = color;
    } else if (lastAction.type === "clear") {
      // Restore the entire grid
      pixelData.value = [...lastAction.pixels];
    }

    // Save to localStorage and update WLED
    saveToLocalStorage();
    sendToWled();
  }

  function clearScreen() {
    // Save current state to history
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

  function setupGrid() {
    const gridSize = gridWidth.value * gridHeight.value;

    // Clear the current pixel data
    pixelData.value = [];

    // Load from localStorage if available
    let localData = [];
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
  }

  function updatePixel(index, newColor) {
    // Save the old color to history for undo
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

  function sendToWled() {
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
        console.log("WLED API response:", data);
      })
      .catch((error) => {
        console.error("WLED API Error:", error);
        error.value = true;
      });
  }

  function fetchWledInfo() {
    loading.value = true;

    fetch(apiUrl.value, {
      method: "GET",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("WLED API info:", data);

        // Extract WLED URL from the API URL
        const url = new URL(apiUrl.value);
        wledUrl.value = `${url.protocol}//${url.hostname}`;

        // Update grid dimensions from WLED
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

  function ignoreApiAndContinue() {
    ignoreApi.value = true;
    loading.value = false;
    error.value = false;
    setupGrid();
  }

  function saveToLocalStorage() {
    // Save everything to localStorage
    localStorage.pixelData = pixelData.value.toString();
    localStorage.currentColor = currentColor.value;
    localStorage.colorPalette = colorPalette.value.toString();
    localStorage.gridWidth = gridWidth.value;
    localStorage.gridHeight = gridHeight.value;
    localStorage.nightlightTimer = nightlightTimer.value;
  }

  function loadFromLocalStorage() {
    // Load from localStorage
    if (localStorage.currentColor) {
      currentColor.value = localStorage.currentColor;
    }

    if (localStorage.colorPalette) {
      colorPalette.value = localStorage.colorPalette.split(",");
    }

    if (localStorage.nightlightTimer) {
      nightlightTimer.value = Number(localStorage.nightlightTimer);
    }

    if (localStorage.gridWidth) {
      gridWidth.value = Number(localStorage.gridWidth);
    }

    if (localStorage.gridHeight) {
      gridHeight.value = Number(localStorage.gridHeight);
    }
  }

  // Setup keyboard shortcuts
  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Undo shortcut: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
    });
  }

  // Initialize the app
  function initialize() {
    // Load from localStorage first
    loadFromLocalStorage();

    // Detect demo mode
    const host = window.location.host;

    // Set default API URL
    apiUrl.value = `http://${host}/json`;

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    // Fetch WLED info
    fetchWledInfo();
  }

  // Watch for changes to grid dimensions and update the grid
  watch([gridWidth, gridHeight], () => {
    setupGrid();
  });

  // Watch for changes to the API URL and fetch WLED info
  watch(apiUrl, () => {
    fetchWledInfo();
  });

  // Use in the component
  onMounted(() => {
    initialize();
  });

  // Return everything needed
  return {
    // State
    title,
    version,
    apiUrl,
    wledUrl,
    cellSize,
    gridWidth,
    gridHeight,
    nightlightTimer,
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
