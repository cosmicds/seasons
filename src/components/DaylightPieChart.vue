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
const daylightFraction = computed(() => dayFractionForTimestamp(props.set - props.rise));

const halfTransitionTurnSize = 0.01;

const cssVars = computed(() => {
  const dawnStart = `${(riseAngle.value - halfTransitionTurnSize).toFixed(2)}turn`;
  const dawnEnd = `${(riseAngle.value + halfTransitionTurnSize).toFixed(2)}turn`;
  const duskStart = `${(riseAngle.value + daylightFraction.value - halfTransitionTurnSize).toFixed(2)}turn`;
  const duskEnd = `${(riseAngle.value + daylightFraction.value + halfTransitionTurnSize).toFixed(2)}turn`;
  return {
    "--day-color": props.dayColor,
    "--night-color": props.nightColor,
    "--size": props.size,

    "--background":
        props.always == "up" ? props.dayColor :
          (props.always == "down" ? props.nightColor :
            `conic-gradient(
               var(--night-color) ${dawnStart},
               var(--day-color) ${dawnEnd} ${duskStart},
               var(--night-color) ${duskEnd} 100%
             )
             `),
  };
});
</script>

<style scoped lang="less">
.daylight-pie-chart {
  border-radius: 50%;
  width: var(--size);
  height: var(--size);
  background: var(--background);
}
</style>
