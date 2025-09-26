<template>
<v-app
  id="app"
  :style="cssVars"
>
  <div
    id="main-content"
  >
    <WorldWideTelescope></WorldWideTelescope>
      

    <!-- This contains the splash screen content -->
  <splash-screen
    v-if="splashReady"
    title="Seasons"
    :cssVars="cssVars"
    @close="closeSplashScreen"
    @location-selected="setLocationFromSearchFeature"
  />

    <transition name="fade">
      <div
        class="modal"
        id="modal-loading"
        v-show="isLoading"
      >
        <div class="container">
          <div class="spinner"></div>
          <p>Loading …</p>
        </div>
      </div>
    </transition>


    <!-- This block contains the elements (e.g. icon buttons displayed at/near the top of the screen -->

    <div id="top-content">
      <div id="left-buttons">
        <icon-button
          v-model="showTextSheet"
          fa-icon="book-open"
          :color="accentColor"
          :tooltip-text="showTextSheet ? 'Hide Info' : 'Learn More'"
          tooltip-location="start"
        >
        </icon-button>
      </div>
      <div id="center-buttons">
        <icon-button
          v-model="showLocationSelector"
          fa-icon="location-dot"
          :color="accentColor"
          tooltip-text="Select Location"
          tooltip-location="start"
        ></icon-button>
        <v-dialog
          v-model="showLocationSelector"
          max-width="fit-content"
          transition="slide-y-transition"
        >
          <v-card>
            <div id="geolocation-close">
              <font-awesome-icon
                style="cursor: pointer; z-index: 1000;"
                icon="xmark"
                size="xl"
                @click="showLocationSelector = false"
                @keyup.enter="showLocationSelector = false"
                tabindex="0"
                color="black"
              ></font-awesome-icon>
            </div>
            <div id="geolocation-controls">
              <geolocation-button
                id="location"
                size="30px"
                density="default"
                elevation="5"
                :color="accentColor"
                @geolocation="selectedLocation = {longitudeDeg: $event.longitude, latitudeDeg: $event.latitude}"
              />
              <location-search
                :class="['location-search']"
                small
                button-size="xl"
                :accent-color="accentColor"
                :search-provider="searchProvider"
                @set-location="setLocationFromSearchFeature"
                @error="searchErrorMessage = $event"
              >
              </location-search>
            </div>
            <location-selector
              :model-value="selectedLocation"
              @update:modelValue="updateLocationFromMap"
            />
          </v-card>
        </v-dialog>
      </div>
      <div id="right-buttons">
        <div class="location-date-display">
          <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
          <v-chip v-html="selectedLocationText"
            id="location-chip"
            :color="accentColor"
            size="small"
            elevation="3"
            variant="flat"
            @click="showLocationSelector = true"
          > </v-chip>
        </div>
        <button
          :class="[event === selectedEvent ? 'selected' : '']"
          v-for="([event, value], index) in sortedDatesOfInterest"
          v-ripple
          class="event-button"
          :key="index"
          @click="selectedEvent = event;"
        >
          <div>{{ dayString(value.date) }}</div>
          <div>{{ eventName(event) }}</div>
        </button>
      </div>
    </div>
    
    <!-- This block contains the elements (e.g. the project icons) displayed along the bottom of the screen -->

    <div id="bottom-content">

      <v-slider
        v-model="sliderValue"
        :color="accentColor"
        :min="sliderMin"
        :max="sliderMax"
        thumb-label="always"
        class="time-slider"
      >
        <template v-slot:thumb-label>
          <div class="thumb-label">
            {{ selectedLocaledTimeDateString }}
          </div>
        </template>
      </v-slider>
      
      <!-- eslint-disable-next-line vue/no-v-model-argument -->
      <speed-control
        v-model="playing" 
        :store="store"
        :color="accentColor" 
        :defaultRate="1000"
        :maxSpeed="10000"
        show-text
        hideMoreControls="true"
        @reset="() => {
          selectedTime = Date.now();
          wwtStats.timeResetCount += 1;
        }"
        @update:reverse="(_reverse: boolean) => {
          wwtStats.reverseCount += 1;
        }"
        @update:playing="(_playing: boolean) => {
          wwtStats.playPauseCount += 1;
        }"
        @slow-down="(rate: number) => {
          wwtStats.slowdowns.push(rate);
        }"
        @speed-up="(rate: number) => {
          wwtStats.speedups.push(rate);
        }"
        @set-rate="(rate: number) => {
          wwtStats.rateSelections.push(rate);
        }"
        />
      <div id="change-flags">
      <!--
        <icon-button
          md-icon="mdi-information-outline"
          @activate="() => inIntro = true"
          :color="accentColor"
          :focus-color="accentColor"
          tooltip-text="Show Quick Start Guide"
          tooltip-location="bottom"
          tooltip-offset="5px"
          :show-tooltip="!mobile"
          mdSize="1.2em"
        >
        </icon-button>
        <icon-button
          md-icon="mdi-lock"
          @activate="() => showPrivacyDialog = true"
          :color="accentColor"
          :focus-color="accentColor"
          tooltip-text="Change privacy settings"
          tooltip-location="bottom"
          tooltip-offset="5px"
          :show-tooltip="!mobile"
          mdSize="1.2em"
        >
        </icon-button>
      -->
      </div>
      <div id="body-logos" v-if="!smallSize">
        <credit-logos/>
      </div>
    </div>


    <!-- This dialog contains the video that is displayed when the video icon is clicked -->

    <v-dialog
      id="video-container"
      v-model="showVideoSheet"
      transition="slide-y-transition"
      fullscreen
    >
      <div class="video-wrapper">
        <font-awesome-icon
          id="video-close-icon"
          class="close-icon"
          icon="times"
          size="lg"
          @click="showVideoSheet = false"
          @keyup.enter="showVideoSheet = false"
          tabindex="0"
        ></font-awesome-icon>
        <video
          controls
          id="info-video"
        >
          <source src="" type="video/mp4">
        </video>
      </div>
    </v-dialog>


    <!-- This dialog contains the informational content that is displayed when the book icon is clicked -->

    <v-dialog
      :style="cssVars"
      class="bottom-sheet"
      id="text-bottom-sheet"
      hide-overlay
      persistent
      no-click-animation
      absolute
      width="100%"
      :scrim="false"
      location="bottom"
      v-model="showTextSheet"
      transition="dialog-bottom-transition"
    >
      <v-card height="100%">
        <v-tabs
          v-model="tab"
          height="32px"
          :color="accentColor"
          :slider-color="accentColor"
          id="tabs"
          dense
        >
          <v-tab class="info-tabs" tabindex="0"><h3>Information</h3></v-tab>
          <v-tab class="info-tabs" tabindex="0"><h3>Using WWT</h3></v-tab>
        </v-tabs>
        <font-awesome-icon
          id="close-text-icon"
          class="control-icon"
          icon="times"
          size="lg"
          @click="showTextSheet = false"
          @keyup.enter="showTextSheet = false"
          tabindex="0"
        ></font-awesome-icon>
        <v-window v-model="tab" id="tab-items" class="pb-2 no-bottom-border-radius">
          <v-window-item>
            <v-card class="no-bottom-border-radius scrollable">
              <v-card-text class="info-text no-bottom-border-radius">
                Information goes here
                <v-spacer class="end-spacer"></v-spacer>
              </v-card-text>
            </v-card>
         </v-window-item>
          <v-window-item>
            <v-card class="no-bottom-border-radius scrollable">
              <v-card-text class="info-text no-bottom-border-radius">
                <v-container>
                  <v-row align="center">
                  <v-col cols="4">
                      <v-chip
                        label
                        outlined
                      >
                        Pan
                      </v-chip>
                    </v-col>
                    <v-col cols="8" class="pt-1">
                      <strong>{{ touchscreen ? "press + drag" : "click + drag" }}</strong>  {{ touchscreen ? ":" : "or" }}  <strong>{{ touchscreen ? ":" : "W-A-S-D" }}</strong> {{ touchscreen ? ":" : "keys" }}<br>
                    </v-col>
                  </v-row>
                  <v-row align="center">
                    <v-col cols="4">
                      <v-chip
                        label
                        outlined
                      >
                        Zoom
                      </v-chip>
                    </v-col>
                    <v-col cols="8" class="pt-1">
                      <strong>{{ touchscreen ? "pinch in and out" : "scroll in and out" }}</strong> {{ touchscreen ? ":" : "or" }} <strong>{{ touchscreen ? ":" : "I-O" }}</strong> {{ touchscreen ? ":" : "keys" }}<br>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <div class="credits">
                      <h3>Credits:</h3>
                      <h4><a href="https://www.cosmicds.cfa.harvard.edu/" target="_blank" rel="noopener noreferrer">CosmicDS</a> Vue Data Stories Team:</h4>
                      John Lewis<br>
                      Jon Carifio<br>
                      Pat Udomprasert<br>
                      Alyssa Goodman<br>
                      Mary Dussault<br>
                      Harry Houghton<br>
                      Anna Nolin<br>
                      Evaluator: Sue Sunbury<br>
                      <br>
                      <h4>WorldWide Telescope Team:</h4>
                      Peter Williams<br>
                      A. David Weigel<br>
                      Jon Carifio<br>
                      </div>
                      <v-spacer class="end-spacer"></v-spacer>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col>
                      <funding-acknowledgement/>
                    </v-col>
                  </v-row>
                </v-container>              
              </v-card-text>
            </v-card>
          </v-window-item>
        </v-window>
      </v-card>
    </v-dialog>

  </div>
