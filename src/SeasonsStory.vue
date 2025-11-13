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
        <div class="location-display">
          <div
            id="location-title"
            class="event-title"
          >

            <button 
              @click="showLocationSelector = !showLocationSelector"
              class="icon-location-button clickable-object"
            >
              <font-awesome-layers>
                <font-awesome-icon
                  icon="location-dot"
                  color="black"
                />
                <font-awesome-icon
                  icon="location-dot"
                  :color="accentColor"
                  transform="shrink-3"
                />
              </font-awesome-layers>
            </button>

            <!-- <icon-button
              v-model="showLocationSelector"
              icon="fa-location-dot"
              size="sm"
              :color="accentColor"
              tooltip-text="Select Location"
              tooltip-location="start"
            ></icon-button> -->
            <h4 @click="showLocationSelector = !showLocationSelector" class="clickable-object">View from</h4>
          </div>
          <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
          <button
            id="location-button"
            class="event-button info-button"
            @click="showLocationSelector = true"
          > 
          <div v-if="selectedLocationInfo.name" class="mb-1"><strong>{{ selectedLocationInfo.name }}</strong></div>
          <div>Lat: {{ selectedLocationInfo.latitude }}</div>
          <div>Long: {{ selectedLocationInfo.longitude }}</div>
          </button>
        </div>
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
        <div
          class="options"
        >
          <v-checkbox
            v-model="forceCamera"
            label="Auto-track Sun"
            density="compact"
            hide-details
          />
        </div>
        <icon-button
          v-model="showTextSheet"
          icon="fa-info"
          :color="accentColor"
          :tooltip-text="showTextSheet ? 'Hide Info' : 'Learn More'"
          tooltip-location="start"
          size="sm"
        >
        </icon-button>
      </div>
      <div id="right-buttons">
        <div
          id="date-title"
          class="event-title"
        >
        <button 
            @click="showDatePicker = !showDatePicker"
            class="display-date-button mr-2 clickable-object"
          >
            <font-awesome-layers>
              <font-awesome-icon
                icon="calendar-day"
                color="black"
              />
              <font-awesome-icon
                icon="calendar-day"
                :color="accentColor"
                transform="shrink-3"
              />
            </font-awesome-layers>
          </button>
          <h4 @click="showDatePicker = !showDatePicker" class="clickable-object">Displayed Date</h4>
          </div>
          <button id="date-info" @click="showDatePicker = !showDatePicker" class="event-button info-button">
            <div class="mb-1"><strong>{{ dayString(displayedDate) }}</strong></div>       
            <div>Length of Day: {{ formatDayLength(endTime - startTime, currentDayInfo[2]) }}</div>
            <div>Distance to Sun: {{ sunDistance.toFixed(2) }} au</div>
          </button>
        
        <div class="date-buttons">
          <button
            :class="[event === selectedEvent ? 'selected' : '']"
            v-for="([event], index) in sortedDatesOfInterest"
            v-ripple
            class="event-button"
            :key="index"
            @click="selectedEvent = event;"
          >
            <div>{{ eventName(event) }}</div>
          </button>
          
          <!-- Calendar date picker -->
          <div class="date-picker-section date-button">
            <button
              @click="showDatePicker = !showDatePicker"
              :color="accentColor"
              variant="outlined"
              size="small"
              class="calendar-button event-button"
            >
              <font-awesome-icon
                icon="calendar-day"
              />
              Choose Any Date
            </button>
            
            <v-dialog
              v-model="showDatePicker"
              max-width="fit-content"
            >
              <v-card>
                <v-card-title class="text-h6 mb-0 mt-2">
                  Select Date
                </v-card-title>
                <v-card-text class="my-0 mx=2 pa-0">
                  <v-date-picker
                    :model-value="selectedCustomDate"
                    @update:model-value="handleDateSelection"
                    :color="accentColor"
                    hide-header
                  />
                </v-card-text>
                <v-card-actions class="my-0">
                  <v-btn
                    text
                    @click="showDatePicker = false"
                  >
                    Cancel
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </div>
        </div>
        <!-- <div>
          <p>Current Time: {{ currentTime  }}</p>
          <p>Clockrate: {{  store.clockRate }}</p>
          <p>At or after endtime: {{ currentTime >= endTime }}</p>
          <p>At or before starttime: {{ currentTime <= startTime }}</p>
        </div> -->
      </div>
    </div>
    
    <!-- This block contains the elements (e.g. the project icons) displayed along the bottom of the screen -->

    <div id="bottom-content">

      <div id="time-slider-chips">
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

        <div class="time-chips">
          <v-chip
            @click="() => {
              sliderValue = sliderMin;
              resetView(MAX_ZOOM);
            }"
            :color="accentColor"
            variant="elevated"
            size="x-small"
            class="time-chip"
          >
            Sunrise
          </v-chip>
          <v-chip
            @click="() => {
              sliderValue = (sliderMin + sliderMax) / 2;
              resetView(MAX_ZOOM);
            }"
            :color="accentColor"
            variant="elevated"
            size="x-small"
            class="time-chip"
          >
            Midday
          </v-chip>
          <v-chip
            @click="() => {
              sliderValue = sliderMax;
              resetView(MAX_ZOOM);
            }"
            :color="accentColor"
            variant="elevated"
            size="x-small"
            class="time-chip"
          >
            Sunset
          </v-chip>
        </div>
      </div>
      
      <!-- eslint-disable-next-line vue/no-v-model-argument -->
      <speed-control
        :model-value="playing" 
        :store="store"
        :color="accentColor" 
        :default-rate="1000"
        :max-speed="10000"
        :rate-delta="5"
        show-status
        :hide-more-controls="true"
        @reset="() => {
          selectedEvent && goToEvent(selectedEvent);
          wwtStats.timeResetCount += 1;
        }"
        @update:reverse="(_reverse: boolean) => {
          wwtStats.reverseCount += 1;
        }"
        @update:model-value="handlePlaying"
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
          icon="mdi-information-outline"
          @activate="() => inIntro = true"
          :color="accentColor"
          :focus-color="accentColor"
          tooltip-text="Show Quick Start Guide"
          tooltip-location="bottom"
          tooltip-offset="5px"
          :show-tooltip="!mobile"
          size="1.2em"
        >
        </icon-button>
        <icon-button
          icon="mdi-lock"
          @activate="() => showPrivacyDialog = true"
          :color="accentColor"
          :focus-color="accentColor"
          tooltip-text="Change privacy settings"
          tooltip-location="bottom"
          tooltip-offset="5px"
          :show-tooltip="!mobile"
          size="1.2em"
        >
        </icon-button>
      -->
      </div>
    </div>
    <div id="body-logos" v-if="!smallSize">
      <credit-logos
        :default-logos="['cosmicds', 'wwt', 'sciact', 'nasa']"
      />
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
          <v-tab class="info-tabs" tabindex="0"><h3>How to Use this App</h3></v-tab>
          <v-tab class="info-tabs" tabindex="0"><h3>What to Explore</h3></v-tab>
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
                <v-container>
                  <p>
                    This interactive lets you view the path of the Sun in the sky on the solstices and equinoxes from any location on Earth! 
                  </p>
                  <ul class="ml-5 pt-3">
                    <li class="pb-3">
                      Click 
                      <font-awesome-icon
                        icon="location-dot"
                        :color="accentColor"
                      /> 
                      in the upper left to choose a different location.
                    </li>
                    <li class="pb-3">
                      Click the buttons in the upper right to choose a different date.
                    </li>
                    <li>
                      Use the time slider at the bottom to see how the Sun moves through the sky on your chosen date from your chosen location.
                    </li>
                    <div class="py-1 pl-3">
                      or
                    </div>
                    <li>
                      Press 
                      <font-awesome-icon
                        icon="play"
                        :color="accentColor"
                      />/
                      <font-awesome-icon
                        icon="pause"
                        :color="accentColor"
                      />
                      to start/stop time.
                    </li>
                    <li>
                      <font-awesome-icon
                        icon="angles-up"
                        :color="accentColor"
                      />
                      and
                      <font-awesome-icon
                        icon="angles-down"
                        :color="accentColor"
                      /> to speed up and slow down time.
                    </li>
                    <li>
                      <v-icon :color="accentColor">mdi-step-backward-2</v-icon>/<v-icon :color="accentColor">mdi-step-forward-2</v-icon> to play time in reverse/forwards.
                    </li>
                    <li>
                      <font-awesome-icon
                        icon="rotate"
                        :color="accentColor"
                      /> to reset the time and view to sunrise for the day.
                    </li>
                    <div class="py-1 pl-3">
                      or
                    </div>
                    <li>
                      Jump directly to 
                      <v-chip
                        :color="accentColor"
                        variant="elevated"
                        size="small"
                        class="time-chip"
                      >
                        Sunrise
                      </v-chip>,
                      <v-chip
                        :color="accentColor"
                        variant="elevated"
                        size="small"
                        class="time-chip"
                      >
                        Midday
                      </v-chip>, or
                      <v-chip
                        :color="accentColor"
                        variant="elevated"
                        size="small"
                        class="time-chip"
                      >
                        Sunrise
                      </v-chip> using the buttons under the time slider.
                    </li>
                    <li class="py-3">
                      Move around the sky:
                    </li>
                  </ul>  
                  <v-row align="center" class="pb-5">
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
                  <v-spacer class="end-spacer"></v-spacer>
                </v-container>              
              </v-card-text>
            </v-card>
          </v-window-item>
          <v-window-item>
            <v-card class="no-bottom-border-radius scrollable">
              <v-card-text class="info-text no-bottom-border-radius">
                <v-container>
                  <h3 class="pb-1">
                    The Reason for Seasons
                  </h3>
                  <p>
                    Earth's axis has a 23.4 degree tilt, which causes the seasons we experience.
                  </p>
                  <p>
                    The key factors are how high in the sky the Sun gets, and how long it stays in the sky on a particular day. The higher the Sun and the longer it is in the sky, the more energy we receive.
                  </p>
                  <p>
                    You can explore how the Sun moves in the sky on different dates for a single location, or for multiple locations. 
                  </p>
                  <h4 class="pt-2">Explore a single location</h4>
                  <p>
                    For a single location, here are some questions you might try to answer:
                  </p>
                  <ul class="ml-5 pb-1 explore-list">
                    <li>
                      What is the angle of the Sun in the sky when it reaches its peak height on each of the four equinox and solstice dates?
                    </li>
                    <li>
                      On which of those dates is the Sun's peak height the highest?
                    </li>
                    <li>
                      On which of those dates is the Sun's peak height the lowest?
                    </li>
                    <li>
                      How many hours is the Sun in the sky on each of the four equinox and solstice dates?
                    </li>
                    <li>
                      On which of those dates is the Sun in the sky for the most amount of time?
                    </li>
                    <li>
                      On which of those dates is the Sun in the sky for the least amount of time?
                    </li>
                    <li>
                      Why do you think the equinoxes are called equinoxes?
                    </li>
                    <li>
                      What are the differences in the peak heights for those four dates, and how does it relate to the tilt of the Earth's axis?
                    </li>
                    <li>
                      What is notable about where the Sun rises and sets on the equinoxes?
                    </li>
                  </ul>
                  <h4 class="pt-2">Explore multiple locations</h4>
                  <p>
                    Use the location selector to try answering some of these questions:
                  </p>
                  <ul class="ml-5 pb-1 explore-list">
                    <li>
                      What seasons would be experienced by someone at your latitude, but roughly on the opposite side of the equator? (For example, Cambridge, MA has a latitude 42° NORTH of the equator. How would the seasons compare at a latitude that is 42° SOUTH of the equator?)
                    </li>
                    <li>
                      At what latitude ranges will the Sun never rise or never set on the solstices?
                    </li>
                    <li>
                      What latitude ranges will never experience the Sun being directly overhead (at a sky angle of 90°) on any date?
                    </li>
                    <li>
                      What latitude ranges will experience equal day and night every single day?
                    </li>

                  </ul>
                  <v-row class="mt-5">
                    <v-col cols="12">
                      <div class="credits">
                        <h3>Credits:</h3>
                        <h4><a href="https://www.cosmicds.cfa.harvard.edu/" target="_blank" rel="noopener noreferrer">CosmicDS</a> Vue Data Stories Team:</h4>
                        Pat Udomprasert<br>
                        Jon Carifio<br>
                        Azmé Tariq<br>
                        Harry Houghton<br>
                        John Lewis<br>
                        Alyssa Goodman<br>
                        Mary Dussault<br>
                        Harry Houghton<br>
                        Evaluator: Sue Sunbury<br>
                        <h4 class="pt-4">WorldWide Telescope Team:</h4>
                        Peter Williams<br>
                        A. David Weigel<br>
                        Jon Carifio<br>
                      </div>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col>
                      <funding-acknowledgement/>
                    </v-col>
                  </v-row>
                  <v-spacer class="end-spacer"></v-spacer>
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
  R2D,
} from "@cosmicds/vue-toolkit";
import { MapBoxFeature, MapBoxFeatureCollection, geocodingInfoForSearch, textForLocation } from "@cosmicds/vue-toolkit/src/mapbox";

