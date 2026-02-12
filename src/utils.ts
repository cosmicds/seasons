import { D2R, R2D } from "@cosmicds/vue-toolkit";
import { HorizontalRad, EquatorialRad } from "./types";

// WWT does have all of this functionality built in
// but it doesn't seem to be exposed
// We should do that, but for now we just copy the web engine code
// https://github.com/Carifio24/wwt-webgl-engine/blob/master/engine/wwtlib/Coordinates.cs
export function altAzToHADec(altRad: number, azRad: number, latRad: number): { ra: number; dec: number; } {
  azRad = Math.PI - azRad;
  if (azRad < 0) {
    azRad += 2 * Math.PI;
  }
  let ra = Math.atan2(Math.sin(azRad), Math.cos(azRad) * Math.sin(latRad) + Math.tan(altRad) * Math.cos(latRad));
  if (ra < 0) {
    ra += 2 * Math.PI;
  }
  const dec = Math.asin(Math.sin(latRad) * Math.sin(altRad) - Math.cos(latRad) * Math.cos(altRad) * Math.cos(azRad));
  return { ra, dec };
}

export function getJulian(utc: Date): number {
  let year = utc.getUTCFullYear();
  let month = utc.getUTCMonth()+1;
  const day = utc.getUTCDate();
  const hour = utc.getUTCHours();
  const minute = utc.getUTCMinutes();
  const second = utc.getUTCSeconds() + utc.getUTCMilliseconds() / 1000.0;

  if (month == 1 || month == 2)
  {
    year -= 1;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4.0);
  const c = Math.floor(365.25 * year);
  const d = Math.floor(30.6001 * (month + 1));

  // gives julian date: number of days since Jan 1, 4713 BC
  const jd = b + c + d + 1720994.5 + day + (hour + minute / 60.00 + second / 3600.00) / 24.00;
  return jd;
}

export function mstFromUTC2(utc: Date, longRad: number): number {
  const lng = longRad * R2D;

  const modifiedJD = getJulian(utc)  - 2451545;

  const julianCenturies = modifiedJD / 36525.0;
  // this form wants julianDays - 2451545
  let mst = 280.46061837 + 360.98564736629 * modifiedJD + 0.000387933 * julianCenturies * julianCenturies - julianCenturies * julianCenturies * julianCenturies / 38710000 + lng;

  if (mst > 0.0) {
    while (mst > 360.0) {
      mst = mst - 360.0;
    }
  } else {
    while (mst < 0.0) {
      mst = mst + 360.0;
    }
  }

  return mst;
}

export function horizontalToEquatorial(altRad: number, azRad: number, latRad: number, longRad: number, utc: Date): EquatorialRad {
  const st = mstFromUTC2(utc, longRad); // siderial time 

  const haDec = altAzToHADec(altRad, azRad, latRad); // get Hour Angle and Declination
  
  const ha = haDec.ra * R2D;

  let ra = st + ha;
  if (ra < 0) {
    ra += 360;
  }
  if (ra > 360) {
    ra -= 360;
  }
  // ra -= 180;
  // console.log(`Alt: ${(altRad*R2D).toFixed(2)} Az: ${(azRad*R2D).toFixed(2)} Ra: ${ra.toFixed(2)} Dec: ${(haDec.dec*R2D).toFixed(2)}`)

  return { raRad: D2R * ra, decRad: haDec.dec };
}

export function equatorialToHorizontal(raRad: number, decRad: number, latRad: number, longRad: number, utc: Date): HorizontalRad {
  let hourAngle = mstFromUTC2(utc, longRad) - R2D * raRad;
  if (hourAngle < 0) {
    hourAngle += 360;
  }

  const ha = D2R * hourAngle;
  const dec = decRad;
  const lat = latRad;
  
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const altitude = Math.asin(sinAlt);
  const cosAz = (Math.sin(dec) - Math.sin(altitude) * Math.sin(lat)) / (Math.cos(altitude) * Math.cos(lat));
  let azimuth = Math.acos(cosAz);

  azimuth = azimuth + (Math.PI * 80) % (Math.PI * 2);

  if (Math.sin(ha) > 0) {
    azimuth = 2 * Math.PI - azimuth;
  }
  return { altRad: altitude, azRad: azimuth };

}

export function skyOpacityForSunAlt(sunAltRad: number) {
  const civilTwilight = -6 * D2R;
  const astronomicalTwilight = 3 * civilTwilight;
  
  return Math.min(Math.max((1 + Math.atan(Math.PI * sunAltRad / (-astronomicalTwilight))) / 2, 0), 1);
}

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
export function dayFractionForTimestamp(timestamp: number): number {
  return (timestamp % MILLISECONDS_PER_DAY) / MILLISECONDS_PER_DAY;
}