</v-app>
</template>

<script setup lang="ts">
import { ref, reactive, computed, markRaw, onMounted, nextTick, watch } from "vue";
import { useDisplay } from "vuetify";
import { storeToRefs } from "pinia";
import { getTimezoneOffset } from "date-fns-tz";
import tzlookup from "tz-lookup";

import { AstroTime, Seasons } from "astronomy-engine";

import { Color, Grids, Planets, Settings, WWTControl } from "@wwtelescope/engine";
import { GotoRADecZoomParams, engineStore } from "@wwtelescope/engine-pinia";
import {
  BackgroundImageset,
  LocationDeg,
  skyBackgroundImagesets,
  supportsTouchscreen,
  blurActiveElement,
  useWWTKeyboardControls,
  D2R,
} from "@cosmicds/vue-toolkit";
import { MapBoxFeature, MapBoxFeatureCollection, geocodingInfoForSearch, textForLocation } from "@cosmicds/vue-toolkit/src/mapbox";

import { useTimezone } from "./timezones";
import { horizontalToEquatorial } from "./utils";
import { makeAltAzGridText, drawPlanets, renderOneFrame, drawEcliptic, drawSkyOverlays } from "./wwt-hacks";
import { useSun } from "./composables/useSun";
import { SolarSystemObjects } from "@wwtelescope/engine-types";
import { formatInTimeZone } from "date-fns-tz";