import { useTimezone } from "./timezones";
import { horizontalToEquatorial } from "./utils";
import { resetNSEWText, drawPlanets, renderOneFrame, drawEcliptic, drawSkyOverlays } from "./wwt-hacks";
import { useSun } from "./composables/useSun";
import { formatInTimeZone } from "date-fns-tz";
import { sunPlace } from "./horizon_sky";


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
const forceCamera = ref(true);

const tab = ref(0);

const playing = ref(false);
const showLocationSelector = ref(false);

const showHorizon = ref(true);

const startAzOffset = ref(40 * D2R);
const endAzOffset = ref(-startAzOffset.value);
const azOffsetSlope = computed(() => (endAzOffset.value - startAzOffset.value) / (endTime.value - startTime.value));


const sunDistance = ref(sunPlace.get_distance());

// Get the next 4 "dates of interest"
// i.e. equinoxes and solstices
const currentDate = new Date();
const currentYear = currentDate.getUTCFullYear();
const datesOfInterest = Seasons(currentYear);

// Find dates that have passed and sort them by date
const pastEvents = Object.entries(datesOfInterest)
  .filter(([_key, value]: [string, AstroTime]) => value.date < currentDate)
  .map(entry => entry[0]);

// If we have more than 1 past event, replace the older ones with next year's events
// Keep only the most recent past event as our starting point
if (pastEvents.length > 0) {
  const nextSeasonsInfo = Seasons(currentYear + 1);
  pastEvents.forEach(key => {
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
    const fraction = (currentTime.value.getTime() - startTime.value) / (endTime.value - startTime.value);
    return sliderMin + fraction * sliderRange;
  },
  set(value: number) {
    const fraction = (value - sliderMin) / sliderRange;
    const time = fraction * (endTime.value - startTime.value) + startTime.value;
    store.setTime(new Date(time));
  }
});

