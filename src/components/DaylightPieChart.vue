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
  rise: number;
  set: number;
  size?: number;
  always?: "up" | "down" | null;
  timezoneOffset?: number;
}

const props = withDefaults(defineProps<Props>(), {
  dayColor: "#ffdf22",
  nightColor: "#191970",
  size: 100,
  timezoneOffset: 0,
  always: null,
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;
function fractionForTime(time: number): number {
  return (time % MS_PER_DAY) / MS_PER_DAY;
}
const riseAngle = computed(() => fractionForTime(props.rise + props.timezoneOffset));
const daylightPercentage = computed(() => fractionForTime(props.set - props.rise));

const cssVars = computed(() => ({
  "--daylight-amount": `${(100 * daylightPercentage.value).toFixed(0)}%`,
  "--rise-angle": `${riseAngle.value.toFixed(2)}turn`,
  "--day-color": props.dayColor,
  "--night-color": props.nightColor,
  "--size": `${props.size}px`,
  "--background":
      props.always == "up" ? props.dayColor :
        (props.always == "down" ? props.nightColor :
          `conic-gradient(
             from var(--rise-angle),
             var(--day-color) 0% var(--daylight-amount),
             var(--night-color) var(--daylight-amount) 100%
           )
           `),
}));
</script>

<style scoped lang="less">
.daylight-pie-chart {
  border-radius: 50%;
  width: var(--size);
  height: var(--size);
  background: conic-gradient(
    from var(--rise-angle),
    var(--day-color) 0% var(--daylight-amount),
    var(--night-color) var(--daylight-amount) 100%
  )
}
</style>
