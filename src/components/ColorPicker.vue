<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";

interface ColorPickerProps {
  modelValue: string;
  initialPalette?: string[];
  cellSize?: number;
  expanded?: boolean;
}

const props = withDefaults(defineProps<ColorPickerProps>(), {
  modelValue: "#ff2500",
  initialPalette: () => [
    "#ff2500",
    "#ff9305",
    "#fdfc00",
    "#20f80f",
    "#0533ff",
    "#8A2BE2",
    "#ffffff",
    "#000000",
  ],
  cellSize: 10,
  expanded: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:expanded", value: boolean): void;
}>();

// Local state
const localColor = ref(props.modelValue);
const colorHistory = ref<string[]>([]);
const xPalette = ref(4);
const yPalette = ref(2);
const showPalette = ref(false);
const hexInput = ref(props.modelValue);
const rgbValues = ref({ r: 0, g: 0, b: 0 });
const isExpanded = ref(props.expanded);

// Calculate RGB values from hex
const updateRgbValues = (hex: string) => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  rgbValues.value = { r, g, b };
};

// Update hex from RGB values
const updateHexFromRgb = () => {
  const { r, g, b } = rgbValues.value;
  const hexR = r.toString(16).padStart(2, "0");
  const hexG = g.toString(16).padStart(2, "0");
  const hexB = b.toString(16).padStart(2, "0");
  localColor.value = `#${hexR}${hexG}${hexB}`;
  hexInput.value = localColor.value;

  // Emit the change to the parent
  emit("update:modelValue", localColor.value);
};

// Computed
const viewBoxPalette = computed(() => {
  return `0 0 ${props.cellSize * xPalette.value} ${
    props.cellSize * yPalette.value
  }`;
});

const textColor = computed(() => {
  const { r, g, b } = rgbValues.value;
  // Determine if text should be white or black based on color brightness
  return r * 0.299 + g * 0.587 + b * 0.114 > 140 ? "#000000" : "#ffffff";
});

// Methods
function updateColor() {
  emit("update:modelValue", localColor.value);
  updateRgbValues(localColor.value);
  hexInput.value = localColor.value;

  // Add to color history if not already present
  addToColorHistory(localColor.value);
}

function addToColorHistory(color: string) {
  // Check if color is already in history
  if (!colorHistory.value.includes(color)) {
    // Add to beginning of history, limit to 8 colors
    colorHistory.value = [color, ...colorHistory.value.slice(0, 7)];
  }
}

function selectColor(color: string) {
  localColor.value = color;
  hexInput.value = color;
  updateRgbValues(color);
  emit("update:modelValue", color);
}

function handleHexInput() {
  // Validate hex code format
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  if (hexRegex.test(hexInput.value)) {
    localColor.value = hexInput.value;
    updateRgbValues(hexInput.value);
    updateColor();
  } else if (hexInput.value.length === 7) {
    // Fallback to previous value if invalid
    hexInput.value = localColor.value;
  }
}

function togglePalette() {
  showPalette.value = !showPalette.value;
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
  emit("update:expanded", isExpanded.value);
}

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    localColor.value = newValue;
    hexInput.value = newValue;
    updateRgbValues(newValue);
  }
);

watch(
  () => props.expanded,
  (newValue) => {
    isExpanded.value = newValue;
  }
);

watch(
  () => rgbValues.value,
  () => {
    updateHexFromRgb();
  },
  { deep: true }
);

// Initialize values on mount
onMounted(() => {
  updateRgbValues(localColor.value);
  // Initialize history with current color and initial palette
  colorHistory.value = [
    props.modelValue,
    ...props.initialPalette.filter((color) => color !== props.modelValue),
  ].slice(0, 8);
});
</script>

