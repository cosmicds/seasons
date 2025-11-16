import Vue, { createApp, type Plugin } from "vue";

import {
  FundingAcknowledgement,
  IconButton,
  LocationSelector,
  GeolocationButton,
  CreditLogos,
  SpeedControl,
  DateTimePicker,
  // LocationSearch,
} from "@cosmicds/vue-toolkit";
import SeasonsStory from "./SeasonsStory.vue";

import SplashScreen from "./components/SplashScreen.vue";
import LocationSearch from "./components/LocationSearch.vue";
import TimeDisplay from "./components/TimeDisplay.vue";
import QuestionDialog from "./components/QuestionDialog.vue";

import vuetify from "../plugins/vuetify";
import { VIcon } from "vuetify/components/VIcon";

import { FontAwesomeIcon, FontAwesomeLayers } from "@fortawesome/vue-fontawesome";

import { WWTComponent, wwtPinia } from "@wwtelescope/engine-pinia";


import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faBookOpen,
  faLocationDot,
  faSun,
  faTimes,
  faVideo,
  faXmark,
  faInfo,
  faMagnifyingGlass,
  faCalendarDay,
} from "@fortawesome/free-solid-svg-icons";

library.add(faBookOpen);
library.add(faLocationDot);
library.add(faSun);
library.add(faTimes);
library.add(faVideo);
library.add(faXmark);
library.add(faInfo);
library.add(faMagnifyingGlass);
library.add(faCalendarDay);

/** v-hide directive taken from https://www.ryansouthgate.com/2020/01/30/vue-js-v-hide-element-whilst-keeping-occupied-space/ */
// Extract the function out, up here, so I'm not writing it twice
const update = (el: HTMLElement, binding: Vue.DirectiveBinding) => el.style.visibility = (binding.value) ? "hidden" : "";

createApp(SeasonsStory, {
  wwtNamespace: "seasons-story"
})
 
  // Plugins
  .use(wwtPinia as unknown as Plugin<[]>)
  .use(vuetify)

  // Directives
  .directive(
    /**
    * Hides an HTML element, keeping the space it would have used if it were visible (css: Visibility)
    */
    "hide", {
      // Run on initialisation (first render) of the directive on the element
      beforeMount(el, binding, _vnode, _prevVnode) {
        update(el, binding);
      },
      // Run on subsequent updates to the value supplied to the directive
      updated(el, binding, _vnode, _prevVnode) {
        update(el, binding);
      }
    })

  // Components
  .component("WorldWideTelescope", WWTComponent)
  .component("splash-screen", SplashScreen)
  .component('font-awesome-icon', FontAwesomeIcon)
  .component('font-awesome-layers', FontAwesomeLayers)
  .component('icon-button', IconButton)
  .component('funding-acknowledgement', FundingAcknowledgement)
  .component('credit-logos', CreditLogos)
  .component('speed-control', SpeedControl)
  .component('geolocation-button', GeolocationButton)
  .component('location-search', LocationSearch)
  .component('location-selector', LocationSelector)
  .component('date-time-picker', DateTimePicker)
  .component('time-display', TimeDisplay)
  .component('question-dialog', QuestionDialog)
  .component('v-icon', VIcon)

  // Mount
  .mount("#app");