type SheetType = "text" | "video";
type CameraParams = Omit<GotoRADecZoomParams, "instant">;
export interface SeasonsStoryProps {
  wwtNamespace?: string;
  initialCameraParams?: CameraParams;
}

const store = engineStore();
const {
  currentTime,
} = storeToRefs(store);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const wwtSettings: Settings = Settings.get_active();

useWWTKeyboardControls(store);

const touchscreen = supportsTouchscreen();
const { smAndDown } = useDisplay();

const splash = new URLSearchParams(window.location.search).get("splash")?.toLowerCase() !== "false";
const showSplashScreen = ref(splash);
const splashReady = computed(() => splash && selectedEvent.value !== null);
const backgroundImagesets = reactive<BackgroundImageset[]>([]);
const sheet = ref<SheetType | null>(null);
const layersLoaded = ref(false);
const positionSet = ref(false);

const tab = ref(0);

const playing = ref(false);
const showLocationSelector = ref(false);

const showHorizon = ref(true);

// Get the next 4 "dates of interest"
// i.e. equinoxes and solstices
const currentDate = new Date();
const currentYear = currentDate.getUTCFullYear();
const datesOfInterest = Seasons(currentYear);

// Find dates that have passed and sort them by date
const pastEvents = Object.entries(datesOfInterest)
  .filter(([_key, value]: [string, AstroTime]) => value.date < currentDate)
  .sort((a, b) => a[1].date.getTime() - b[1].date.getTime());

