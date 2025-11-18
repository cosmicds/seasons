<template>
  <v-card
    class="question-root"
    :color="color"
    :style="css"
  >
    <template #title>
      <div class="question-title">
        {{ question }} 
      </div>
     <v-btn
        density="compact"
        class="close-button"
        icon="mdi-close"
        @click="emit('dismiss', response)"
      ></v-btn>
    </template>
    <v-card-text>
      <v-form
        @submit.prevent="emit('finish', response)"
      >
        <v-expand-transition>
          <VTextarea
            v-model="response"
            class="response-box text-body-2"
            :placeholder="commentPlaceholder"
            max-rows="4"
            density="compact"
            width="100%"
            @keydown.stop
          >
          </VTextarea>
        </v-expand-transition>
        <v-expand-transition>
          <div class="button-row">
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
      <div>
        <span class="info-text">
          Your anonymous response will be used by the CosmicDS team to improve the educational experience.
        </span>
      </div>
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
  commentPlaceholder?: string;
  color?: string;
  baseColor?: string;
}

withDefaults(defineProps<QuestionProps>(), {
  question: "Share an “aha” moment about seasons that you experienced from using this app.",
  commentPlaceholder: "Share your moment here.",
  color: "surface",
});

const emit = defineEmits<{
  (event: "dismiss", response: string | null): void;
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

.rating-notification {
  border-radius: 5px;
  font-size: calc(1.1 * var(--default-font-size));
  padding: 1em;
  color: white;

  &.success {
    background-color: #9a009a;
  }
  &.error {
    background-color: #b30000;
  }
}

.response-box {
  width: 75%;
}

.v-card-text {
  width: 90%;
}

.v-card-actions {
  display: var(--footer-visible);
}

.close-button {
  display: absolute;
  top: 2px;
  right: 2px;
}

.question-title {
  font-size: 0.9rem;
  width: 100%;
  text-align: center;
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
  justify-content: space-between;
}

.info-text {
  font-size: 0.75rem;
  color: lightgray;
}

.close-button {
  position: absolute !important;
  top: 5px;
  right: 5px;
}
</style>
