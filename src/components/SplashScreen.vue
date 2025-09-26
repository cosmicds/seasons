<template>
  <v-overlay
    :model-value="showSplashScreen"
    absolute
    opacity="0.6"
    :style="cssVars"
    id="splash-overlay"
  >
    <focus-trap>
    <div
      id="splash-screen"
      v-click-outside="closeSplashScreen"
      :style="cssVars"
    >
      <div
        id="first-splash-row"
      >
        <font-awesome-icon
          id="close-splash-button"
          @click="closeSplashScreen"
          @keyup.enter="closeSplashScreen"
          icon="xmark"
          tabindex="0"
          />
        <div id="splash-screen-text">
          <p>The Sun's Seasonal Journey</p>
        </div>
      </div>

      <div id="location-input-section">
        <p class="location-prompt">Enter a location:</p>
        <location-search
          :class="['splash-location-search']"
          small
          button-size="large"
          :accent-color="cssVars['--accent-color']"
          :search-provider="searchProvider"
          @set-location="handleLocationSet"
          @error="searchErrorMessage = $event"
          placeholder="Enter city, state, or address"
        >
        </location-search>
        <div v-if="searchErrorMessage" class="error-message">
          {{ searchErrorMessage }}
        </div>
      </div>
      <div>
        <p class="medium">or</p>
      </div>
      <div>
        <v-btn
          class="splash-get-started"
          @click="closeSplashScreen"
          @keyup.enter="closeSplashScreen"
          :color="cssVars['--accent-color']"
          :density="$vuetify.display.xs ? 'compact' : 'default'"
          :size="$vuetify.display.width < 250 ? 'large' : 'x-large'"
          variant="elevated"
          rounded="lg"
        >
          Use Cambridge, MA
        </v-btn>
      </div>
    
      <div id="splash-screen-acknowledgements">
        <span>
        Brought to you by <a href="https://www.cosmicds.cfa.harvard.edu/" target="_blank" rel="noopener noreferrer">Cosmic Data Stories</a> and <a href="https://www.worldwidetelescope.org/home/" target="_blank" rel="noopener noreferrer">WorldWide Telescope</a>.
        </span>
        <div id="splash-screen-logos">
          <credit-logos/>
        </div>
      </div>
    </div>
    </focus-trap>
  </v-overlay>
</template>


<script setup lang="ts">
import {computed, defineProps, ref } from 'vue';
import { MapBoxFeature, MapBoxFeatureCollection, geocodingInfoForSearch } from "@cosmicds/vue-toolkit/src/mapbox";

export interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cssVars?: any;
  title: string;
  color?: string,
  highlightColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  cssVars: () => ({}),
});

const cssVars = computed(() => {
  return {
    ...props.cssVars,
    ...{'--accent-color': props.color == null ? props.cssVars['--accent-color'] : props.color},
  };
});

const emits = defineEmits(['close', 'location-selected']);

const showSplashScreen = defineModel({ default: true });
const searchErrorMessage = ref<string | null>(null);

const geocodingOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  access_token: process.env.VUE_APP_MAPBOX_ACCESS_TOKEN ?? "", 
};

function searchProvider(text: string): Promise<MapBoxFeatureCollection> {
  return geocodingInfoForSearch(text, geocodingOptions);
}

function handleLocationSet(feature: MapBoxFeature) {
  emits('location-selected', feature);
  searchErrorMessage.value = null;
}

function closeSplashScreen() {
  showSplashScreen.value = false;
  emits('close');
}


</script>


<style lang="less">

#splash-overlay {
  align-items: center;
  justify-content: center;
  font-size: min(8vw, 7vh);
  transition: width 0.5s, height 0.5s;
}