// If we have more than 1 past event, replace the older ones with next year's events
// Keep only the most recent past event as our starting point
if (pastEvents.length > 1) {
  const nextSeasonsInfo = Seasons(currentYear + 1);
  const eventsToReplace = pastEvents.slice(0, -1); // All except the most recent past event
  eventsToReplace.forEach(([key]) => {
    datesOfInterest[key] = nextSeasonsInfo[key];
  });
}

const startTime = ref(0);
const endTime = ref(0);
const sliderMin = 0;
const sliderMax = 500;
const sliderRange = sliderMax - sliderMin;
const sliderValue = computed({
  get() {
    const fraction = (selectedTime.value - startTime.value) / (endTime.value - startTime.value);
    return sliderMin + fraction * sliderRange;
  },
  set(value: number) {
    const fraction = (value - sliderMin) / sliderRange;
    const time = fraction * (endTime.value - startTime.value) + startTime.value;
    selectedTime.value = time;
  }
});

const sortedDatesOfInterest = computed(() => {
  const entries: ([EventOfInterest, AstroTime])[] = Object.entries(datesOfInterest) as [EventOfInterest, AstroTime][];
  return entries.sort((a, b) => a[1].date.getTime() - b[1].date.getTime());
});

const EVENTS_OF_INTEREST = [
  "mar_equinox",
  "jun_solstice",
  "sep_equinox",
  "dec_solstice",
] as const;
type EventOfInterest = typeof EVENTS_OF_INTEREST[number];

const selectedEvent = ref<EventOfInterest | null>(null);

function eventName(event: EventOfInterest): string {
  switch (event) {
  case "mar_equinox":
    return "Equinox";
  case "jun_solstice":
    return "Solstice";
  case "sep_equinox":
    return "Equinox";
  case "dec_solstice":
    return "Solstice";
  }
}

function getCurrentSeason(event: string, latitude: number): 'spring' | 'summer' | 'autumn' | 'winter' {

  if (latitude >= 0) {
    switch (event) {
    case "mar_equinox":
      return "spring";
    case "jun_solstice":
      return "summer";
    case "sep_equinox":
      return "autumn";
    case "dec_solstice":
      return "winter";      
    }
  } else {
    switch (event) {
    case "mar_equinox":
      return "autumn";
    case "jun_solstice":
      return "winter";
    case "sep_equinox":
      return "spring";
    case "dec_solstice":
      return "summer";      
    }
  }
  return "spring"; // fallback
}

const seasonalColors = {
  spring: '#FFA0D7',  
  summer: '#F7EB67',  
  autumn: '#FEB770',  
  winter: '#91C2F9'   
};

const accentColor = computed(() => {
  const event = selectedEvent.value;
  if (!event) {
    return seasonalColors.spring;
  }
  const latitude = selectedLocation.value.latitudeDeg;
  const currentSeason = getCurrentSeason(event, latitude);
  return seasonalColors[currentSeason];
});

function dayString(date: Date) {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStartAndEndTimes(event: EventOfInterest): [Date, Date] {
  const day = datesOfInterest[event].date;
  const time = day.getTime();
  const { rising: dayStart, setting: dayEnd } = getTimeforSunAlt(0, time);

  let start: Date;
  let end: Date;
  if (dayStart === null || dayEnd === null) {
    start = new Date(time); 
    start.setHours(0, 0, 0, 0);
    start = new Date(start.getTime() - selectedTimezoneOffset.value);
    end = new Date(start.getTime() + 86400000 - 60);
  } else {
    start = new Date(dayStart);
    end = new Date(dayEnd);
  }

  return [start, end];
}

function updateSliderBounds(_newLocation: LocationDeg, oldLocation: LocationDeg) {
  if (selectedEvent.value === null) {
    return;
  }
  const [start, end] = getStartAndEndTimes(selectedEvent.value);
  startTime.value = start.getTime();
  endTime.value = end.getTime();

  const oldOffset = getTimezoneOffset(tzlookup(oldLocation.latitudeDeg, oldLocation.longitudeDeg));

  const diff = oldOffset - selectedTimezoneOffset.value;
  let newSelectedTime = selectedTime.value + diff;
  newSelectedTime = Math.min(Math.max(startTime.value, newSelectedTime), endTime.value);
  selectedTime.value = newSelectedTime;
}

function goToEvent(event: EventOfInterest) {
  const day = datesOfInterest[event].date;
  const time = day.getTime();

  const [start, end] = getStartAndEndTimes(event);

  store.setTime(new Date(time));
  const timeStart = start.getTime();
  selectedTime.value = timeStart;
  startTime.value = timeStart; // - timeStart % (24 * 60 * 60 * 1000) - selectedTimezoneOffset.value; // round down to the start of the day

  endTime.value = end.getTime();

  setTimeout(() => resetView(), 100);
}

const wwtStats = markRaw({
  timeResetCount: 0,
  reverseCount: 0,
  playPauseCount: 0,
  speedups: [] as number[],
  slowdowns: [] as number[],
  rateSelections: [] as number[],
  startTime: Date.now(),
});

const selectedLocation = ref<LocationDeg>({
  longitudeDeg: -71.1056,
  latitudeDeg: 42.3581,
});
const selectedLocationText = ref("");
const searchErrorMessage = ref<string | null>(null);
const geocodingOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  access_token: process.env.VUE_APP_MAPBOX_ACCESS_TOKEN ?? "", 
};

