// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/* eslint-disable */

import {
  Annotation,
  Color,
  Colors,
  Constellations,
  Coordinates,
  CT,
  DT,
  GlyphCache,
  Grids,
  Matrix3d,
  Planets,
  RenderContext,
  RenderTriangle,
  Settings,
  SimpleLineList,
  SpaceTimeController,
  Text3d,
  Text3dBatch,
  Texture,
  Tile,
  TileCache,
  TourPlayer,
  URLHelpers,
  Vector3d,
  WebFile,
  WWTControl,
} from "@wwtelescope/engine";

import { drawHorizon, drawSky } from "./horizon_sky";
import { makeTextOverlays } from "./text";

const nsewBatch = null;

export function resetNSEWText() {
  nsewBatch = null;
}

export function makeNSEWText() {
  if (nsewBatch == null) {
    const glyphHeight = 130;  
    nsewBatch = new Text3dBatch(glyphHeight);
    const sign = SpaceTimeController.get_location().get_lat() < 0 ? -1 : 1;
    const alt = 0.03 * sign;
    const up = Vector3d.create(0, sign, 0);
    const directions = [
      [[0, alt, -1], "N"],
      [[-sign, alt, 0], "E"],
      [[0, alt, 1], "S"],
      [[sign, alt,  0], "W"],
    ]
    directions.forEach(([v, text]) => {
      nsewBatch.add(new Text3d(Vector3d.create(...v), up, text, 75, 0.00018));
    });
    useCustomGlyphs(nsewBatch);
  }
}

export function drawNSEWText(renderContext, opacity, drawColor) {
  var zenithAltAz = new Coordinates(0, 0);
  var zenith = Coordinates.horizonToEquitorial(zenithAltAz, SpaceTimeController.get_location(), SpaceTimeController.get_now());
  var raPart = -((zenith.get_RA() - 6) / 24 * (Math.PI * 2));
  var decPart = -(zenith.get_dec() / 360 * (Math.PI * 2));
  var raText = Coordinates.formatDMS(zenith.get_RA());
  var mat = Matrix3d._rotationY(-raPart - Math.PI);
  mat._multiply(Matrix3d._rotationX(decPart));
  mat.invert();
  makeNSEWText();
  var matOldWorld = renderContext.get_world().clone();
  var matOldWorldBase = renderContext.get_worldBase().clone();
  renderContext.set_worldBase(Matrix3d.multiplyMatrix(mat, renderContext.get_world()));
  renderContext.set_world(renderContext.get_worldBase().clone());
  renderContext.makeFrustum();
  nsewBatch.viewTransform = Matrix3d.invertMatrix(mat);
  nsewBatch.draw(renderContext, opacity, drawColor);
  renderContext.set_worldBase(matOldWorldBase);
  renderContext.set_world(matOldWorld);
  renderContext.makeFrustum();
  return true;
}

const GLYPH_CACHE = function(): GlyphCache {
  const cache = new GlyphCache();
  let root = window.location.origin + window.location.pathname;
  if (root.endsWith("/")) {
    root= root.slice(0, root.length - 1);
  }
  const imageUrl = `${root}/glyphs2.png`;
  const xmlUrl = `${root}/glyphs2.xml`;
  cache._texture = Texture.fromUrl(imageUrl);
  cache._webFile = new WebFile(xmlUrl);
  cache._webFile.onStateChange = GlyphCache.prototype._glyphXmlReady.bind(cache);
  cache._webFile.send();

  return cache;
}();

export function useCustomGlyphs(batch: Text3dBatch) {
  batch._glyphCache = GLYPH_CACHE;
  batch.prepareBatch();
}

