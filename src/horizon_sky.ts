// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/* eslint-disable */


// We need this import for WWT types that aren't exported
// from the engine at the JS level
import * as wwtlib from "@wwtelescope/engine";
import {
  Color,
  Coordinates,
  Place,
  RenderContext,
  Settings,
  SpaceTimeController,
  WWTControl,
} from "@wwtelescope/engine";
import { Classification, SolarSystemObjects } from "@wwtelescope/engine-types";
import { HorizonSkyOptions } from "./types";
import { equatorialToHorizontal, horizontalToEquatorial, skyOpacityForSunAlt } from "./utils";
import { D2R, R2D } from "@cosmicds/vue-toolkit";

export const sunPlace = new Place();
sunPlace.set_names(["Sun"]);
sunPlace.set_classification(Classification.solarSystem);
sunPlace.set_target(SolarSystemObjects.sun);
sunPlace.set_zoomLevel(20);


export const drawHorizon = (renderContext: RenderContext, options: HorizonSkyOptions) => {
  const n = 6;
  const delta = 2 * Math.PI / n;
  const triangleList = new wwtlib.TriangleList();
  const color = Color.load(options.color);
  color.a = Math.round(255 * options.opacity ?? 1);
  const settings = Settings.get_active();
  const longitudeRad = settings.get_locationLng() * D2R;
  const latitudeRad = settings.get_locationLat() * D2R;
  const now = SpaceTimeController.get_now();
  for (let i = 0; i < n; i++) {
    let points: [number, number][] = [
      [0, i * delta],
      [-Math.PI / 2, i * delta],
      [0, (i + 1) * delta]
    ];
    points = points.map((point) => {
      const raDecRad = horizontalToEquatorial(...point, latitudeRad, longitudeRad, now);
      return Coordinates.raDecTo3d(R2D * raDecRad.raRad / 15, R2D * raDecRad.decRad);
    });
    triangleList.addSubdividedTriangles(...points, color, new wwtlib.Dates(0, 1), 2);
    
  }
  triangleList.draw(renderContext, 1, true);

};


export const drawSky = (renderContext: RenderContext, options: HorizonSkyOptions) => {
  const n = 6;
  const delta = 2 * Math.PI / n;
  const triangleList = new wwtlib.TriangleList();
  const color = Color.load(options.color);
  const settings = Settings.get_active();
  const longitudeRad = settings.get_locationLng() * D2R;
  const latitudeRad = settings.get_locationLat() * D2R;

  const sunAltAz = equatorialToHorizontal(sunPlace.get_RA() * 15 * D2R,
                                          sunPlace.get_dec() * D2R,
                                          latitudeRad,
                                          longitudeRad,
                                          SpaceTimeController.get_now());
  const opacity = skyOpacityForSunAlt(sunAltAz.altRad);
  color.a = Math.round(255 * opacity);
  WWTControl.scriptInterface.setForegroundOpacity((1 - opacity) * 100);
  const now = SpaceTimeController.get_now();
  for (let i = 0; i < n; i++) {
    let points: [number, number][] = [
      [0, i * delta],
      [0, (i + 1) * delta],
      [Math.PI / 2, i * delta] // In addition to using +pi/2 instead of -pi/2, I had to switch the order of the 2nd & 3rd points relative to the horizon set. I don't know why, but before I switched them, the polygons didn't render.
    ];
    points = points.map((point) => {
      const raDecRad = horizontalToEquatorial(...point, latitudeRad, longitudeRad, now);
      return Coordinates.raDecTo3d(R2D * raDecRad.raRad / 15, R2D * raDecRad.decRad);
    });
    triangleList.addSubdividedTriangles(...points, color, new wwtlib.Dates(0, 1), 2);
    
  }
  triangleList.draw(renderContext, 1, true);

};