let userSelectedMapLocations: [number, number][] = [];
let userSelectedSearchLocations: [number, number][] = [];

function updateLocationFromMap(location: LocationDeg) {
  selectedLocation.value = location;
  userSelectedMapLocations.push([location.latitudeDeg, location.longitudeDeg]);
}

function latLonText(longitudeDeg: number, latitudeDeg: number): string {
  const ns = latitudeDeg >= 0 ? 'N' : 'S';
  const ew = longitudeDeg >= 0 ? 'E' : 'W';
  const lat = Math.abs(latitudeDeg).toFixed(3);
  const lon = Math.abs(longitudeDeg).toFixed(3);
  return `${lat}° ${ns}, ${lon}° ${ew}`;
}

async function getTextForLocation(longitudeDeg: number, latitudeDeg: number): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  let text = await textForLocation(longitudeDeg, latitudeDeg, geocodingOptions);
  if (!startsWithNumber(text)) {
    text =`${text}<br/>${latLonText(longitudeDeg, latitudeDeg)}`;
  }
  return text;
}

function startsWithNumber(text: string): boolean {
  return text.charAt(0).match(/[0-9]|-/) !== null;
}

function setLocationFromFeature(feature: MapBoxFeature) {
  selectedLocation.value = { longitudeDeg: feature.center[0], latitudeDeg: feature.center[1] };
  getTextForLocation(feature.center[0], feature.center[1]).then(text => {
    selectedLocationText.value = text;
  }).catch(_err => {
    searchErrorMessage.value = "An error occurred while searching";
  });
}

function setLocationFromSearchFeature(feature: MapBoxFeature) {
  setLocationFromFeature(feature);
  userSelectedSearchLocations.push(feature.center);
}

async function updateSelectedLocationText() {
  selectedLocationText.value = await getTextForLocation(selectedLocation.value.longitudeDeg, selectedLocation.value.latitudeDeg);
}