export function drawPlanets(renderContext: RenderContext, _opacity: number) {
  if (Planets._planetTextures == null) {
      Planets._loadPlanetTextures();
    }
    var elong = Planets._geocentricElongation(Planets._planetLocations[9].RA, Planets._planetLocations[9].dec, Planets._planetLocations[0].RA, Planets._planetLocations[0].dec);
    var raDif = Planets._planetLocations[9].RA - Planets._planetLocations[0].RA;
    if (Planets._planetLocations[9].RA < Planets._planetLocations[0].RA) {
      raDif += 24;
    }
    var phaseAngle = Planets._phaseAngle(elong, Planets._planetLocations[9].distance, Planets._planetLocations[0].distance);
    // var limbAngle = Planets._positionAngle(Planets._planetLocations[9].RA, Planets._planetLocations[9].dec, Planets._planetLocations[0].RA, Planets._planetLocations[0].dec);
    if (raDif < 12) {
      phaseAngle += 180;
    }
    var dista = (Math.abs(Planets._planetLocations[9].RA - Planets._planetLocations[0].RA) * 15) * Math.cos(Coordinates.degreesToRadians(Planets._planetLocations[0].dec));
    var distb = Math.abs(Planets._planetLocations[9].dec - Planets._planetLocations[0].dec);
    var sunMoonDist = Math.sqrt(dista * dista + distb * distb);
    var eclipse = false;
    var coronaOpacity = 0;
    var moonEffect = (Planets._planetScales[9] / 2 - sunMoonDist);
    // var darkLimb = Math.min(32, sunMoonDist * 32);

    // For this story, we only want to draw the Sun
    // which has planet ID 0
    Planets._drawPlanet(renderContext, 0);
    return true;
}

