import { Ref, ref, computed, isRef, type MaybeRef } from "vue";
import { Classification, SolarSystemObjects } from "@wwtelescope/engine-types";
import { Place} from "@wwtelescope/engine";
import { AltAzRad, EquatorialRad, LocationDeg, LocationRad } from "../types";
import { AstroCalc } from "@wwtelescope/engine";
import { equatorialToHorizontal, getJulian } from "../utils";
import { D2R } from "@cosmicds/vue-toolkit";
import { engineStore } from "@wwtelescope/engine-pinia";
type WWTEngineStore = ReturnType<typeof engineStore>;


const SECONDS_PER_DAY = 60 * 60 * 24;
const MILLISECONDS_PER_DAY = 1000 * SECONDS_PER_DAY;

const secondsInterval = 40;
const MILLISECONDS_PER_INTERVAL = 1000 * secondsInterval;
const RADIANS_TO_ARCSECONDS = (180 / Math.PI) * 3600; //
const R2S = RADIANS_TO_ARCSECONDS;

type RefOrType<T> = Ref<T> | T;

interface SunPos extends AltAzRad {
  decRad: number;
  raRad: number;
}

interface SunAltOptions {
    useLimb?: boolean;
    useRefraction?: boolean;
  }

export interface UseSunOptions {
  store: WWTEngineStore;
  location: Ref<LocationDeg>;
  selectedTime: MaybeRef<number> | MaybeRef<Date>;
  selectedTimezoneOffset: RefOrType<number>;
  zoomLevel?: number;
  onStart?: () => void;
}