function searchProvider(text: string): Promise<MapBoxFeatureCollection> {
  return geocodingInfoForSearch(text, geocodingOptions);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resetData() {
  userSelectedMapLocations = [];
  userSelectedSearchLocations = [];
}

const selectedTime = ref(Date.now());
setInterval(() => {
  if (playing.value) {
    selectedTime.value = currentTime.value.getTime();
  }
}, 50);

const { selectedTimezone, selectedTimezoneOffset } = useTimezone(selectedLocation);
  
const { getTimeforSunAlt, getSunPositionAtTime } = useSun({
  store,
  location: selectedLocation,
  selectedTime,
  selectedTimezoneOffset,
  zoomLevel: 360,
});

const selectedLocaledTimeDateString = computed(() => {
  const formatString = "h:mm aa (zzz)";
  return formatInTimeZone(selectedTime.value, selectedTimezone.value, formatString);
});

// import { getTimezoneOffset } from "date-fns-tz";
// const testTime = ref(new Date('Sep 22 2025 00:00:00 GMT-0400').getTime());
// const testSun = useSun({
//   store,
//   location: selectedLocation,
//   selectedTime: testTime,
//   selectedTimezoneOffset: getTimezoneOffset("America/New_York", testTime.value),
//   zoomLevel: 360,
// });
// console.log("Testing sun values");
// const { rising: testRising, setting: testSetting } = testSun.getTimeforSunAlt(0);
// if (testRising !== null && testSetting !== null) {
//   console.log(`Test Sun Rising: ${new Date(testRising)}`);
//   console.log(`Test Sun Setting: ${new Date(testSetting)}`);
// }

const MAX_ZOOM = 500;

onMounted(() => {
  updateSelectedLocationText();
  store.waitForReady().then(async () => {
    WWTControl.singleton.set_zoomMax(MAX_ZOOM);
    skyBackgroundImagesets.forEach(iset => backgroundImagesets.push(iset));

    updateWWTLocation(selectedLocation.value);

    store.setClockSync(false);
    store.setClockRate(0);

    // Adding Alt-Az grid here
    store.applySetting(["showAltAzGrid", true]);
    store.applySetting(["altAzGridColor", Color.fromArgb(255, 255, 255, 255)]);
    store.applySetting(["localHorizonMode", true]);

    doWWTModifications();

    // Set the initial event after everything is ready
    selectedEvent.value = sortedDatesOfInterest.value[0][0];

    // If there are layers to set up, do that here!
    positionSet.value = true;
    layersLoaded.value = true;
  });
});

const ready = computed(() => layersLoaded.value && positionSet.value);

/* `isLoading` is a bit redundant here, but it could potentially have independent logic */
const isLoading = computed(() => !ready.value);

/* Properties related to device/screen characteristics */
const smallSize = computed(() => smAndDown.value);
// const mobile = computed(() => smallSize.value && touchscreen);

/* This lets us inject component data into element CSS */
const cssVars = computed(() => {
  return {
    "--accent-color": accentColor.value,
    "--app-content-height": showTextSheet.value ? "66%" : "100%",
  };
});


/**
  Computed flags that control whether the relevant dialogs display.
  The `sheet` data member stores which sheet is open, so these are just
  computed wrappers around modifying/querying that which can be used as
  dialog v-model values
*/
const showTextSheet = computed({
  get() {
    return sheet.value === "text";
  },
  set(_value: boolean) {
    selectSheet("text");
  }
});

const showVideoSheet = computed({
  get() {
    return sheet.value === "video";
  },
  set(value: boolean) {
    selectSheet("video");
    if (!value) {
      const video = document.querySelector("#info-video") as HTMLVideoElement;
      video.pause();
    }
  }
});

/**
  This is convenient if there's any other logic that we want to run
  when the splash screen is closed
*/
function closeSplashScreen() {
  showSplashScreen.value = false;
}

function selectSheet(sheetType: SheetType | null) {
  if (sheet.value === sheetType) {
    sheet.value = null;
    nextTick(() => {
      blurActiveElement();
    });
  } else {
    sheet.value = sheetType;
  }
}

function resetView(zoomDeg?: number) {
  const time = store.currentTime;

  const latRad = selectedLocation.value.latitudeDeg * D2R;
  const lonRad = selectedLocation.value.longitudeDeg * D2R;

  const sunAltAz = getSunPositionAtTime(time);
  const sunAz = sunAltAz.azRad;
  const startAlt = (smallSize.value ? 20 : 25) * D2R;
  const startRADec = horizontalToEquatorial(
    startAlt,
    sunAz,
    latRad,
    lonRad,
    time,
  );

  return store.gotoRADecZoom({
    raRad: startRADec.raRad,
    decRad: startRADec.decRad,
    zoomDeg: zoomDeg ?? MAX_ZOOM,
    instant: true,
  });
}

function updateWWTLocation(location: LocationDeg) {
  wwtSettings.set_locationLat(location.latitudeDeg);
  wwtSettings.set_locationLng(location.longitudeDeg);
}

function doWWTModifications() {
  Grids._makeAltAzGridText = makeAltAzGridText;
  Grids.drawEcliptic = drawEcliptic;

  // We need to render one frame ahead of time
  // as there's a lot of setup done on the first frame
  // render that we need to use
  WWTControl.singleton.renderOneFrame();

  const boundRenderOneFrame = renderOneFrame.bind(WWTControl.singleton);
  const newFrameRender = function() { 
    boundRenderOneFrame(
      showHorizon.value,
      showHorizon.value,
      false,
    );
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  WWTControl.singleton._drawSkyOverlays = drawSkyOverlays.bind(WWTControl.singleton);

  // as well as our custom text overlays
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  WWTControl.singleton.renderOneFrame = newFrameRender;

  const originalUpdatePlanetLocations = Planets.updatePlanetLocations;
  const planetScales = [
    8,  // Sun
    1.25,  // Mercury
    1.25,  // Venus
    1.25,  // Mars
    2.5,  // Jupiter
    4.5,  // Saturn
    2,  // Uranus
    2,  // Neptune
    1,  // Pluto
    1.25,  // Moon
  ];
  function newUpdatePlanetLocations(threeD: boolean) {
    originalUpdatePlanetLocations(threeD);
    for (let i = 0; i <= SolarSystemObjects.moon; i++) {
      Planets._planetScales[i] = planetScales[i];
    }
  }
  Planets.updatePlanetLocations = newUpdatePlanetLocations;
  Planets.drawPlanets = drawPlanets;
}

watch(selectedLocation, (location: LocationDeg, oldLocation: LocationDeg) => {
  updateSelectedLocationText();
  updateWWTLocation(location);
  updateSliderBounds(location, oldLocation);
  WWTControl.singleton.renderOneFrame();
});

watch(selectedTime, (time: number) => {
  store.setTime(new Date(time)); 
  resetView(store.zoomDeg);
});

watch(selectedEvent, (event: EventOfInterest | null) => {
  if (event) {
    goToEvent(event);
  }
});
</script>

<style lang="less">
@font-face {
  font-family: "Highway Gothic Narrow";
  src: url("./assets/HighwayGothicNarrow.ttf");
}

:root {
  --default-font-size: clamp(0.7rem, min(1.7vh, 1.7vw), 1.1rem);
  --default-line-height: clamp(1rem, min(2.2vh, 2.2vw), 1.6rem);
}

html {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #000;
  overflow: hidden;

  
  -ms-overflow-style: none;
  // scrollbar-width: none;
}

body {
  position: fixed;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;

  font-family: Verdana, Arial, Helvetica, sans-serif;
}

#main-content {
  position: fixed;
  width: 100%;
  height: var(--app-content-height);
  overflow: hidden;

  transition: height 0.1s ease-in-out;
}

#app {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  font-size: 11pt;

  .wwtelescope-component {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    border-style: none;
    border-width: 0;
    margin: 0;
    padding: 0;
  }
}