export function renderOneFrame(showHorizon=true,
                               showSky=true,
                               showPlanetLabels=true) {
  if (this.renderContext.get_backgroundImageset() != null) {
    this.renderType = this.renderContext.get_backgroundImageset().get_dataSetType();
  } else {
    this.renderType = 2;
  }

  var sizeChange = false;
  if (this.canvas.width !== this.canvas.parentNode.clientWidth) {
    this.canvas.width = this.canvas.parentNode.clientWidth;
    sizeChange = true;
  }
  if (this.canvas.height !== this.canvas.parentNode.clientHeight) {
    this.canvas.height = this.canvas.parentNode.clientHeight;
    sizeChange = true;
  }
  if (sizeChange && this.explorer != null) {
    this.explorer.refresh();
  }
  if (this.canvas.width < 1 || this.canvas.height < 1) {
    return;
  }
  if (sizeChange) {
    this._crossHairs = null;
  }
  Tile.lastDeepestLevel = Tile.deepestLevel;
  RenderTriangle.width = this.renderContext.width = this.canvas.width;
  RenderTriangle.height = this.renderContext.height = this.canvas.height;
  Tile.tilesInView = 0;
  Tile.tilesTouched = 0;
  Tile.deepestLevel = 0;
  SpaceTimeController.set_metaNow(new Date());
  if (this.get__mover() != null) {
    SpaceTimeController.set_now(this.get__mover().get_currentDateTime());
    Planets.updatePlanetLocations(this.get_solarSystemMode());
    if (this.get__mover() != null) {
      const newCam = this.get__mover().get_currentPosition();
      this.renderContext.targetCamera = newCam.copy();
      this.renderContext.viewCamera = newCam.copy();
      if (this.renderContext.space && Settings.get_active().get_galacticMode()) {
        const gPoint = Coordinates.j2000toGalactic(newCam.get_RA() * 15, newCam.get_dec());
        this.renderContext.targetAlt = this.renderContext.alt = gPoint[1];
        this.renderContext.targetAz = this.renderContext.az = gPoint[0];
      }
      else if (this.renderContext.space && Settings.get_active().get_localHorizonMode()) {
        const currentAltAz = Coordinates.equitorialToHorizon(Coordinates.fromRaDec(newCam.get_RA(), newCam.get_dec()), SpaceTimeController.get_location(), SpaceTimeController.get_now());
        this.renderContext.targetAlt = this.renderContext.alt = currentAltAz.get_alt();
        this.renderContext.targetAz = this.renderContext.az = currentAltAz.get_az();
      }
      if (this.get__mover().get_complete()) {
        WWTControl.scriptInterface._fireArrived(this.get__mover().get_currentPosition().get_RA(), this.get__mover().get_currentPosition().get_dec(), WWTControl.singleton.renderContext.viewCamera.zoom);
        this.set__mover(null);
        this._notifyMoveComplete();
      }
    }
  }
  else {
    SpaceTimeController.updateClock();
    Planets.updatePlanetLocations(this.get_solarSystemMode());
    this._updateViewParameters();
  }
  this.renderContext.clear();

  this.renderContext.setupMatricesSpace3d(this.renderContext.width, this.renderContext.height);
  this.renderContext.drawImageSet(this.renderContext.get_backgroundImageset(), 100);
  if (this.renderContext.get_foregroundImageset() != null) {
    if (this.renderContext.get_foregroundImageset().get_dataSetType() !== this.renderContext.get_backgroundImageset().get_dataSetType()) {
      this.renderContext.set_foregroundImageset(null);
    }
    else {
      if (this.renderContext.viewCamera.opacity !== 100 && this.renderContext.gl == null) {
        if (this._foregroundCanvas.width !== this.renderContext.width || this._foregroundCanvas.height !== this.renderContext.height) {
          this._foregroundCanvas.width = this.renderContext.width;
          this._foregroundCanvas.height = this.renderContext.height;
        }
        var saveDevice = this.renderContext.device;
        this._fgDevice.clearRect(0, 0, this.renderContext.width, this.renderContext.height);
        this.renderContext.device = this._fgDevice;
        this.renderContext.drawImageSet(this.renderContext.get_foregroundImageset(), 100);
        this.renderContext.device = saveDevice;
        this.renderContext.device.save();
        this.renderContext.device.globalAlpha = this.renderContext.viewCamera.opacity / 100;
        this.renderContext.device.drawImage(this._foregroundCanvas, 0, 0);
        this.renderContext.device.restore();
      }
      else {
        this.renderContext.drawImageSet(this.renderContext.get_foregroundImageset(), this.renderContext.viewCamera.opacity);
      }
    }
  }
  if (this.uiController != null) {
    this.uiController.render(this.renderContext);
  }
  else {
    if (showSky) {
      drawSky(this.renderContext, { opacity: 0.95, color: "#4190ED" });
    }
    Annotation.prepBatch(this.renderContext);
    for (const item of this._annotations) {
      item.draw(this.renderContext);
    }
    Annotation.drawBatch(this.renderContext);
    if ((Date.now() - this._lastMouseMove) > 400) {
      var raDecDown = this.getCoordinatesForScreenPoint(this._hoverTextPoint.x, this._hoverTextPoint.y);
      this._annotationHover(raDecDown.x, raDecDown.y, this._hoverTextPoint.x, this._hoverTextPoint.y);
      this._lastMouseMove = new Date(2100, 1, 1);
    }
    if (this._hoverText) {
      this._drawHoverText(this.renderContext);
    }
  }

  for (const imageset in this.renderContext.get_catalogHipsImagesets()) {
    if (imageset.get_hipsProperties().get_catalogSpreadSheetLayer().enabled && imageset.get_hipsProperties().get_catalogSpreadSheetLayer().lastVersion === imageset.get_hipsProperties().get_catalogSpreadSheetLayer().get_version()) {
      this.renderContext.drawImageSet(imageset, 100);
    }
  }
  this.constellation = Constellations.containment.findConstellationForPoint(this.renderContext.viewCamera.get_RA(), this.renderContext.viewCamera.get_dec());
  this._drawSkyOverlays();
  Planets.drawPlanets(this.renderContext, 1);

  if (showPlanetLabels) {
    this._planetTextOverlays = makeTextOverlays(this.renderContext);
    useCustomGlyphs(this._planetTextOverlays);
    this._planetTextOverlays.viewTransform = Grids._altAzTextBatch?.viewTransform;
    this._planetTextOverlays.draw(this.renderContext, 1, Color.fromArgb(255, 255, 255, 255));
  }

  if (showHorizon) {
    drawHorizon(this.renderContext, { opacity: 0.9, color: "#01362C" });
  }

  const worldSave = this.renderContext.get_world();
  const viewSave = this.renderContext.get_view();
  const projSave = this.renderContext.get_projection();
  if (Settings.get_current().get_showCrosshairs()) {
    this._drawCrosshairs(this.renderContext);
  }

  const tilesAllLoaded = !TileCache.get_queueCount();
  this.renderContext.setupMatricesOverlays();
  this._fadeFrame();
  this._frameCount++;
  TileCache.decimateQueue();
  TileCache.processQueue(this.renderContext);
  Tile.currentRenderGeneration++;
  if (!TourPlayer.get_playing()) {
    this.set_crossFadeFrame(false);
  }
  this.renderContext.set_world(worldSave);
  this.renderContext.set_view(viewSave);
  this.renderContext.set_projection(projSave);
  const now = Date.now();
  const ms = now - this._lastUpdate;
  if (ms > 1000) {
    this._lastUpdate = now;
    this._frameCount = 0;
    RenderTriangle.trianglesRendered = 0;
    RenderTriangle.trianglesCulled = 0;
  }
  if (this.capturingVideo) {
    if ((this.dumpFrameParams != null) && (!this.dumpFrameParams.waitDownload || tilesAllLoaded)) {
      this.captureFrameForVideo(this._videoBlobReady, this.dumpFrameParams.width, this.dumpFrameParams.height, this.dumpFrameParams.format);
      SpaceTimeController.nextFrame();
    }
    if (SpaceTimeController.get_doneDumping()) {
      SpaceTimeController.frameDumping = false;
      SpaceTimeController.cancelFrameDump = false;
      this.capturingVideo = false;
    }
  }
}