const middayTime = computed(() => 0.5 * (startTime.value + endTime.value));
const middayAltAz = computed(() => getSunPositionAtTime(new Date(middayTime.value)));
const highAltDeg = 70;
const highAltTimes = computed(() => {
  const { rising: start, setting: end} = getTimeforSunAlt(highAltDeg, middayTime.value);
  return { start, end }; 
});
const highAltCoordinates = computed(() => {
  if (!(highAltTimes.value.start && highAltTimes.value.end)) {
    return { start: null, end : null };
  }
  return {
    start: getSunPositionAtTime(new Date(highAltTimes.value.start)),
    end: getSunPositionAtTime(new Date(highAltTimes.value.end)),
  };
});

const sortedDatesOfInterest = computed(() => {
  const entries: ([EventOfInterest, AstroTime])[] = Object.entries(datesOfInterest) as [EventOfInterest, AstroTime][];
  const sortedEntries = entries.sort((a, b) => a[1].date.getTime() - b[1].date.getTime());
  
  // Add "today" as the first entry
  const today: [EventOfInterest, AstroTime] = ["today", { date: new Date() } as AstroTime];
  return [today, ...sortedEntries];
});

const EVENTS_OF_INTEREST = [
  "today",
  "mar_equinox",
  "jun_solstice",
  "sep_equinox",
  "dec_solstice",
  "custom",
] as const;
type EventOfInterest = typeof EVENTS_OF_INTEREST[number];

