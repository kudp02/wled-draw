<script setup lang="ts">
import { ref, computed, watch } from "vue";

// Define props interface with native TypeScript
interface DrawingProps {
  gridWidth?: number;
  gridHeight?: number;
  cellSize?: number;
  currentColor: string;
  currentTool: string;
  brushSize: number;
  modelValue: string[];
}

// Use the generic defineProps with withDefaults
const props = withDefaults(defineProps<DrawingProps>(), {
  gridWidth: 16,
  gridHeight: 16,
  cellSize: 10,
  currentTool: "pen",
  brushSize: 1,
  modelValue: () => [],
});

// Define the emits with proper types
const emit = defineEmits<{
  "update:modelValue": [value: string[]];
  "draw-complete": [];
  undo: [];
  clear: [];
  "update-pixel": [index: number, color: string];
  "batch-update-pixels": [indices: number[], color: string]; // New emit for batch updates
}>();

// Local refs
const isMouseDown = ref(false);
const pixelData = computed(() => props.modelValue);
const lastDrawnIndex = ref<number | null>(null);
const lastDrawnIndices = ref<number[]>([]);

// Computed properties
const viewBox = computed(() => {
  return `0 0 ${props.cellSize * props.gridWidth} ${
    props.cellSize * props.gridHeight
  }`;
});

// Get the active color based on the current tool
const activeColor = computed(() => {
  return props.currentTool === "eraser" ? "#000000" : props.currentColor;
});

// Methods for drawing
function mouseDown(e: MouseEvent | TouchEvent) {
  isMouseDown.value = true;
  lastDrawnIndices.value = [];
}

function mouseUp(e: MouseEvent | TouchEvent) {
  isMouseDown.value = false;
  lastDrawnIndex.value = null;
  lastDrawnIndices.value = [];
  emit("draw-complete");
}

// Get indices covered by the brush based on center index
function getBrushIndices(centerIndex: number): number[] {
  // If brush size is 1, just return the center index
  if (props.brushSize === 1) {
    return [centerIndex];
  }

  const indices = [centerIndex];
  const centerX = centerIndex % props.gridWidth;
  const centerY = Math.floor(centerIndex / props.gridWidth);

  // Calculate the radius of pixels to affect
  const radius = Math.floor(props.brushSize / 2);

  // Add all pixels within the radius
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x === 0 && y === 0) continue; // Skip center (already added)

      const newX = centerX + x;
      const newY = centerY + y;

      // Ensure we don't go out of bounds
      if (
        newX >= 0 &&
        newX < props.gridWidth &&
        newY >= 0 &&
        newY < props.gridHeight
      ) {
        indices.push(newX + newY * props.gridWidth);
      }
    }
  }

  return indices;
}

// Modify the setColor function to use batch updates for brushes larger than 1
function setColor(e: MouseEvent) {
  const target = e.target as SVGRectElement;
  const index = parseInt(target.dataset.number || "-1");

  // Skip if we can't determine the index
  if (index === -1) return;

  // Skip if this index was just drawn to avoid multiple updates
  if (lastDrawnIndex.value === index) return;

  // Get all indices to update based on brush size
  const indicesToUpdate = getBrushIndices(index);

  // Skip indices we've already drawn in this stroke
  const newIndicesToUpdate = indicesToUpdate.filter(
    (idx) => !lastDrawnIndices.value.includes(idx)
  );
  if (newIndicesToUpdate.length === 0) return;

  // Add to last drawn indices
  lastDrawnIndex.value = index;
  lastDrawnIndices.value = [...lastDrawnIndices.value, ...newIndicesToUpdate];

  // Create a copy of the pixel data to update
  const newData = [...pixelData.value];

  // Use batch update if brush size > 1
  if (props.brushSize > 1) {
    // Filter indices where color actually needs to change
    const indicesToChange = newIndicesToUpdate.filter(
      (idx) => newData[idx] !== activeColor.value
    );

    if (indicesToChange.length > 0) {
      // Emit batch update event
      emit("batch-update-pixels", indicesToChange, activeColor.value);

      // Update local visual representation immediately
      indicesToChange.forEach((idx) => {
        newData[idx] = activeColor.value;
        const element = document.querySelector(
          `[data-number="${idx}"]`
        ) as SVGRectElement;
        if (element) {
          element.setAttribute("fill", activeColor.value);
        }
      });

      // Update the model value with all changes
      emit("update:modelValue", newData);
    }
  } else {
    // For single pixel updates, use the original approach
    // Update each pixel individually
    newIndicesToUpdate.forEach((idx) => {
      // Skip if the color is already the same
      if (newData[idx] === activeColor.value) return;

      // Emit the update-pixel event for this index
      emit("update-pixel", idx, activeColor.value);

      // Update the visual immediately
      const element = document.querySelector(
        `[data-number="${idx}"]`
      ) as SVGRectElement;
      if (element) {
        element.setAttribute("fill", activeColor.value);
      }

      // Update the data
      newData[idx] = activeColor.value;
    });

    // Update the model value with all changes
    emit("update:modelValue", newData);
  }
}