.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.modal {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 100;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

#modal-loading {
  background-color: #000;
  .container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    .spinner {
      background-image: url("https://projects.cosmicds.cfa.harvard.edu/cds-website/misc/lunar_loader.gif");
      background-repeat: no-repeat;
      background-size: contain;
      width: 3rem;
      height: 3rem;
    }
    p {
      margin: 0 0 0 1rem;
      padding: 0;
      font-size: 150%;
    }
  }
}

#top-content {
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: calc(100% - 2rem);
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

#left-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

#center-buttons {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  gap: 5px;
}

#right-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  height: auto;
}

#bottom-content {
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  width: calc(100% - 2rem);
  pointer-events: none;
  align-items: center;
  gap: 5px;
}

#splash-overlay {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

#splash-screen {
  color: #FFFFFF;
  background-color: #000000;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: center;
  justify-content: space-around;

  font-family: 'Highway Gothic Narrow', 'Roboto', sans-serif;
  font-size: min(8vw, 7vh);

  border-radius: 10%;
  border: min(1.2vw, 0.9vh) solid var(--accent-color);
  overflow: auto;
  padding-top: 4rem;
  padding-bottom: 1rem;

  @media (max-width: 699px) {
    max-height: 80vh;
    max-width: 90vw;
  }

  @media (min-width: 700px) {
    max-height: 85vh;
    max-width: min(70vw, 800px);
  }

  div {
    margin-inline: auto;
    text-align: center;
  }

  .small {
    font-size: var(--default-font-size);
    font-weight: bold;
  }

  #close-splash-button {
    position: absolute;
    top: 0.5rem;
    right: 1.75rem;
    text-align: end;
    color: var(--accent-color);
    font-size: min(8vw, 5vh);

    &:hover {
      cursor: pointer;
    }
  }
}

