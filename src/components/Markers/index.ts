import mapboxgl, { GeoJSONSource } from "mapbox-gl";
import { Position } from "geojson";
import { MutableMapRef, Beacon, PolygonalFeatureCollection } from "../types";
import { v4 as uuidv4 } from "uuid";

import "../../../node_modules/mapbox-gl/dist/mapbox-gl.css";
import "./Markers.scss";

const BEACON_MARKER_FILL_COLOR = "#00ff00";
const BEACON_MARKER_FILL_OPACITY = 0.6;

const BEACON_MARKER_RADIUS_KM = 0.01;

const BEACON_GEN_RANDOMNESS_MAGNITUDE = 0.003;

class MarkerManager {
  _geojson: { type: "geojson"; data: PolygonalFeatureCollection };
  _map: MutableMapRef;
  updateRequired: Boolean;
  constructor(map: MutableMapRef) {
    this._geojson = {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    };
    this._map = map;
    this.updateRequired = false; // True if marker was added and we haven't updated
  }
  static generateFakeBeaconLocationData(
    bounds: mapboxgl.LngLatBounds,
    sections: number,
    random: boolean = true
  ): Beacon[] {
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
        let value: Beacon = {};
        let uuid = uuidv4();
        value[uuid] = {
          position: [-69, -69],
          absolute_position: [
            long + MarkerManager._random(BEACON_GEN_RANDOMNESS_MAGNITUDE),
            lat + MarkerManager._random(BEACON_GEN_RANDOMNESS_MAGNITUDE),
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
      this._map.current.addSource("beacons", this._geojson);
      this._map.current.addLayer({
        id: "beacons",
        type: "fill-extrusion",
        source: "beacons", // reference the data source
        layout: {},
        paint: {
          // Get the `fill-extrusion-color` from the source `color` property.
          "fill-extrusion-color": BEACON_MARKER_FILL_COLOR,
          // Get `fill-extrusion-height` from the source `height` property.
          "fill-extrusion-height": 10,
          // Get `fill-extrusion-base` from the source `base_height` property.
          "fill-extrusion-base": 0,
          // Make extrusions slightly opaque to see through indoor walls.
          "fill-extrusion-opacity": BEACON_MARKER_FILL_OPACITY,
        },
      });
      /*this._map.current?.addLayer({
        id: "outline",
        type: "line",
        source: "beacons",
        layout: {},
        paint: {
          "line-color": BEACON_MARKER_OUTLINE_COLOR,
          "line-width": BEACON_MARKER_OUTLINE_WIDTH,
        },
      });*/
    }
  }

  static _random(magnitude: number) {
    return Math.random() < 0.5
      ? -magnitude * Math.random()
      : magnitude * Math.random();
  }

  _generateGeoJSONCircleCoordinates(
    radiusInKm: number,
    center: Position,
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

  /*_parseCoordinatesForJSON(
    coordinates: Coordinates | CoordinatesArray | mapboxgl.LngLat
  ): [number, number] | number[][] {
    /*
     * Parses the given coordinates for use in the _geojson.
     * For some reason it takes longitude first rather than
     * latitude (which is corroborated by the mapboxgl.LngLat
     * class). I have no idea why (likely because longitude is
     * associated with the X axis and latitude the Y).
     
    if (coordinates instanceof mapboxgl.LngLat) {
      // Coordinates
      return [coordinates.lng, coordinates.lat];
    } else if (coordinates.hasOwnProperty("latitude")) {
      return [
        (<Coordinates>coordinates).longitude,
        (<Coordinates>coordinates).latitude,
      ];
    } else {
      // CoordinatesArray
      let parsedCoordinates = [];
      for (const coordinate of <CoordinatesArray>coordinates) {
        parsedCoordinates.push([coordinate.longitude, coordinate.latitude]);
      }
      return parsedCoordinates;
    }
  }*/

  getMarkersFromJson() {
    return this._geojson.data?.features;
  }

  addMarker(name: string, center: Position) {
    // Add brand-spanking new markers
    if (
      !this._geojson.data.features
        .map((feature: any) => feature.name)
        .includes(name)
    ) {
      this._geojson.data.features.push({
        name: name,
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            this._generateGeoJSONCircleCoordinates(
              BEACON_MARKER_RADIUS_KM,
              center
            ),
          ],
        },
        properties: {
          center: center,
        },
      });
      this.updateRequired = true;
    } // Already exists: update if different coordinates
    else {
      let filteredFeature = this._geojson.data.features.filter(
        (feature) => feature.id === name && feature.properties.center !== center
      );
      if (filteredFeature.length) {
        // Use forEach "just in case", though filteredFeature should only have
        // one element in reality.
        filteredFeature.forEach((feature) => {
          feature.geometry.coordinates = [
            this._generateGeoJSONCircleCoordinates(
              BEACON_MARKER_RADIUS_KM,
              center
            ),
          ];
        });
      }
      this.updateRequired = true;
    }
  }

  removeMarker(coordinates: Position[][]) {
    this._geojson.data.features.filter((feature: any) => {
      feature.geometry.coordinates !== coordinates;
    });
    this.updateRequired = true;
  }

  updateHackerLocations(beacons: Beacon[]) {
    beacons.forEach((beacon_obj: Beacon) => {
      const beacon_id = Object.keys(beacon_obj)[0];
      this.addMarker(beacon_id, [
        beacon_obj[beacon_id].absolute_position[0],
        beacon_obj[beacon_id].absolute_position[1],
      ]);
    });
  }

  updateMarkers() {
    if (this._map.current && this.updateRequired) {
      // <geojsonsource>
      (<GeoJSONSource>this._map.current.getSource("beacons")).setData(
        this._geojson.data
      );
      this.updateRequired = false;
      // add markers to map
      //for (const feature of this._geojson.data.features) {
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
