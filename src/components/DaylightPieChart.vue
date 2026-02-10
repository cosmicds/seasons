<template>
  <div
    class="daylight-pie-chart"
    :style="cssVars"
  >
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { dayFractionForTimestamp } from "../utils";

interface Props {
  dayColor?: string;
  nightColor?: string;
  rise: number;
  set: number;
  size?: string;
  always?: "up" | "down" | null;
  timezoneOffset?: number;
}

const props = withDefaults(defineProps<Props>(), {
  dayColor: "#ffdf22",
  nightColor: "#191970",
  size: "100px",
  timezoneOffset: 0,
  always: null,
});

const riseAngle = computed(() => dayFractionForTimestamp(props.rise + props.timezoneOffset));
const daylightPercentage = computed(() => dayFractionForTimestamp(props.set - props.rise));

const cssVars = computed(() => ({
  "--daylight-amount": `${(100 * daylightPercentage.value).toFixed(0)}%`,
  "--rise-angle": `${riseAngle.value.toFixed(2)}turn`,
  "--day-color": props.dayColor,
  "--night-color": props.nightColor,
  "--size": props.size,
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
