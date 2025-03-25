<template>
  <div class="color-palette">
    <div class="current-color">
      <label for="color-picker">Current Color</label>
      <input 
        type="color" 
        id="color-picker" 
        v-model="localColor"
        @change="updateColor"
      >
    </div>
    
    <div class="palette-history">
      <label>Palette History</label>
      <svg :view-box.camel="viewBoxPalette">
        <g v-for="(item, yIndex) in yPalette" :key="`palette-row-${yIndex}`">
          <rect 
            v-for="(item, xIndex) in xPalette" 
            :key="`palette-cell-${xIndex}-${yIndex}`"
            :x="cellSize * xIndex" 
            :y="cellSize * yIndex" 
            :width="cellSize"
            :height="cellSize" 
            stroke="#0c162d"
            :fill="paletteColors[xIndex + xPalette * yIndex]"
            @click="selectColor(paletteColors[xIndex + xPalette * yIndex])"
            :data-number="xIndex + xPalette * yIndex" 
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '#ff2500'
  },
  palette: {
    type: Array,
    default: () => [
      "#ff2500", "#ff9305", "#fdfc00", "#20f80f",
      "#0533ff", "#ffffff", "#929292", "#000000"
    ]
  },
  cellSize: {
    type: Number,
    default: 10
  }
});

const emit = defineEmits(['update:modelValue', 'update:palette']);

// Local state
const localColor = ref(props.modelValue);
const paletteColors = ref(props.palette);
const xPalette = ref(4);
const yPalette = ref(2);

// Computed
const viewBoxPalette = computed(() => {
  return `0 0 ${props.cellSize * xPalette.value} ${props.cellSize * yPalette.value}`;
});

// Methods
function updateColor() {
  emit('update:modelValue', localColor.value);
  
  // Update palette history
  if (!paletteColors.value.includes(localColor.value)) {
    const newPalette = [...paletteColors.value];
    newPalette.pop();
    newPalette.unshift(localColor.value);
    paletteColors.value = newPalette;
    emit('update:palette', newPalette);
  }
}

function selectColor(color) {
  localColor.value = color;
  emit('update:modelValue', color);
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  localColor.value = newValue;
});

watch(() => props.palette, (newValue) => {
  paletteColors.value = newValue;
});
</script>

<style scoped>
.color-palette {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input[type="color"] {
  width: 100%;
  height: 40px;
  cursor: pointer;
}

.palette-history svg {
  width: 100%;
  height: auto;
  cursor: pointer;
}
</style>