export function drawEcliptic(renderContext: RenderContext, opacity: number, drawColor: Color, drawCircle: boolean = true) {
    var col = drawColor;
    var year = SpaceTimeController.get_now().getUTCFullYear();
    if (Grids._eclipticOverviewLineList == null || year !== Grids._eclipticYear) {
        if (Grids._eclipticOverviewLineList != null) {
            Grids._eclipticOverviewLineList.clear();
            Grids._eclipticOverviewLineList = null;
        }
        Grids._eclipticYear = year;
        var obliquity = Coordinates.meanObliquityOfEcliptic(SpaceTimeController.get_jNow());
        var mat = Matrix3d._rotationX((-obliquity / 360 * (Math.PI * 2)));
        var daysPerYear = 365.25;
        if (DT.isLeap(year, true)) {
            Grids._monthDays[1] = 29;
            daysPerYear = 366;
        } else {
            Grids._monthDays[1] = 28;
            daysPerYear = 365;
        }
        var count = 2 * daysPerYear;
        Grids._eclipticCount = daysPerYear;
        var jYear = SpaceTimeController.utcToJulian(new Date(year, 0, 1, 12, 0, 0));
        var index = 0;
        var d = 0;
        var dPrev = 0;
        var dStart = 0;
        Grids._eclipticOverviewLineList = new SimpleLineList();
        Grids._eclipticOverviewLineList.set_depthBuffered(false);
        for (var m = 0; m < 12; m++) {
            var daysThisMonth = Grids._monthDays[m];
            for (var i = 0; i < daysThisMonth; i++) {
                var sunRaDec = Planets.getPlanetLocationJD('Sun', jYear);
                var sunEcliptic = CT.eq2Ec(sunRaDec.RA, sunRaDec.dec, obliquity);
                d = sunEcliptic.x;
                if (i == 0 && m == 0) {
                  dStart = d;
                }
                var width = 0.005;
                if (!i) {
                    width = 0.01;
                }
                var dd = d;
                Grids._eclipticOverviewLineList.addLine(Vector3d._transformCoordinate(Vector3d.create(Math.cos((dd * Math.PI * 2) / 360), width, Math.sin((dd * Math.PI * 2) / 360)), mat), Vector3d._transformCoordinate(Vector3d.create(Math.cos((dd * Math.PI * 2) / 360), -width, Math.sin((dd * Math.PI * 2) / 360)), mat));
                if (drawCircle && !(i == 0 && m == 0)) {
                  Grids._eclipticOverviewLineList.addLine(Vector3d._transformCoordinate(Vector3d.create(Math.cos((dd * Math.PI * 2) / 360), 0, Math.sin((dd * Math.PI * 2) / 360)), mat), Vector3d._transformCoordinate(Vector3d.create(Math.cos((dPrev * Math.PI * 2) / 360), 0, Math.sin((dPrev * Math.PI * 2) / 360)), mat));
                }
                index++;
                jYear += 1;
                dPrev = d;
            }
            d += Grids._monthDays[m];
        }
        if (drawCircle) {
          Grids._eclipticOverviewLineList.addLine(Vector3d._transformCoordinate(Vector3d.create(Math.cos((dStart * Math.PI * 2) / 360), 0, Math.sin((dStart * Math.PI * 2) / 360)), mat), Vector3d._transformCoordinate(Vector3d.create(Math.cos((dd * Math.PI * 2) / 360), 0, Math.sin((dd * Math.PI * 2) / 360)), mat));
        }
    }
    Grids._eclipticOverviewLineList.drawLines(renderContext, opacity, drawColor);
    return true;
};