const selectedEvent = ref<EventOfInterest | null>(null);
// const selectedDateType = ref<DateSelection | null>(null);
const selectedCustomDate = ref<Date | null>(null);
const showDatePicker = ref(false);

const getDateForEvent = (event: EventOfInterest): Date => {
  if (event === "today") {
    return new Date();
  } else if (event === "custom" && selectedCustomDate.value) {
    return selectedCustomDate.value;
  } else {
    return datesOfInterest[event].date;
  }
};


const handleDateSelection = (date: Date | null) => {
  if (date) {
    showDatePicker.value = false;
    selectedCustomDate.value = date;
    selectedEvent.value = 'custom';
  }
};

function eventName(event: EventOfInterest): string {
  const isSmall = smallSize.value;
  switch (event) {
  case "today":
    return "Today";
  case "mar_equinox":
    return isSmall ? "Mar Equinox" : "March Equinox";
  case "jun_solstice":
    return isSmall ? "Jun Solstice" : "June Solstice";
  case "sep_equinox":
    return isSmall ? "Sep Equinox" : "September Equinox";
  case "dec_solstice":
    return isSmall ? "Dec Solstice" : "December Solstice";
  case "custom":
    return "Custom";
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

function getCurrentSeasonForDate(date: Date, latitude: number): 'spring' | 'summer' | 'autumn' | 'winter' {
  const year = date.getFullYear();
  const seasonsForYear = Seasons(year);
  
  // Get the season dates for the year
  const marEquinox = seasonsForYear.mar_equinox.date;
  const junSolstice = seasonsForYear.jun_solstice.date;
  const sepEquinox = seasonsForYear.sep_equinox.date;
  const decSolstice = seasonsForYear.dec_solstice.date;
  
  // Determine which season the date falls into
  let season: 'spring' | 'summer' | 'autumn' | 'winter';
  
  const getDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  if (getDate(date) >= getDate(marEquinox) && getDate(date) < getDate(junSolstice)) {
    season = 'spring';
  } else if (getDate(date) >= getDate(junSolstice) && getDate(date) < getDate(sepEquinox)) {
    season = 'summer';
  } else if (getDate(date) >= getDate(sepEquinox) && getDate(date) < getDate(decSolstice)) {
    season = 'autumn';
  } else {
    // Either before March equinox or after December solstice (winter)
    season = 'winter';
  }
  
  // Adjust for hemisphere
  if (latitude < 0) {
    // Southern hemisphere - seasons are opposite
    switch (season) {
    case 'spring': return 'autumn';
    case 'summer': return 'winter';
    case 'autumn': return 'spring';
    case 'winter': return 'summer';
    }
  }
  
  return season;
}

const seasonalColors = {
  spring: '#FFA0D7',  
  summer: '#F7EB67',  
  autumn: '#FEB770',  
  winter: '#c1e2fc'   
};

const accentColor = computed(() => {
  const event = selectedEvent.value;
  if (!event) {
    return seasonalColors.spring;
  }
  const latitude = selectedLocation.value.latitudeDeg;
  // Handle "today" case
  if (event === 'today') {
    const today = new Date();
    const currentSeason = getCurrentSeasonForDate(today, latitude);
    return seasonalColors[currentSeason];
  }
  
  // Handle custom date case
  if (event === 'custom' && selectedCustomDate.value) {
    const customSeason = getCurrentSeasonForDate(selectedCustomDate.value, latitude);
    return seasonalColors[customSeason];
  }
  
  const currentSeason = getCurrentSeason(event, latitude);
  return seasonalColors[currentSeason];
});

const displayedDate = computed(() => {
  if (selectedEvent.value === 'today') {
    return new Date();
  } else if (selectedEvent.value === 'custom' && selectedCustomDate.value) {
    return selectedCustomDate.value;
  } else if (selectedEvent.value) {
    return datesOfInterest[selectedEvent.value].date;
  }
  return new Date(); // fallback
});

const currentDayInfo = computed(() => {
  const day = getDateForEvent(selectedEvent.value || 'today');
  return getStartAndEndTimes(day);
});

function dayString(date: Date) {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: smallSize.value ? "short" : "long",
    day: "numeric",
  });
}