<template>
  <div
    class="w-full bg-gray-50 dark:bg-dark-accent rounded-xl overflow-hidden shadow-md transition-colors duration-200 flex-shrink-0"
  >
    <!-- Component Header / Toggle Button -->
    <div
      class="flex justify-between items-center px-4 py-3 cursor-pointer select-none bg-gray-100 dark:bg-dark-accent transition-colors duration-200"
      @click="toggleExpanded"
    >
      <h3 class="m-0 text-base font-medium text-gray-700 dark:text-dark-text">
        Color Picker
      </h3>
      <div class="flex items-center">
        <div
          class="w-6 h-6 rounded-md mr-2"
          :style="{ backgroundColor: localColor }"
        ></div>
        <svg
          class="w-5 h-5 transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </div>
    </div>

    <!-- Collapsible Content -->
    <div v-show="isExpanded" class="transition-all duration-300">
      <!-- Color Preview -->
      <div
        class="w-full h-20 flex items-center justify-center font-semibold text-lg transition-colors duration-300"
        :style="{ backgroundColor: localColor, color: textColor }"
      >
        <span class="tracking-wider">{{ localColor }}</span>
      </div>

      <!-- Controls Container -->
      <div
        class="p-4 bg-white dark:bg-dark-secondary transition-colors duration-200"
      >
        <!-- Color Input & Hex Input -->
        <div class="flex gap-3 mb-4">
          <input
            type="color"
            id="color-picker"
            v-model="localColor"
            @change="updateColor"
            class="h-10 w-16 cursor-pointer bg-transparent rounded-lg"
          />
          <div class="flex-1">
            <input
              type="text"
              v-model="hexInput"
              @change="handleHexInput"
              maxlength="7"
              placeholder="#RRGGBB"
              class="w-full h-10 px-3 py-2 border border-gray-200 dark:border-gray-600 dark:bg-dark-accent dark:text-dark-text rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>
        </div>

        <!-- RGB Sliders -->
        <div class="space-y-3">
          <!-- Red Slider -->
          <div class="flex items-center gap-3">
            <span class="w-5 font-semibold text-center dark:text-dark-text"
              >R</span
            >
            <div class="relative flex-1 h-6">
              <input
                type="range"
                v-model.number="rgbValues.r"
                min="0"
                max="255"
                class="absolute w-full h-2 appearance-none bg-gradient-to-r from-black to-red-600 rounded-full outline-none top-2"
              />
            </div>
            <span class="w-9 text-right font-mono dark:text-dark-text">{{
              rgbValues.r
            }}</span>
          </div>

          <!-- Green Slider -->
          <div class="flex items-center gap-3">
            <span class="w-5 font-semibold text-center dark:text-dark-text"
              >G</span
            >
            <div class="relative flex-1 h-6">
              <input
                type="range"
                v-model.number="rgbValues.g"
                min="0"
                max="255"
                class="absolute w-full h-2 appearance-none bg-gradient-to-r from-black to-green-600 rounded-full outline-none top-2"
              />
            </div>
            <span class="w-9 text-right font-mono dark:text-dark-text">{{
              rgbValues.g
            }}</span>
          </div>

          <!-- Blue Slider -->
          <div class="flex items-center gap-3">
            <span class="w-5 font-semibold text-center dark:text-dark-text"
              >B</span
            >
            <div class="relative flex-1 h-6">
              <input
                type="range"
                v-model.number="rgbValues.b"
                min="0"
                max="255"
                class="absolute w-full h-2 appearance-none bg-gradient-to-r from-black to-blue-600 rounded-full outline-none top-2"
              />
            </div>
            <span class="w-9 text-right font-mono dark:text-dark-text">{{
              rgbValues.b
            }}</span>
          </div>
        </div>
      </div>

      <!-- Color History Section -->
      <div
        class="border-t border-gray-200 dark:border-gray-700 transition-colors duration-200"
      >
        <!-- History Header -->
        <div
          class="flex justify-between items-center px-4 py-3 cursor-pointer select-none"
          @click="togglePalette"
        >
          <h3
            class="m-0 text-base font-medium text-gray-700 dark:text-dark-text transition-colors duration-200"
          >
            Color History
          </h3>
          <span
            class="text-gray-500 dark:text-gray-400 transition-colors duration-200"
            >{{ showPalette ? "▲" : "▼" }}</span
          >
        </div>

        <!-- History Grid -->
        <div
          v-show="showPalette"
          class="grid grid-cols-8 gap-2 px-4 pb-4 transition-all duration-300"
        >
          <div
            v-for="(color, index) in colorHistory"
            :key="`history-color-${index}`"
            class="aspect-square rounded-md cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
            :style="{ backgroundColor: color }"
            @click="selectColor(color)"
            :title="color"
          >
            <span
              v-if="color === localColor"
              class="text-white text-base"
              :style="{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }"
              >✓</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
