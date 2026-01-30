<template>
  <div
    class="daylight-pie-chart"
    :style="cssVars"
  >
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  dayColor?: string;
  nightColor?: string;
  rise?: number;
  set?: number;
}

const props = withDefaults(defineProps<Props>(), {
  dayColor: "#ffdf22",
  nightColor: "#191970",
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;
function fractionForTime(time: number): string {
  return (time / MS_PER_DAY).toFixed(2);
}
const riseAngle = computed(() => fractionForTime(props.rise));
const setAngle = computed(() => fractionForTime(props.set));

const cssVars = computed(() => ({
  "--rise-angle": `${riseAngle.value}turn`,
  "--set-angle": `${setAngle.value}turn`,
  "--day-color": props.dayColor,
  "--night-color": props.nightColor,
}));
</script>

<style scoped lang="less">
.daylight-pie-chart {
  background: conic-gradient(
    var(--day-color) var(--rise-angle) var(--set-angle),
    var(--night-color) var(--set-angle) var(--rise-angle)
  )
}
</style>