function formatDayLength(milliseconds: number, polarInfo: { sunAlwaysUp: boolean; sunAlwaysDown: boolean }): string {
  if (polarInfo.sunAlwaysDown) {
    return "0h 0m";
  }
  
  if (polarInfo.sunAlwaysUp) {
    return "24h 0m";
  }
  
  // Normal calculation for days with sunrise/sunset
  const totalMinutes = Math.round(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function getStartAndEndTimes(day: Date): [Date, Date, { sunAlwaysUp: boolean; sunAlwaysDown: boolean }] {
  const time = day.getTime();
  const { rising: dayStart, setting: dayEnd } = getTimeforSunAlt(0, time);

  let start: Date;
  let end: Date;
  let sunAlwaysUp = false;
  let sunAlwaysDown = false;

  if (dayStart === null || dayEnd === null) {
    
    // Check if the sun is always above or always below the horizon
    const noonTime = time - (time % (24 * 60 * 60 * 1000)) - selectedTimezoneOffset.value + 12 * 60 * 60 * 1000;
    const noonSun = getSunPositionAtTime(new Date(noonTime));
    
    if (noonSun.altRad > 0) {
      sunAlwaysUp = true;
    } else {
      sunAlwaysDown = true;
    }
    // utcMidnight = time - (time % (24 * 60 * 60 * 1000))
    // localMidnight = utcMidnight - timezone offset
    const localMidnight = time - (time % (24 * 60 * 60 * 1000)) - selectedTimezoneOffset.value;
    start = new Date(localMidnight);
    end = new Date(localMidnight + 86400000 - 60);
  } else {
    start = new Date(dayStart);
    end = new Date(dayEnd);
  }
  
  return [start, end, { sunAlwaysUp, sunAlwaysDown }];
}

function updateSliderBounds(_newLocation: LocationDeg, oldLocation: LocationDeg) {
  if (selectedEvent.value === null) {
    return;
  }
  const [start, end, _polarInfo] = getStartAndEndTimes(getDateForEvent(selectedEvent.value));
  startTime.value = start.getTime();
  endTime.value = end.getTime();

  const oldOffset = getTimezoneOffset(tzlookup(oldLocation.latitudeDeg, oldLocation.longitudeDeg));

  const diff = oldOffset - selectedTimezoneOffset.value;
  let newSelectedTime = currentTime.value.getTime() + diff;
  newSelectedTime = Math.min(Math.max(startTime.value, newSelectedTime), endTime.value);
  selectedTime.value = newSelectedTime;
  
  // Update time in WWT to reflect the new location's timing
  store.setTime(new Date(newSelectedTime));
}

function handlePlaying( _playing ) {
  if(forceCamera.value) {
    resetView(MAX_ZOOM);
  }
  // Auto-pause when time reaches sunset or sunrise, accounting for playing direction
  if (playing.value && ((currentTime.value.getTime() >= endTime.value && store.clockRate >= 0) || ( currentTime.value.getTime() <= startTime.value && store.clockRate <= 0))) {
    playing.value = false;
    return;
  }  

  playing.value = _playing;
  wwtStats.playPauseCount += 1;
}

function goToEvent(event: EventOfInterest) {
  const day = getDateForEvent(event);
  const time = day.getTime();

  const [start, end, _polarInfo] = getStartAndEndTimes(day);
  if (event !== 'custom') {
    selectedCustomDate.value = day;
  }
  store.setTime(new Date(time));
  const timeStart = start.getTime();
  store.setTime(new Date(timeStart));
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
  // latitudeDeg: 72.40 // test polar latitude
});
const selectedLocationInfo = ref<LocationInfo>({ name: "", latitude: "", longitude: "" });
const searchErrorMessage = ref<string | null>(null);
const geocodingOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  access_token: process.env.VUE_APP_MAPBOX_ACCESS_TOKEN ?? "", 
};

let userSelectedMapLocations: [number, number][] = [];
let userSelectedSearchLocations: [number, number][] = [];