#splash-screen {
  color: #E0E0E0;

  @media (max-width: 699px) {
    max-height: 80vh;
    max-width: 90vw;
  }

  @media (min-width: 700px) {
    max-height: 85vh;
    max-width: min(70vw, 800px);
  }


  background-color: black;
  backdrop-filter: blur(5px);
  justify-content: space-around;
  align-content: center;
  padding-top: 1rem;
  padding-bottom: 1rem;

  border-radius: 30px;
  border: min(1.2vw, 0.9vh) solid var(--accent-color);
  overflow: auto;
  font-family: 'Highway Gothic Narrow', 'Roboto', sans-serif;

  div {
    margin-inline: auto;
    text-align: center;
  }
  
  // Make the div containing the Get Started button only as tall as the button
  div:has(.splash-get-started) {
    height: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
  }
  // make a paragraph inside the div centered horizontally and vertically
  p {
    font-family: 'Highway Gothic Narrow', 'Roboto', sans-serif;
    font-weight: bold;
    vertical-align: middle;
  }
    
  p.highlight {
    color: var(--accent-color2);
    text-transform: uppercase;
    font-weight: bolder;
  }
  
  p.small {
    font-size: var(--default-font-size);
    font-weight: bold;
  }

  p.medium {
    font-size: 20px;
  }

  #first-splash-row {
    width: 100%;
  }

  #close-splash-button {
    position: absolute;
    top: 20px;
    right: 20px;
    text-align: end;
    color: var(--accent-color);
    font-size: min(5vw, 4vh);
    padding: 0.25rem;
    margin: -0.25rem;

    &:hover {
      cursor: pointer;
    }
  }

  #splash-screen-text {
    // in the grid, the text is in the 2nd column
    display: flex;
    flex-direction: column;
    line-height: 130%;

    p {
      width: 80%;
      text-align: center;
      margin: auto;
    }
    
  }

  .splash-get-started {
    border: 2px solid white;
    font-size: calc(1.5 * var(--default-font-size));
    // margin-top: 5%;
    // margin-bottom: 2%;
    font-weight: bold !important;
    text-transform: none !important;
  }

  #location-input-section {
    margin: 1rem auto;
    width: 100%;
    
    .location-prompt {
      font-size: calc(1.2 * var(--default-font-size));
      margin-bottom: 1rem;
      color: #E0E0E0;
    }
    
    .splash-location-search {
      width: 75%;
      max-width: 400px;
      margin: 0 auto;

      // Make the v-field width match the v-input width

      .v-field {
        padding: 0 !important;
      }
      
      .v-field__field {
        width: 100% !important;
      }

      .v-field__input {
        padding: 0 !important;
      }
      
      .v-input__control {
        width: 100% !important;
        pointer-events: auto !important;
        cursor: text !important;
      }

      // Make sure the input element itself is full width
      input {
        width: 100% !important;
        height: 100% !important;
        pointer-events: auto !important;
        cursor: text !important;
        padding: 0;
      }
      
    }
    
    .error-message {
      color: #ff6b6b;
      font-size: calc(0.9 * var(--default-font-size));
      margin-top: 0.5rem;
    }
  }

  #splash-screen-guide {
    margin-block: 1.5em;
    font-size: min(5vw, 4vh);
    line-height: 140%;
    width: 75%;

    .v-col{
      padding: 0;
    }
    
    .svg-inline--fa {
      color:var(--accent-color);
      margin: 0 10px;
    }
  }

  #splash-screen-acknowledgements {
    // margin-top: 3rem;
    margin-top: clamp(0.5rem, 3vh, 3rem);
    font-size: calc(1.7 * var(--default-font-size));
    line-height: calc(1.5 * var(--default-line-height));
    width: 60%; 
  }

  #splash-screen-logos {
    margin-block: 0.75em;

    img {
    height: 5vmin;
    vertical-align: middle;
    margin: 2px;
    }

    @media only screen and (max-width: 600px) {
      img {
        height: 24px;
      }
    }

    svg {
      vertical-align: middle;
      height: 24px;
    }
  }
}

@media (max-height: 600px) {
  #splash-screen p.medium {
    font-size: 14px;
  }
  #splash-screen-text p {
    font-size: 20pt;
  }
}

@media (max-height: 500px) {
  #splash-screen {
    // display: flex;
    // flex-direction: column;
    // max-width: 200vh;
    // justify-content: center;
    // align-items: center;
    // gap: calc(0.5 * var(--default-line-height));
    overflow: hidden;
  
    #splash-screen-text {
      line-height: 75%;
    }
    
    .splash-get-started {
      margin-top: 0;
      margin-bottom: 0;
    }
    
    #splash-screen-acknowledgements {
      font-size: calc(1.5 * var(--default-font-size));
    }
  }
}

@media (max-height: 310px) {
  #splash-screen {
    width: 50vw;
    padding-block: 10px;
  }
  #splash-screen-acknowledgements  {
    display: none;
  }
}

</style>