export function drawSkyOverlays() {
    if (Settings.get_active().get_showConstellationPictures() && !this.freestandingMode) {
        Constellations.drawArtwork(this.renderContext);
    }
    if (Settings.get_active().get_showConstellationFigures()) {
        if (WWTControl.constellationsFigures == null) {
            WWTControl.constellationsFigures = Constellations.create(
                'Constellations',
                URLHelpers.singleton.engineAssetUrl('figures.txt'),
                false,  // "boundry"
                false,  // "noInterpollation"
                false,  // "resource"
            );
        }
        WWTControl.constellationsFigures.draw(this.renderContext, false, 'UMA', false);
    }
    if (Settings.get_active().get_showEclipticGrid()) {
        Grids.drawEclipticGrid(this.renderContext, 1, Settings.get_active().get_eclipticGridColor());
        if (Settings.get_active().get_showEclipticGridText()) {
            Grids.drawEclipticGridText(this.renderContext, 1, Settings.get_active().get_eclipticGridColor());
        }
    }
    if (Settings.get_active().get_showGalacticGrid()) {
        Grids.drawGalacticGrid(this.renderContext, 1, Settings.get_active().get_galacticGridColor());
        if (Settings.get_active().get_showGalacticGridText()) {
            Grids.drawGalacticGridText(this.renderContext, 1, Settings.get_active().get_galacticGridColor());
        }
    }
    if (Settings.get_active().get_showAltAzGrid()) {
        Grids.drawAltAzGrid(this.renderContext, 1, Settings.get_active().get_altAzGridColor());
    }
    if (Settings.get_active().get_showAltAzGridText()) {
        Grids.drawAltAzGridText(this.renderContext, 1, Settings.get_active().get_altAzGridColor());
    }
    drawNSEWText(this.renderContext, 1, Settings.get_active().get_altAzGridColor());
    if (Settings.get_active().get_showPrecessionChart()) {
        Grids.drawPrecessionChart(this.renderContext, 1, Settings.get_active().get_precessionChartColor());
    }
    if (Settings.get_active().get_showEcliptic()) {
        Grids.drawEcliptic(this.renderContext, 1, Settings.get_active().get_eclipticColor());
        if (Settings.get_active().get_showEclipticOverviewText()) {
            Grids.drawEclipticText(this.renderContext, 1, Settings.get_active().get_eclipticColor());
        }
    }
    if (Settings.get_active().get_showGrid()) {
        Grids.drawEquitorialGrid(this.renderContext, 1, Settings.get_active().get_equatorialGridColor());
        if (Settings.get_active().get_showEquatorialGridText()) {
            Grids.drawEquitorialGridText(this.renderContext, 1, Settings.get_active().get_equatorialGridColor());
        }
    }
    if (Settings.get_active().get_showConstellationBoundries()) {
        if (WWTControl.constellationsBoundries == null) {
            WWTControl.constellationsBoundries = Constellations.create(
                'Constellations',
                URLHelpers.singleton.engineAssetUrl('constellations.txt'),
                true,   // "boundry"
                false,  // "noInterpollation"
                false,  // "resource"
            );
        }
        WWTControl.constellationsBoundries.draw(this.renderContext, Settings.get_active().get_showConstellationSelection(), this.constellation, false);
    }
    if (Settings.get_active().get_showConstellationLabels()) {
        Constellations.drawConstellationNames(this.renderContext, 1, Colors.get_yellow());
    }
}