function updateLocationFromMap(location: LocationDeg) {
  console.log("Updating location from map:", location);
  selectedLocation.value = location;
  userSelectedMapLocations.push([location.latitudeDeg, location.longitudeDeg]);
}

function latText(latitudeDeg: number): string {
  const ns = latitudeDeg >= 0 ? 'N' : 'S';
  const lat = Math.abs(latitudeDeg).toFixed(2);
  return `${lat}° ${ns}`;
}

function lonText(longitudeDeg: number): string {
  const ew = longitudeDeg >= 0 ? 'E' : 'W';
  const lon = Math.abs(longitudeDeg).toFixed(2);
  return `${lon}° ${ew}`;
}

interface LocationInfo {
  name: string;
  latitude: string;
  longitude: string;
}

async function getLocationInfo(longitudeDeg: number, latitudeDeg: number): Promise<LocationInfo> {
  let location: string = "";
  // eslint-disable-next-line @typescript-eslint/naming-convention
  try {
    location = await textForLocation(longitudeDeg, latitudeDeg, geocodingOptions);
  } catch (err) {
    console.error("Error getting location text:", err);
  }
  const locationName = !startsWithNumber(location) ? `${location}` : "";
  const formattedLat = latText(latitudeDeg);
  const formattedLon = lonText(longitudeDeg);

  return {
    name: locationName,
    latitude: formattedLat,
    longitude: formattedLon,
  };
}

function startsWithNumber(text: string): boolean {
  return text.charAt(0).match(/[0-9]|-/) !== null;
}

function setLocationFromFeature(feature: MapBoxFeature) {
  selectedLocation.value = { longitudeDeg: feature.center[0], latitudeDeg: feature.center[1] };
  getLocationInfo(feature.center[0], feature.center[1]).then(locationInfo => {
    selectedLocationInfo.value = locationInfo;
  }).catch(_err => {
    searchErrorMessage.value = "An error occurred while searching";
  });
}

function setLocationFromSearchFeature(feature: MapBoxFeature) {
  setLocationFromFeature(feature);
  userSelectedSearchLocations.push(feature.center);
}

async function updateSelectedLocationInfo() {
  const locationInfo = await getLocationInfo(selectedLocation.value.longitudeDeg, selectedLocation.value.latitudeDeg);
  selectedLocationInfo.value = locationInfo;
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
// setInterval(() => {
//   if (playing.value) {
//     selectedTime.value = currentTime.value.getTime();
//   }
// }, 40);

const { selectedTimezone, selectedTimezoneOffset } = useTimezone(selectedLocation);
  
const { getTimeforSunAlt, getSunPositionAtTime } = useSun({
  store,
  location: selectedLocation,
  selectedTime: currentTime,
  selectedTimezoneOffset,
  zoomLevel: 360,
});

const selectedLocaledTimeDateString = computed(() => {
  const formatString = "h:mm aa (zzz)";
  return formatInTimeZone(currentTime.value, selectedTimezone.value, formatString);
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

function aspectRatioSetup() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error WWTControl does have a canvas element (that's not TS-exposed)
  const canvas = WWTControl.singleton.canvas as HTMLCanvasElement;

  function updateAzOffsets() {
    const aspectRatio = canvas.width / canvas.height;
    startAzOffset.value = 0.35 * (60 * aspectRatio + 13.5) * D2R;
    endAzOffset.value = -startAzOffset.value;
  }

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === canvas) {
        updateAzOffsets();
        resetView();
        return;
      }
    }
  });

  observer.observe(canvas);
  updateAzOffsets();
}

