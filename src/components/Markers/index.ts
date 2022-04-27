import mapboxgl, { GeoJSONSource, Marker } from "mapbox-gl";
import { Position } from "geojson";
import {
  MutableMapRef,
  Beacon,
  MarkerFeature,
  MarkerFeatureCollection,
  MarkerFeatureIdentifier,
  MarkerGeojsonIdentifier,
  BeaconJSON,
  instanceOfMarkerFeatureQuery,
  MarkerFeatureQueryResult,
} from "../types";
import { v4 as uuidv4 } from "uuid";

import "../../../node_modules/mapbox-gl/dist/mapbox-gl.css";
import "./Markers.scss";

const BEACON_MARKER_DEFAULT_FILL_COLOR = "#00ff00";
const BEACON_MARKER_HIDDEN_FILL_COLOR = "#000000";
const BEACON_MARKER_DEFAULT_FILL_OPACITY = 0.6;
const BEACON_MARKER_HIDDEN_FILL_OPACITY = 0.5;

export const FIRESIDE_MARKER_FILL_COLOR = "#E11C52";
const FIRESIDE_MARKER_FILL_OPACITY = 0.75;
const FIRESIDE_CENTER_COORDINATES = [-77.6737632693158, 43.084147690138536];
const FIRESIDE_MARKER_HEIGHT = 100000;
const FIRESIDE_MARKER_RADIUS_KM = 0.0025;

const BEACON_MARKER_RADIUS_KM = 0.02;
const BEACON_MARKER_HEIGHT = 15;

const BEACON_GEN__COORD_RANDOMNESS_MAGNITUDE = 0.003;

class MarkerManager {
  _visible_marker_geojson: { type: "geojson"; data: MarkerFeatureCollection };
  _hidden_marker_geojson: { type: "geojson"; data: MarkerFeatureCollection };
  _map: MutableMapRef;
  updateRequired: Boolean;
  constructor(map: MutableMapRef) {
    this._visible_marker_geojson = {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    };
    this._hidden_marker_geojson = {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    };
    this._map = map;
    this.updateRequired = false; // True if marker was added and we haven't updated
  }

  static _random(magnitude: number) {
    return Math.random() < 0.5
      ? -magnitude * Math.random()
      : magnitude * Math.random();
  }

  static generateGeoJSONCircleCoordinates(
    center: Position,
    radiusInKm: number = BEACON_MARKER_RADIUS_KM,
    points: number = 64
  ): Position[] {
    const ret = [];
    const distanceX =
      radiusInKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
    const distanceY = radiusInKm / 110.574;

    let theta, x, y;
    for (let i = 0; i < points; i++) {
      theta = (i / points) * (2 * Math.PI);
      x = distanceX * Math.cos(theta);
      y = distanceY * Math.sin(theta);
      ret.push([center[0] + x, center[1] + y]);
    }
    // Complete polygon by pushing initial point
    ret.push(ret[0]);

    return ret;
  }

  static generateFakeBeaconLocationData(
    bounds: mapboxgl.LngLatBounds,
    sections: number,
    random: boolean = true
  ): BeaconJSON[] {
    // Lat y, long x
    const boundsObj = {
      n: bounds.getNorth(),
      e: bounds.getEast(),
      s: bounds.getSouth(),
      w: bounds.getWest(),
    };
    let dLat = (boundsObj.n - boundsObj.s) / sections;
    let dLong = (boundsObj.e - boundsObj.w) / sections;
    let values = [];
    for (let lat = boundsObj.s; lat <= boundsObj.n; lat += dLat) {
      for (let long = boundsObj.w; long <= boundsObj.e; long += dLong) {
        const value: BeaconJSON = {};
        const uuid = uuidv4();
        value[uuid] = {
          position: [-69, -69],
          absolute_position: [
            long +
              (random
                ? MarkerManager._random(BEACON_GEN__COORD_RANDOMNESS_MAGNITUDE)
                : 0),
            lat +
              (random
                ? MarkerManager._random(BEACON_GEN__COORD_RANDOMNESS_MAGNITUDE)
                : 0),
          ],
          esps: {},
          beacon_id: uuid,
        };
        values.push(value);
      }
    }
    return values;
  }

