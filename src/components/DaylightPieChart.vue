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

// Since noon is at the top, we need to shift everything for half a turn
function turnsForDayFraction(fraction: number): number {
  return (fraction + 0.5) % 1;
}

const halfTransitionTurnSize = 0.02;

const cssVars = computed(() => {
  const dawnStart = `${turnsForDayFraction(riseAngle.value - halfTransitionTurnSize).toFixed(2)}turn`;
  const dawnEnd = `${turnsForDayFraction(riseAngle.value + halfTransitionTurnSize).toFixed(2)}turn`;
  const duskStart = `${turnsForDayFraction(riseAngle.value + daylightFraction.value - halfTransitionTurnSize).toFixed(2)}turn`;
  const duskEnd = `${turnsForDayFraction(riseAngle.value + daylightFraction.value + halfTransitionTurnSize).toFixed(2)}turn`;
  return {
    "--day-color": props.dayColor,
    "--night-color": props.nightColor,
    "--size": props.size,

    "--background":
        props.always == "up" ? props.dayColor :
          (props.always == "down" ? props.nightColor :
            `conic-gradient(
               var(--day-color) 0 ${duskStart},
               var(--night-color) ${duskEnd} ${dawnStart},
               var(--day-color) ${dawnEnd}
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