onMounted(() => {
  updateSelectedLocationInfo();
  store.waitForReady().then(async () => {
    WWTControl.singleton.set_zoomMax(MAX_ZOOM);
    skyBackgroundImagesets.forEach(iset => backgroundImagesets.push(iset));

    updateWWTLocation(selectedLocation.value);
    
    aspectRatioSetup();

    store.setClockSync(false);
    store.setClockRate(0);

    // Adding Alt-Az grid here
    store.applySetting(["showAltAzGrid", true]);
    store.applySetting(["showAltAzGridText", true]);
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

const inNorthernHemisphere = computed(() => selectedLocation.value.latitudeDeg > 0);

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

function resetView(zoomDeg?: number, withAzOffset=true) {
  const time = store.currentTime;
  const t = time.getTime();

  const latRad = selectedLocation.value.latitudeDeg * D2R;
  const lonRad = selectedLocation.value.longitudeDeg * D2R;

  const sunAltAz = getSunPositionAtTime(time);
  let az = sunAltAz.azRad;
  let altDeg = 33;

  const middayAltDeg = middayAltAz.value.altRad * R2D;
  const middayAzDeg = middayAltAz.value.azRad * R2D;
  const peakNorth = Math.min(Math.abs(middayAzDeg), Math.abs(middayAzDeg - 360)) < Math.abs(middayAzDeg - 180);
  if (middayAltDeg > highAltDeg) {

    // Altitude modifications
    const dayFrac  = (time.getTime() - startTime.value) / (endTime.value - startTime.value);
    const dayAzFactor = -2 * Math.abs(0.5 - dayFrac) + 1;
    altDeg = middayAltDeg * dayAzFactor;
    altDeg = Math.max(90 - Math.abs(altDeg - 90), 33);

    // Azimuth modifications
    const { start: highStartTime, end: highEndTime } = highAltTimes.value;
    const { start, end } = highAltCoordinates.value;
    if (highStartTime && highEndTime && start && end && t > highStartTime && t < highEndTime) {
      const topStartAz = start.azRad;
      let topEndAz = end.azRad;
      const tSouth = (Math.PI - topStartAz) / (topEndAz - topStartAz);
      const passThroughSouth = tSouth >= 0 && tSouth <= 1;
      if (peakNorth === passThroughSouth) {
        topEndAz -= 2 * Math.PI;
      }

      const tTop = (t - highStartTime) / (highEndTime - highStartTime);
      az = tTop * (topEndAz - topStartAz) + topStartAz;
    }
  }
  const alt = altDeg * D2R;

  if (t > 0 && withAzOffset) {
    const offset = (azOffsetSlope.value * (t - startTime.value) + startAzOffset.value);
    const sgn = peakNorth ? -1 : 1;
    az += (offset * sgn);
  }
  const raDec = horizontalToEquatorial(
    alt,
    az,
    latRad,
    lonRad,
    time,
  );

  store.gotoRADecZoom({
    raRad: raDec.raRad,
    decRad: raDec.decRad,
    zoomDeg: zoomDeg ?? MAX_ZOOM,
    instant: true,
  });
}

function updateWWTLocation(location: LocationDeg) {
  wwtSettings.set_locationLat(location.latitudeDeg);
  wwtSettings.set_locationLng(location.longitudeDeg);
}

function doWWTModifications() {
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
  function newUpdatePlanetLocations(threeD: boolean) {
    originalUpdatePlanetLocations(threeD);
    // Only scale the Sun (index 0)
    // Use smaller scale (1) during polar night, normal scale (4) otherwise
    const polarInfo = currentDayInfo.value[2];
    Planets._planetScales[0] = polarInfo.sunAlwaysDown ? 1 : 4;
  }
  Planets.updatePlanetLocations = newUpdatePlanetLocations;
  Planets.drawPlanets = drawPlanets;
}

watch(selectedLocation, (location: LocationDeg, oldLocation: LocationDeg) => {
  updateSelectedLocationInfo();
  updateWWTLocation(location);
  updateSliderBounds(location, oldLocation);
  resetView();
  WWTControl.singleton.renderOneFrame();
});

watch(currentTime, (_time: Date) => {
  // Auto-pause when time reaches sunset or sunrise, accounting for playing direction
  if (playing.value && ((_time.getTime() >= endTime.value && store.clockRate >= 0) || ( _time.getTime() <= startTime.value && store.clockRate <= 0))) {
    playing.value = false;
    return;
  }  
  if (forceCamera.value) {
    resetView(store.zoomDeg);
  }
  sunDistance.value = sunPlace.get_distance();
});

watch(forceCamera, (value: boolean) => {
  if (value) {
    resetView();
  }
});

watch(selectedEvent, (event: EventOfInterest | null) => {
  if (event) {
    goToEvent(event);
  }
});

watch(selectedCustomDate, (date: Date | null) => {
  if (date && selectedEvent.value === "custom") {
    goToEvent("custom");
  }
});

watch(inNorthernHemisphere, (_inNorth: boolean) => resetNSEWText());

</script>

<style lang="less">
@font-face {
  font-family: "Highway Gothic Narrow";
  src: url("./assets/HighwayGothicNarrow.ttf");
}

:root {
  font-size: clamp(0.8rem, min(1.7vh, 1.7vw), 1.1rem);
}

html {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #000;
  overflow: auto !important;

  -ms-overflow-style: none;
  // scrollbar-width: none;
}

body {
  position: fixed;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: auto !important;

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
  font-size: 11pt;
  overflow: auto !important;

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
  gap: 5px;
  align-items: flex-start;
}

#left-buttons .icon-wrapper {
  width: 30%;
  flex-shrink: 0;
}

#right-buttons {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  height: auto;

  .date-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;    
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
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
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
      line-height: 1.6;
      padding-top: 0;
      padding-left: ~"max(4vw, 16px)";
      padding-right: ~"max(4vw, 16px)";

      h3 {
        padding-top: 5px;
      }

      h4 {
        padding-top: 5px;
        padding-bottom: 4px;
      }

      p {
        padding-block: 3px;
      }

      @media (max-width: 699px) {
        h3 {
          font-size: 1.3rem;
        }

        h4 {
          font-size: 1.1rem;
        }
      }

      .explore-list {
        li {
          padding-block: 2px;
        }
      }
      
  
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

#location-title {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.icon-location-button {
  cursor: pointer;
  pointer-events: auto;
}

.event-button {
  font-size: 0.9rem;
  background: black;
  border: 1px solid;
  border-radius: 5px;
  padding: 0.5rem;
  pointer-events: auto;
  border-color: white;
  width: 100%;

  &.selected {
    color: var(--accent-color);
    border-color: var(--accent-color);
    border-radius: 5px !important;
    box-shadow: none !important;

    &:hover {
      border-color: color-mix(in srgb, var(--accent-color) 70%, black);
    }
  }

  transition: opacity 0.2s ease;
  
  &:hover {
    border-color: color-mix(in srgb, white 70%, black);
  }  
}

.options {
  color: var(--accent-color);
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  pointer-events: auto;
}

.event-title {
  font-size: 1rem;
  padding-bottom: 5px;
  display: flex;
  align-content: center;
  color: var(--accent-color);
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
}

#date-title {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  align-items: flex-end;

  .displayed-date-info {
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid var(--accent-color);
    border-radius: 5px;
    padding: 0.5rem;
    text-align: right;
    pointer-events: auto;

    .date-display {
      font-weight: bold;
      font-size: 0.9rem;
    }

    .event-display {
      font-size: 0.8rem;
      opacity: 0.9;
    }
  }
}

.date-picker-section {
  display: flex;
  justify-content: flex-end;
  pointer-events: auto;
  width: 100%;

  .calendar-button {
    font-size: 0.7rem;
    text-transform: none;
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

#bottom-content {
  width: 80%;
  display: flex;
  flex-direction: row;
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  // width: calc(100% - 2rem);
  pointer-events: none;
  align-items: center;
  gap: 30px;

  @media (max-width: 959px) {
    width: 95%;
    gap: 5px;
    bottom: 1rem;
  }

  #speed-control-icon-button {
    display: none;
  }

  @media (max-width: 699px) {
    #reset-button {
      display: none;
    }
  }  

  @media (max-height: 599px) {
    bottom: 0.5rem;
  }

  #speed-text {
    font-size: 1rem;
    background-color: transparent !important;
    color: var(--accent-color);
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  }

}