// From Sara Soueidan (https://www.sarasoueidan.com/blog/focus-indicators/) & Erik Kroes (https://www.erikkroes.nl/blog/the-universal-focus-state/)
:focus-visible,
button:focus-visible,
.focus-visible,
.v-selection-control--focus-visible .v-selection-control__input {
  outline: 9px double white !important;
  box-shadow: 0 0 0 6px black !important;
  border-radius: .125rem;
}

.video-wrapper {
  height: 100%;
  background: black;
  text-align: center;
  z-index: 1000;

  #video-close-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 15;
    
    &:hover {
      cursor: pointer;
    }

    &:focus {
      color: white;
      border: 2px solid white;
    }
  }
}

video {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

#info-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  overflow: hidden;
  padding: 0px;
  z-index: 10;
}

.bottom-sheet {
  .v-overlay__content {
    align-self: flex-end;
    padding: 0;
    margin: 0;
    max-width: 100%;
    height: 34%;
  }

  #tabs {
    width: calc(100% - 3em);
    align-self: left;
  }
  
  .info-text {
    height: 33vh;
    padding-bottom: 25px;
  
    & a {
      text-decoration: none;
    }
  }
  
  .close-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 15;
  
    &:hover {
      cursor: pointer;
    }
  
    &:focus {
      color: white;
      border: 2px solid white;
    }
  }
  
  .scrollable {
    overflow-y: auto;
  }
  
  #tab-items {
    // padding-bottom: 2px !important;
  
    .v-card-text {
      font-size: ~"max(14px, calc(0.7em + 0.3vw))";
      padding-top: ~"max(2vw, 16px)";
      padding-left: ~"max(4vw, 16px)";
      padding-right: ~"max(4vw, 16px)";
  
      .end-spacer {
        height: 25px;
      }
    }
  
  }
  
  #close-text-icon {
    position: absolute;
    top: 0.25em;
    right: calc((3em - 0.6875em) / 3); // font-awesome-icons have width 0.6875em
    color: white;
  }

  // This prevents the tabs from having some extra space to the left when the screen is small
  // (around 400px or less)
  .v-tabs:not(.v-tabs--vertical).v-tabs--right>.v-slide-group--is-overflowing.v-tabs-bar--is-mobile:not(.v-slide-group--has-affixes) .v-slide-group__next, .v-tabs:not(.v-tabs--vertical):not(.v-tabs--right)>.v-slide-group--is-overflowing.v-tabs-bar--is-mobile:not(.v-slide-group--has-affixes) .v-slide-group__prev {
    display: none;
  }
}

#date-picker {
  pointer-events: auto;
}

.event-button {
  background: black;
  border: 1px solid white;
  border-radius: 5px;
  padding: 10px;
  width: 100%;
  pointer-events: auto;

  &.selected {
    color: var(--accent-color);
    border-color: var(--accent-color);
  }
}

.map-container {
  @media (max-width: 600px) {
    width: 90vw;
    height: 70vh;
  }

@media (min-width: 601px) {
    width: 70vw;
    height: 60vh;
  }
}

.v-slider {
  width: 90%;
  pointer-events: auto;
}

.time-slider {

  .v-slider-thumb {

    .v-slider-thumb__label {
      color: white;
      background-color: black;
      border: 2px solid var(--accent-color);
      border-radius: 5px;
      width: max-content;
      height: 2.5rem;
      font-size: 1rem;

      &::before {
        color: var(--accent-color);
      }
    }
  }
}

#geolocation-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}

#geolocation-controls {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  position: absolute;
  width: 350px;
  bottom: 1rem;
  right: 1rem;
  z-index: 1000;
  gap: 5px;

  .location-search {
    flex-grow: 1;

    .v-list-item {
      z-index: 5000;
    }
  }

  @media (max-width: 600px) {
    width: 300px;
  }
}

#geolocation-wrapper-location .v-btn {
  background-color: black;
}

.location-date-display {
  display: flex;
  flex-direction: column;
  align-items: center;

  .v-chip {
    width: fit-content;
  }
}

#location-chip {
  pointer-events: auto;
  height: fit-content;
  text-align: center;
}
</style>