  initialize() {
    if (this._map.current) {
      // Setup visible beacons
      this._map.current.addSource(
        "visible-beacons",
        this._visible_marker_geojson
      );
      this._map.current.addLayer({
        id: "visible-beacons",
        type: "fill-extrusion",
        source: "visible-beacons",
        layout: {},
        paint: {
          "fill-extrusion-color": BEACON_MARKER_DEFAULT_FILL_COLOR,
          "fill-extrusion-height": 10,
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": BEACON_MARKER_DEFAULT_FILL_OPACITY,
        },
      });
      // Setup hidden beacons
      this._map.current.addSource(
        "hidden-beacons",
        this._hidden_marker_geojson
      );
      this._map.current.addLayer({
        id: "hidden-beacons",
        type: "fill-extrusion",
        source: "hidden-beacons",
        layout: {},
        paint: {
          "fill-extrusion-color": BEACON_MARKER_HIDDEN_FILL_COLOR,
          "fill-extrusion-height": BEACON_MARKER_HEIGHT,
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": BEACON_MARKER_HIDDEN_FILL_OPACITY,
        },
      });
      // Fireside Lounge marker
      this._map.current.addSource("fireside", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              MarkerManager.generateGeoJSONCircleCoordinates(
                FIRESIDE_CENTER_COORDINATES,
                FIRESIDE_MARKER_RADIUS_KM
              ),
            ],
          },
          properties: {
            center: FIRESIDE_CENTER_COORDINATES,
          },
        },
      });

      /*
      Base outline
      this._map.current?.addLayer({
        id: "outline",
        type: "line",
        source: "visible-beacons",
        layout: {},
        paint: {
          "line-color": BEACON_MARKER_OUTLINE_COLOR,
          "line-width": BEACON_MARKER_OUTLINE_WIDTH,
        },
      });*/
    }
  }

  queryFeature(
    targetFeature: MarkerFeatureIdentifier,
    markerGeojsonIdentifier?: MarkerGeojsonIdentifier
  ): MarkerFeatureQueryResult {
    let foundIn: MarkerGeojsonIdentifier | null = null;
    let parsedFeatures: MarkerFeature[] = [];
    if (typeof targetFeature !== "string") {
      if (targetFeature.properties.id) {
        targetFeature = targetFeature.properties.id.toString();
      } else
        throw ReferenceError(
          `Invalid value: "${targetFeature}" provided to argument: "targetFeature" of method: "queryFeature"`
        );
    }
    if (markerGeojsonIdentifier === MarkerGeojsonIdentifier.VisibleGeojson) {
      parsedFeatures = this._visible_marker_geojson.data?.features.filter(
        (feature: MarkerFeature) => feature.properties.id === targetFeature
      );
      foundIn = MarkerGeojsonIdentifier.VisibleGeojson;
    } else if (
      markerGeojsonIdentifier === MarkerGeojsonIdentifier.HiddenGeojson
    ) {
      parsedFeatures = this._hidden_marker_geojson.data?.features.filter(
        (feature: MarkerFeature) => feature.properties.id === targetFeature
      );
      foundIn = MarkerGeojsonIdentifier.HiddenGeojson;
    } else {
      console.log("queryFeature: entering ELSE");
      // If markerGeojsonIdentifier is not specified, we'll search all geojsons
      // Check visible first
      let visibleParsedFeatures = this._visible_marker_geojson.data?.features.filter(
        (feature: MarkerFeature) => feature.properties.id === targetFeature
      );
      if (visibleParsedFeatures.length)
        foundIn = MarkerGeojsonIdentifier.VisibleGeojson;
      // If nothing was found in visible, check hidden
      let hiddenParsedFeatures = this._hidden_marker_geojson.data?.features.filter(
        (feature: MarkerFeature) => feature.properties.id === targetFeature
      );
      if (!foundIn && hiddenParsedFeatures.length)
        foundIn = MarkerGeojsonIdentifier.HiddenGeojson;
      parsedFeatures = visibleParsedFeatures.concat(hiddenParsedFeatures);
    }
    if (foundIn !== null && parsedFeatures.length === 1) {
      return { feature: <MarkerFeature>parsedFeatures[0], foundIn: foundIn };
    }
    if (parsedFeatures.length > 1) {
      console.log("visibleGeo", this._visible_marker_geojson.data.features);
      console.log("hiddenGeo", this._hidden_marker_geojson.data.features);
      throw Error("(queryFeature) Too many parsedFeatures (length > 1)");
    }

    console.log(`queryFeature targetFeature: `, targetFeature);
    console.log(`queryFeature foundIn: `, foundIn);
    console.log(`queryFeature parsedFeatures: `, parsedFeatures);
    return null;
  }

  getGeojson(markerGeojsonIdentifier: MarkerGeojsonIdentifier) {
    return markerGeojsonIdentifier === MarkerGeojsonIdentifier.VisibleGeojson
      ? this._visible_marker_geojson
      : this._hidden_marker_geojson;
  }

  transferFeature(
    targetFeature: MarkerFeatureIdentifier,
    fromGeojsonIdentifier: MarkerGeojsonIdentifier,
    toGeojsonIdentifier: MarkerGeojsonIdentifier
  ) {
    let markerFeatureQuery = this.queryFeature(
      targetFeature,
      fromGeojsonIdentifier
    );
    toGeojsonIdentifier === MarkerGeojsonIdentifier.VisibleGeojson
      ? this._visible_marker_geojson
      : this._hidden_marker_geojson;

    if (instanceOfMarkerFeatureQuery(markerFeatureQuery)) {
      let test = this.removeMarker(targetFeature, fromGeojsonIdentifier);
      console.log(`TEST ${test}`);
      this.addMarker(
        markerFeatureQuery.feature.properties.id,
        markerFeatureQuery.feature.properties.center,
        toGeojsonIdentifier
      );
    }
  }

  setMarkerVisible(targetFeature: MarkerFeatureIdentifier, visible?: boolean) {
    let to;
    let from;
    if (typeof visible === "undefined") visible = true;
    to = visible
      ? MarkerGeojsonIdentifier.VisibleGeojson
      : MarkerGeojsonIdentifier.HiddenGeojson;
    from = visible
      ? MarkerGeojsonIdentifier.HiddenGeojson
      : MarkerGeojsonIdentifier.VisibleGeojson;
    this.transferFeature(targetFeature, from, to);
  }
  addMarker(
    id: string,
    center: Position,
    targetGeojsonIdentifier: MarkerGeojsonIdentifier,
    radiusInKm: number = BEACON_MARKER_RADIUS_KM
  ): MarkerFeature {
    const geojson =
      targetGeojsonIdentifier === MarkerGeojsonIdentifier.VisibleGeojson
        ? this._visible_marker_geojson
        : this._hidden_marker_geojson;
    // Do not add if duplicate exists
    if (
      !geojson.data.features
        .map((feature: MarkerFeature) => feature.properties.id)
        .includes(id)
    ) {
      let markerFeature: MarkerFeature = {
        id: id,
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [MarkerManager.generateGeoJSONCircleCoordinates(center)],
        },
        properties: {
          id: id,
          center: center,
          radius: radiusInKm,
        },
      };
      geojson.data.features.push(markerFeature);
      this.updateRequired = true;
      return markerFeature;
    } // Already exists: update if different center coordinates
    else {
      console.log("mfq id: ", id);
      let markerFeatureQuery = this.queryFeature(id);
      console.log("markerFeatureQuery: ", markerFeatureQuery);
      if (markerFeatureQuery) {
        if (instanceOfMarkerFeatureQuery(markerFeatureQuery)) {
          if (markerFeatureQuery.feature.properties.center !== center) {
            markerFeatureQuery.feature.geometry.coordinates = [
              MarkerManager.generateGeoJSONCircleCoordinates(
                center,
                radiusInKm
              ),
            ];
            markerFeatureQuery.feature.properties.center = center;
          }
          return markerFeatureQuery.feature;
        }
      } else {
        throw ReferenceError(
          "(addMarker) queryFeature returned null, but MarkerFeature was expected. Something has gone horribly wrong. The ship is burning. There is no food. You are alone."
        );
      }
    }
    throw ReferenceError(
      `(addMarker) Failed to addMarker given params (id: ${id}, center: ${center}, targetGeojsonIdentifier: ${targetGeojsonIdentifier}, radiusInKm: ${radiusInKm})`
    );
  }

  removeMarker(
    targetMarker: MarkerFeatureIdentifier,
    markerGeojsonIdentifier: MarkerGeojsonIdentifier
  ): boolean {
    let featureQuery: MarkerFeatureQueryResult;
    const geojson = this.getGeojson(markerGeojsonIdentifier);
    featureQuery = this.queryFeature(targetMarker);
    if (instanceOfMarkerFeatureQuery(featureQuery)) {
      geojson.data.features = geojson.data.features.filter(
        (feature: MarkerFeature) =>
          featureQuery?.feature.properties.id !== feature.properties.id
      );
      this.updateRequired = true;
      return true;
    }
    return false;
  }

  updateHackerLocations(beacons: Beacon[]) {
    beacons.forEach((beacon: Beacon) => {
      this.addMarker(
        beacon.id,
        [beacon.absolutePosition[0], beacon.absolutePosition[1]],
        MarkerGeojsonIdentifier.VisibleGeojson
      );
    });
  }

  updateMarkers() {
    if (this._map.current && this.updateRequired) {
      // <geojsonsource>
      (<GeoJSONSource>this._map.current.getSource("visible-beacons")).setData(
        this._visible_marker_geojson.data
      );
      (<GeoJSONSource>this._map.current.getSource("hidden-beacons")).setData(
        this._hidden_marker_geojson.data
      );
      this.updateRequired = false;
      // add markers to map
      //for (const feature of this._visible_marker_geojson.data.features) {
      /*if (
          !Array.prototype.slice
            .call(document.getElementsByClassName("marker"))
            .map((marker) => marker.id)
            .includes(feature.name)
        ) {
          // Add a new layer to visualize the polygon.
          // create an HTML element for each feature
          
          const div = document.createElement("div");
          div.className = "marker";
          div.id = feature.name;
          if (typeof feature.onClickCallback !== "undefined")
            div.addEventListener("click", feature.onClickCallback);
          new mapboxgl.Marker(div)
            .setLngLat(feature.geometry.coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
                `<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`
              )
            )
            .addTo(this._map.current);*/
    }
  }
}

export default MarkerManager;