export function useSun(options: UseSunOptions) {
  
  options.store.waitForReady().then(async () => {
    if (options.onStart) {
      options.onStart();
    }
  });

  let time = isRef(options.selectedTime) ? options.selectedTime.value : options.selectedTime;
  time = typeof time === "number" ? time : time.getTime();
  
  const selectedTime = ref(time);
  const selectedTimezoneOffset = ref(options.selectedTimezoneOffset);
  
  const locationRad = computed<LocationRad>(() => {
    return {
      latitudeRad: options.location.value.latitudeDeg * D2R,
      longitudeRad: options.location.value.longitudeDeg * D2R,
    };
  });

  const sunPlace = new Place();
  sunPlace.set_names(["Sun"]);
  sunPlace.set_classification(Classification.solarSystem);
  sunPlace.set_target(SolarSystemObjects.sun);
  sunPlace.set_zoomLevel(options.zoomLevel ?? 20);
  
  const sunPosition = computed<EquatorialRad>(() =>{
    return {
      raRad: sunPlace.get_RA() * 15 * D2R,
      decRad: sunPlace.get_dec() * D2R,
    } as EquatorialRad;
  });
  

  
  function getSunPositionAtTime(time: Date): SunPos {
    const jd = getJulian(time);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const currentRaDec = AstroCalc.getPlanet(jd, 0, locationRad.value.latitudeRad, locationRad.value.longitudeRad, 0);
    const sunAltAz = equatorialToHorizontal(currentRaDec.RA * 15 * D2R, currentRaDec.dec * D2R, locationRad.value.latitudeRad, locationRad.value.longitudeRad, time);
    return {...sunAltAz, decRad: currentRaDec.dec * D2R, raRad: currentRaDec.RA * 15 * D2R };
  }
  
  function lerp(x0: number, y0: number, x1: number, y1: number, x: number): number {
    // return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
    const m = (y1 - y0) / (x1 - x0);
    const b = y0 - m * x0;
    return m * x + b;
  }
  
  function _interpolateSunAltitude(time: number, step: number, desiredAltDeg: number): number {
    const alt1 = getSunPositionAtTime(new Date(time - step)).altRad;
    const alt2 = getSunPositionAtTime(new Date(time + step)).altRad;
    const out =  lerp(alt1, time - step, alt2, time + step, desiredAltDeg * D2R);
    console.log("Interpolating sun altitude");
    return out;
  }
  
  function meridionalAltitude(sunDec: number, latitude: number, offset = 0) {
    const upperCulmination = 90 * D2R - Math.abs(latitude - sunDec) + offset;
    const lowerCulmination = -90 * D2R + Math.abs(latitude + sunDec) + offset;
    const alwaysAbove = lowerCulmination > 0;
    const alwaysBelow = upperCulmination < 0;
    return {upperCulmination, lowerCulmination, always: (alwaysAbove ? 'up' :  (alwaysBelow ? 'down' : null)) };
  }
  
  // function that finds at what time the center of the sun will reach a given altitude during the current day to within 15 minutes
  
  function getTimeforSunAlt(altDeg: number, referenceTime?: number, options?: SunAltOptions ): { rising: number | null; setting: number | null; always: 'up' | 'down' | null } {
    // takes about 45ms to run
    // search for time when sun is at given altitude
    // start at 12:00am and search every MINUTES_PER_INTERVAL
    // const minTime = selectedTime.value - (selectedTime.value % MILLISECONDS_PER_DAY) - selectedTimezoneOffset.value + 0.5 * MILLISECONDS_PER_DAY;
    // const maxTime = minTime + 0.5 * MILLISECONDS_PER_DAY;
    
    const useLimb = options && options.useLimb ? options.useLimb : false;
    const useRefraction = options && options.useRefraction ? options.useRefraction : false;
    
    const rSunDeg = ((0.009291568 / 2) / D2R); // from WWT planets.js // Sun's ang size in AU = it's ang size in Radians
    const extraDeg = (useLimb ? rSunDeg : 0) + (useRefraction ? 0.5667 : 0);
    altDeg = altDeg - extraDeg;
    
    const refTime = referenceTime ?? selectedTime.value;
    const startOfDay = refTime - (refTime % MILLISECONDS_PER_DAY) - selectedTimezoneOffset.value; 
    const endOfDay = startOfDay + MILLISECONDS_PER_DAY - 1;
    
    // let's begin search at the start of the day
    let time = startOfDay;
    // eslint-disable-next-line prefer-const
    let { altRad: sunAlt, decRad : sunDec }  = getSunPositionAtTime(new Date(time)); 
    // when we correct for refraction and limb, the effect point we use for the meridional altitude changes
    // in particular, it increases the upper and lower culmination
    const circumstances =  meridionalAltitude(sunDec, locationRad.value.latitudeRad, extraDeg);
    let upperCulmination = circumstances.upperCulmination;
    let lowerCulmination = circumstances.lowerCulmination;
    
    // eslint-disable-next-line prefer-const
    let always: 'up' | 'down' | null = circumstances.always as ('up' | 'down' | null);
    
    // if the sign a 0.6 days later is the same, then the sun either never rises or never sets
    // don't short circuit because timezones mess up the time. you would have to correct to solar
    if (always === 'up') {
      return { rising: null, setting: null, always: always };
    } else if (always === 'down') {
      return { rising: null, setting: null,  always: always };
    } 
    
    // if it culminates 
    if (upperCulmination * R2S < 2 && always === null) {
      console.error(`Upper culmination is too close to the horizon = ${upperCulmination * R2S} arcsec.`);
      return { rising: null, setting: null, always: 'down' };
    }
    
    if (lowerCulmination * R2S > -2 && always === null) {
      console.error(`Lower culmination is too close to the horizon = ${lowerCulmination * R2S} arcsec.`);
      return { rising: null, setting: null, always: 'up' };
    }
    
    console.log(`Upper culmination: ${upperCulmination * R2S} arcsec`);
    console.log(`Lower culmination: ${lowerCulmination * R2S} arcsec`);
    // find the two times it crosses the given altitude
    while ((sunAlt < altDeg * D2R) && (time < endOfDay)) {
      time += MILLISECONDS_PER_INTERVAL;
      sunAlt = getSunPositionAtTime(new Date(time)).altRad;
      upperCulmination = Math.max(upperCulmination, sunAlt);
      lowerCulmination = Math.min(lowerCulmination, sunAlt);
    }
    let interp = () => _interpolateSunAltitude(time, MILLISECONDS_PER_INTERVAL, altDeg);
    const rising = time >= endOfDay ? null : interp();
    while ((sunAlt > altDeg * D2R) && (time < endOfDay)) {
      time += MILLISECONDS_PER_INTERVAL;
      sunAlt = getSunPositionAtTime(new Date(time)).altRad;
      upperCulmination = Math.max(upperCulmination, sunAlt);
      lowerCulmination = Math.min(lowerCulmination, sunAlt);
    }
    interp = () =>_interpolateSunAltitude(time, MILLISECONDS_PER_INTERVAL, altDeg);
    const setting = time >= endOfDay ? null : interp();
    
    // check some of the edge cases and log errors
    // always = null implies that it truly rises and sets
    if (always === null ) {
      // if either is null, that means we could not detect it.
      if (rising === null || setting === null) {
        console.error(
          "Error calculating sun rise/set times", 
          `Rising: ${rising}, Setting: ${setting}.`,
          `Upper culmination: ${upperCulmination / D2R}, Lower culmination: ${lowerCulmination / D2R}, 
          Desired alt: ${altDeg}`);
        // we can't trust the results. if the upper culmination is small, then it's always down
        // if the lower culmination is small, then it's always up
        always = Math.abs(upperCulmination) < Math.abs(lowerCulmination) ? 'down' : 'up';
        return {
          'rising': null,
          'setting': null,
          'always': always,
        };
      }
    }
    return {
      'rising': (rising !== null && setting !== null) ? Math.min(rising, setting) : rising,
      'setting': (rising !== null && setting !== null) ? Math.max(rising, setting) : setting,
      'always': always,
    };
  }
  
  
  return { getTimeforSunAlt, getSunPositionAtTime, sunPlace, sunPosition };
}
