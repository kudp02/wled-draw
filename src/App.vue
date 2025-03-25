<script setup>
import { ref, watch } from "vue";
import DrawingCanvas from "./components/DrawingCanvas.vue";
import ColorPalette from "./components/ColorPalette.vue";
import Controls from "./components/Controls.vue";
import { useWledDraw } from "./composables/useWledDraw";

// Initialize WLED draw functionality
const {
  title,
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
  updatePixel,
  sendToWled,
  undo,
  clearScreen,
  ignoreApiAndContinue,
} = useWledDraw();

// Update pixel data when drawing
function handlePixelUpdate(index, color) {
  updatePixel(index, color);
}

// Send to WLED when drawing is complete
function handleDrawComplete() {
  sendToWled();
}
</script>

<template>
  <div class="app">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-inner">
        <div class="app-title">
          <h1>{{ title }}</h1>
        </div>

        <a class="back-to-wled" v-if="wledUrl" :href="wledUrl"
          >⬅ Go back to WLED</a
        >

        <!-- Controls -->
        <ColorPalette
          v-model="currentColor"
          v-model:palette="colorPalette"
          :cell-size="cellSize"
        />

        <Controls
          v-model:api-url="apiUrl"
          v-model:grid-width="gridWidth"
          v-model:grid-height="gridHeight"
          v-model:nightlight-timer="nightlightTimer"
          :wled-json="wledJson"
          @clear="clearScreen"
          @undo="undo"
        />

        <a href="https://studioalloy.nl" class="powered-by">
          <img
            src="https://studioalloy.nl/_nuxt/img/a293d3c.svg"
            alt="Studio Alloy Logo"
          />
          <div>
            <span>Powered by</span>
            <span>Studio Alloy</span>
          </div>
        </a>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Loading/Error Notifications -->
      <div class="container" v-if="loading || error">
        <div class="notice" v-if="loading && !error">
          <h3>
            We're currently loading your settings. Make sure your matrix is
            setup correctly. <i>Fetching {{ apiUrl }}</i>
          </h3>
          <p>
            If you keep seeing this make sure you update your API endpoint url
            eg <i>`http://[device_ip_address]/json`</i>
          </p>
        </div>

        <div class="notice error" v-if="error">
          <h3>
            We could not fetch your settings at <i>{{ apiUrl }}</i>
          </h3>
          <p>
            You can change the url manually
            <input type="text" v-model="apiUrl" />
          </p>
          <p>Or just use the tool without the API connected</p>
          <button class="btn-alt" @click="ignoreApiAndContinue">
            Just use the tool
          </button>
        </div>
      </div>

      <!-- Drawing Canvas -->
      <DrawingCanvas
        v-if="!loading"
        :grid-width="gridWidth"
        :grid-height="gridHeight"
        :cell-size="cellSize"
        :current-color="currentColor"
        v-model="pixelData"
        @draw-complete="handleDrawComplete"
      />
    </main>
  </div>
</template>

<style>
/* Global styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

a {
  color: #0094ff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  margin-bottom: 0.5rem;
}

/* App layout */
.app {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 300px;
  background-color: #fff;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}

.sidebar-inner {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
}

.app-title {
  margin-bottom: 1rem;
}

.description {
  font-size: 0.9rem;
  color: #666;
}

.back-to-wled {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #0094ff;
  color: white;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.back-to-wled:hover {
  background-color: #007acc;
  text-decoration: none;
}

.main-content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.container {
  width: 100%;
  max-width: 800px;
}

.notice {
  padding: 1.5rem;
  background-color: #e0f7fa;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.notice.error {
  background-color: #ffebee;
}

.powered-by {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.powered-by img {
  width: 30px;
  height: 30px;
}

.powered-by div {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.powered-by div span:first-child {
  font-size: 0.8rem;
  color: #666;
}

/* Button styles */
.btn-alt {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-alt:hover {
  background-color: #d0d0d0;
}
</style>
