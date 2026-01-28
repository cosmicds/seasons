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

type RefOrType<T> = Ref<T> | T;

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

  function getSunPositionAtTime(time: Date): AltAzRad {
    const jd = getJulian(time);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const currentRaDec = AstroCalc.getPlanet(jd, 0, locationRad.value.latitudeRad, locationRad.value.longitudeRad, 0);
    const sunAltAz = equatorialToHorizontal(currentRaDec.RA * 15 * D2R, currentRaDec.dec * D2R, locationRad.value.latitudeRad, locationRad.value.longitudeRad, time);
    return sunAltAz;
  }

  // function that finds at what time the center of the sun will reach a given altitude during the current day to within 15 minutes
  function getTimeforSunAlt(altDeg: number, referenceTime?: number, useLimb: boolean = true): { rising: number | null; setting: number | null; always: 'up' | 'down' | null } {
    // takes about 45ms to run
    // search for time when sun is at given altitude
    // start at 12:00am and search every MINUTES_PER_INTERVAL
    // const minTime = selectedTime.value - (selectedTime.value % MILLISECONDS_PER_DAY) - selectedTimezoneOffset.value + 0.5 * MILLISECONDS_PER_DAY;
    // const maxTime = minTime + 0.5 * MILLISECONDS_PER_DAY;
    if (useLimb) {
      // so if altDeg is 0, we want the center to be at -0.27 degrees
      altDeg = altDeg - 0.27; // sun's radius in degrees
    }
    const refTime = referenceTime ?? selectedTime.value;
    const startOfDay = refTime - (refTime % MILLISECONDS_PER_DAY) - selectedTimezoneOffset.value; 
    const justAfterMidDay = startOfDay + 0.5 * MILLISECONDS_PER_DAY; // go a little more than halfway to avoid edge cases
    const endOfDay = startOfDay + MILLISECONDS_PER_DAY - 1;
    // const ehr = eclipticHorizonAngle(location.latitudeRad, dateTime);
    
    // let's begin search at the start of the day
    let time = startOfDay;
    let sunAlt = getSunPositionAtTime(new Date(time)).altRad; 
    const sunAltMid = getSunPositionAtTime(new Date(justAfterMidDay)).altRad; 
    
    let always: 'up' | 'down' | null = null;
    
    // if the sign a 0.6 days later is the same, then the sun either never rises or never sets
    if (Math.sign(sunAlt) == Math.sign(sunAltMid)) {
      if (sunAlt > 0) {
        always = 'up';
        return { rising: null, setting: null, always: always };
      } else if (sunAlt < 0) {
        always = 'down';
        return { rising: null, setting: null,  always: always };
      } else {
        always = null;
        console.error("Why is the sun hovering at the horizon. That's not supposed to happen. We'll just say it's always up.");
        return { rising: null, setting: null,  always: 'up' };
      }
    }

    // find the two times it crosses the given altitude
    while ((sunAlt < altDeg * D2R) && (time < endOfDay)) {
      time += MILLISECONDS_PER_INTERVAL;
      sunAlt = getSunPositionAtTime(new Date(time)).altRad;
    }
    const rising = time == endOfDay ? null : time;
    while ((sunAlt > altDeg * D2R) && (time < endOfDay)) {
      time += MILLISECONDS_PER_INTERVAL;
      sunAlt = getSunPositionAtTime(new Date(time)).altRad;
    }
    const setting = time == endOfDay ? null : time;

    return {
      'rising': (rising !== null && setting !== null) ? Math.min(rising, setting) : rising,
      'setting': (rising !== null && setting !== null) ? Math.max(rising, setting) : setting,
      'always': always,
    };
  }
  
  
  return { getTimeforSunAlt, getSunPositionAtTime, sunPlace, sunPosition };
}