#time-slider-chips {
  width: 90%;
  display: flex;
  flex-direction: column;
  padding-left: 3rem;
  padding-right: 2rem;

  .v-input__details {
    height: 0;
    min-height: 0;
    padding-top: 0;
  }
  
  @media (max-width: 699px) {
    padding-left: 1.5rem;
    padding-right: 1rem;
    min-width: 50%;
  }
}

.v-slider {
  pointer-events: auto;
}

.time-slider {

  .v-slider-thumb {

    .v-slider-thumb__label {
      color: white;
      background-color: rgba(0, 0, 0, 0.5);
      font-weight: 600;
      border: 2px solid var(--accent-color);
      border-radius: 5px;
      width: max-content;
      padding: 10px;
      font-size: 0.8rem;

      &::before {
        color: var(--accent-color);
      }

      @media (max-width: 699px) {
        padding-inline: 5px;
      }
    }
  }
  @media (max-width: 699px) {
    padding-left: 5px;
  }

}

.time-chips {
  display: flex;
  justify-content: space-between;
  pointer-events: auto;

  .time-chip {
    cursor: pointer;
    font-size: 0.8rem;

    &:hover {
      opacity: 0.8;
    }
  }

  @media (max-width: 699px) {
    font-size: 0.7rem;
    padding-inline: 1px;
  }
}

#bottom-content #speed-buttons {
  @media (max-width: 699px) {
    gap: 6px !important;
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

.location-display {
  display: flex;
  flex-direction: column;
  align-items: left;
}

#location-button {
  pointer-events: auto;
  height: fit-content;
  text-align: left;
  padding-inline: 0.5rem;
}

#body-logos {
  position: absolute;
  right: 0.5em;
  bottom: 0.1em;

  img {
    height: 32px;
  }

  @media (max-height: 599px) {
    img {
      display: none;
    }
  }
}

.info-tabs {
  @media (max-width: 699px) {
    .v-btn {
      padding-inline: 0px;
    }

    h3 {
      font-size: 1rem;
    }
  }  
}

svg.fa-xmark {
  padding: 0.5em;
  margin: -0.5em;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
}

#geolocation-close >  svg.fa-xmark:hover {
  background-color: rgba(255, 255, 255, 0.5);
  overflow: visible;
  z-index: 9000;
}

#date-info {
  margin-bottom: 10px;
}

.info-button {
  /* most of the styling comes from .event-button */
  border: 1px solid var(--accent-color);
  text-align: right;
  user-select: none; /* Standard */
  pointer-events: auto;

  &:hover {
    border-color: color-mix(in srgb, var(--accent-color) 70%, black);
  }  
}

.display-date-button {
  cursor: pointer;
  pointer-events: auto;
}

.clickable-object {
  cursor: pointer;
  pointer-events: auto;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.7;
  }
}

.icon-wrapper, .options {
  &:hover {
    opacity: 0.7;
  }  
}

</style>
