<template>
  <div class="controls">
    <div class="control-buttons">
      <button @click="$emit('clear')">Clear Screen</button>
      <button @click="$emit('undo')">Undo (Ctrl+Z)</button>
      <button class="btn-alt" @click="showAdvanced = !showAdvanced">
        Advanced Settings
      </button>
    </div>

    <div v-if="showAdvanced" class="advanced-settings">
      <div class="control-group">
        <label for="wled-url">API URL</label>
        <input
          type="text"
          id="wled-url"
          v-model="apiUrl"
          @change="updateApiUrl"
        />
      </div>

      <div class="control-flex">
        <div class="control-group">
          <label for="grid-width">Matrix W</label>
          <input
            type="number"
            id="grid-width"
            v-model.number="gridWidth"
            @change="updateGridWidth"
            min="1"
            inputmode="numeric"
          />
        </div>
        <div class="control-group">
          <label for="grid-height">Matrix H</label>
          <input
            type="number"
            id="grid-height"
            v-model.number="gridHeight"
            @change="updateGridHeight"
            min="1"
            inputmode="numeric"
          />
        </div>
      </div>

      <div class="control-group">
        <label for="timer">Timer (nightlight)</label>
        <p class="description">
          Set a nightlight timer to {{ nightlightTimer }} minutes. If zero, no
          timer would be set
        </p>
        <input
          type="number"
          id="timer"
          v-model.number="nightlightTimer"
          @change="updateNightlightTimer"
          min="0"
          inputmode="numeric"
        />
      </div>

      <div class="control-group">
        <label>Save preset manually</label>
        <pre ref="jsonDisplay">{{ wledJson }}</pre>
        <p v-if="copyFailed">Failed to copy text, try copying manually.</p>
        <button @click="copyPreset">
          <span v-if="!copied">Copy preset</span>
          <span v-if="copied">Copied!</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  apiUrl: {
    type: String,
    default: "",
  },
  gridWidth: {
    type: Number,
    default: 16,
  },
  gridHeight: {
    type: Number,
    default: 16,
  },
  nightlightTimer: {
    type: Number,
    default: 0,
  },
  wledJson: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  "update:apiUrl",
  "update:gridWidth",
  "update:gridHeight",
  "update:nightlightTimer",
  "clear",
  "undo",
]);

// Local state
const showAdvanced = ref(false);
const copied = ref(false);
const copyFailed = ref(false);
const apiUrl = ref(props.apiUrl);
const gridWidth = ref(props.gridWidth);
const gridHeight = ref(props.gridHeight);
const nightlightTimer = ref(props.nightlightTimer);
const jsonDisplay = ref(null);

// Methods
function updateApiUrl() {
  emit("update:apiUrl", apiUrl.value);
}

function updateGridWidth() {
  emit("update:gridWidth", gridWidth.value);
}

function updateGridHeight() {
  emit("update:gridHeight", gridHeight.value);
}

function updateNightlightTimer() {
  emit("update:nightlightTimer", nightlightTimer.value);
}

function copyPreset() {
  if (location.protocol !== "https:") {
    const textToCopy = jsonDisplay.value.innerText;

    const textarea = document.createElement("textarea");
    textarea.value = textToCopy;
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      copied.value = true;
      setTimeout(() => (copied.value = false), 2000);
    } catch (err) {
      copyFailed.value = true;
      setTimeout(() => (copyFailed.value = false), 2000);
    } finally {
      document.body.removeChild(textarea);
    }
  } else {
    const textToCopy = jsonDisplay.value.innerText;
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        copied.value = true;
        setTimeout(() => (copied.value = false), 2000);
      },
      () => {
        copyFailed.value = true;
        setTimeout(() => (copyFailed.value = false), 2000);
      }
    );
  }
}

// Watch for prop changes
watch(
  () => props.apiUrl,
  (newValue) => {
    apiUrl.value = newValue;
  }
);

watch(
  () => props.gridWidth,
  (newValue) => {
    gridWidth.value = newValue;
  }
);

watch(
  () => props.gridHeight,
  (newValue) => {
    gridHeight.value = newValue;
  }
);

watch(
  () => props.nightlightTimer,
  (newValue) => {
    nightlightTimer.value = newValue;
  }
);
</script>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.control-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.advanced-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.control-group {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.control-flex {
  display: flex;
  gap: 1rem;
}

.control-flex .control-group {
  flex: 1;
}

label {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

input {
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: #0094ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

button:hover {
  background-color: #007acc;
}

button.btn-alt {
  background-color: #e0e0e0;
  color: #333;
}

button.btn-alt:hover {
  background-color: #d0d0d0;
}

pre {
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9rem;
}

.description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}
</style>
