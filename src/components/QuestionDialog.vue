<template>
  <v-card
    class="question-root"
    :color="color"
    :style="css"
  >
    <v-btn
      density="compact"
      class="close-button"
      icon="mdi-close"
      @click="emit('dismiss', response)"
    ></v-btn>
    <v-card-text>
      <div class="question-title">
        {{ question }} 
      </div>
      <v-form
        @submit.prevent="() => { emit('finish', response); response = null; }"
      >
        <v-expand-transition>
          <VTextarea
            v-model="response"
            class="response-box text-body-2"
            max-rows="4"
            density="compact"
            width="100%"
            @keydown.stop
          >
          </VTextarea>
        </v-expand-transition>
        <div class="mb-4">
          <span class="info-text">
            Your anonymous response will be used by the CosmicDS team to improve the educational experience.
          </span>
        </div>
        <v-expand-transition>
          <div class="button-row">
            <v-btn
              color="#BDBDBD"
              size="small"
              variant="text"
              @click="emit('opt-out')"
            >
              Don't show this again
            </v-btn>
            <v-btn
              type="submit"
              width="fit-content"
              color="success"
            >
              Submit 
            </v-btn>
          </div>
        </v-expand-transition>
      </v-form>
    </v-card-text>
    <template #actions>
      <slot name="footer"></slot>
    </template>
  </v-card>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/naming-convention */
import { computed, ref, useSlots } from "vue";

interface QuestionProps {
  question?: string;
  color?: string;
  baseColor?: string;
}

withDefaults(defineProps<QuestionProps>(), {
  question: "Share an “aha” moment about seasons that you experienced from using this app.",
  color: "surface",
});

const emit = defineEmits<{
  (event: "dismiss", response: string | null): void;
  (event: "opt-out"): void;
  (event: "finish", response: string | null): void;
}>();

const slots = useSlots();
const showFooter = computed(() => !!slots.footer);

const css = computed(() => ({
  "--footer-visible": showFooter.value ? "visible" : "none",
}));

const response = ref<string | null>(null);
</script>

<style lang="less">
.question-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  padding: 5px;
  max-width: 45%;
}

.rating {
  transition: color 0.1s;
}

.selected {
  border-radius: 50%;
  box-shadow: 0 0 0 5px silver;
}

.v-card-text {
  padding: 2rem;
}

.v-card-actions {
  display: var(--footer-visible);
}

.question-title {
  width: 100%;
  text-align: left;
  padding: 5px;
  white-space: normal;
  word-break: auto-phrase;
}

.question-text {
  max-width: calc(100% - 30px);
}

.button-row {
  display: flex;
  flex-direction: row;
  justify-content: right;
  align-items: center;
  gap: 1.5rem;
}

.info-text {
  font-size: 0.75rem;
  color: lightgray;
}

.close-button {
  position: absolute !important;
  top: 0.5rem;
  right: 0.5rem;
}
</style>