function dragColor(e: MouseEvent) {
  if (isMouseDown.value) {
    setColor(e);
  }
}

function rightClick(e: MouseEvent) {
  e.preventDefault();
  const target = e.target as SVGRectElement;
  const index = parseInt(target.dataset.number || "-1");

  // Skip if we can't determine the index
  if (index === -1) return;

  // Get all indices for the brush (for multi-pixel eraser)
  const indices = getBrushIndices(index);

  // Filter to only includes pixels that aren't already black
  const indicesToErase = indices.filter(
    (idx) => pixelData.value[idx] !== "#000000"
  );

  if (indicesToErase.length === 0) return;

  // For multiple pixels, use batch update
  if (indicesToErase.length > 1) {
    emit("batch-update-pixels", indicesToErase, "#000000");

    // Update visual immediately
    indicesToErase.forEach((idx) => {
      const element = document.querySelector(
        `[data-number="${idx}"]`
      ) as SVGRectElement;
      if (element) {
        element.setAttribute("fill", "#000000");
      }
    });

    // Update the model
    const newData = [...pixelData.value];
    indicesToErase.forEach((idx) => {
      newData[idx] = "#000000";
    });
    emit("update:modelValue", newData);
  } else {
    // For single pixel, use normal update
    emit("update-pixel", index, "#000000");

    // Update visual immediately
    target.setAttribute("fill", "#000000");

    // Update the model
    const newData = [...pixelData.value];
    newData[index] = "#000000";
    emit("update:modelValue", newData);
  }
}
</script>

<template>
  <div
    class="flex flex-col w-full h-full overflow-auto select-none"
    @mousedown="mouseDown"
    @mouseup="mouseUp"
    @touchstart="mouseDown"
    @touchend="mouseUp"
  >
    <div
      class="flex items-center justify-center bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg p-4 h-full max-h-[85vh] transition-colors duration-200"
    >
      <svg :view-box.camel="viewBox" class="w-full h-full">
        <g v-for="(_, yIndex) in gridHeight" :key="`row-${yIndex}`">
          <rect
            v-for="(_, xIndex) in gridWidth"
            :key="`cell-${xIndex}-${yIndex}`"
            :x="cellSize * xIndex"
            :y="cellSize * yIndex"
            :width="cellSize"
            :height="cellSize"
            :fill="pixelData[xIndex + gridWidth * yIndex] || '#000000'"
            :data-number="xIndex + gridWidth * yIndex"
            stroke="#374151"
            stroke-width="0.2"
            class="transition-colors duration-150 hover:opacity-90"
            @mousedown="setColor"
            @mouseover="dragColor"
            @contextmenu.prevent="rightClick"
          />
        </g>
      </svg>
    </div>
  </div>
</template>
