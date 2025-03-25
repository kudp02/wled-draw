<template>
  <div 
    class="drawing-canvas"
    @mousedown="mouseDown" 
    @mouseup="mouseUp"
    @touchstart="mouseDown" 
    @touchend="mouseUp"
  >
    <svg :view-box.camel="viewBox">
      <g v-for="(item, yIndex) in gridHeight" :key="`row-${yIndex}`">
        <rect
          v-for="(item, xIndex) in gridWidth"
          :key="`cell-${xIndex}-${yIndex}`"
          :x="cellSize * xIndex"
          :y="cellSize * yIndex"
          :width="cellSize"
          :height="cellSize"
          :fill="pixelData[xIndex + gridWidth * yIndex] || '#000000'"
          :data-number="xIndex + gridWidth * yIndex"
          stroke="#19233b"
          @mousedown="setColor"
          @mouseover="dragColor"
          @contextmenu.prevent="rightClick"
        />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  gridWidth: {
    type: Number,
    default: 16
  },
  gridHeight: {
    type: Number,
    default: 16
  },
  cellSize: {
    type: Number,
    default: 10
  },
  currentColor: {
    type: String,
    required: true
  },
  modelValue: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'draw-complete']);

// Local refs
const isMouseDown = ref(false);
const pixelData = computed(() => props.modelValue);

// Computed properties
const viewBox = computed(() => {
  return `0 0 ${props.cellSize * props.gridWidth} ${props.cellSize * props.gridHeight}`;
});

// Methods for drawing
function mouseDown(e) {
  isMouseDown.value = true;
}

function mouseUp(e) {
  isMouseDown.value = false;
  emit('draw-complete');
}

function setColor(e) {
  const index = e.target.dataset.number;
  const oldColor = pixelData.value[index];
  
  const newData = [...pixelData.value];
  newData[index] = props.currentColor;
  
  e.target.setAttribute("fill", props.currentColor);
  emit('update:modelValue', newData);
}

function dragColor(e) {
  if (isMouseDown.value) {
    setColor(e);
  }
}

function rightClick(e) {
  const index = e.target.dataset.number;
  const oldColor = pixelData.value[index];
  
  const newData = [...pixelData.value];
  newData[index] = '#000000';
  
  e.target.setAttribute("fill", '#000000');
  emit('update:modelValue', newData);
}
</script>

<style scoped>
.drawing-canvas {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  overflow: auto;
  user-select: none;
}

svg {
  width: 100%;
  height: auto;
  max-height: 70vh;
}
</style>