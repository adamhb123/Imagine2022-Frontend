import React, { useRef, useState, useLayoutEffect, createRef } from "react";
import mapboxgl from "mapbox-gl";
import { DEVELOPER_MODE, MAPBOX_TOKEN } from "../../misc/config";
import MarkerManager from "../Markers";
import { hideParentOnClick } from "../../misc/utility";
import * as APIMiddleware from "../../misc/APIMiddleware";
import "../../../node_modules/mapbox-gl/dist/mapbox-gl.css";
import "./Map.scss";
import "../../glitchytext.scss";
import { useReactOidc } from "@axa-fr/react-oidc-context";
import { Beacon } from "../types";

const MARKER_UPDATE_INTERAL_MS = 10000;

const BEACON_TIMEOUT_MINS = 5;

const STARTING_COORDINATES = [43.08383425657111, -77.67397784602626];
const STARTING_PITCH = 45;
const STARTING_BEARING = -17.6;
const STARTING_ZOOM = 19;
const MIN_ZOOM = 17;
export const MAX_BOUNDS = new mapboxgl.LngLatBounds(
  new mapboxgl.LngLat(-77.687769, 43.078269),
  new mapboxgl.LngLat(-77.653682, 43.092718)
);
const BUILDING_FILL_COLOR = "#BC4A3C";
const BUILDING_FILL_OPACITY = 0.9;

const _setStatusIndicatorText = (element: HTMLElement, text: string) => {
  element.textContent = text;
  element.setAttribute("data-text", text);
};

mapboxgl.accessToken = MAPBOX_TOKEN as string;

class DeveloperModeDisplay {
  _map: mapboxgl.Map | undefined;
  _container: HTMLDivElement | undefined;
  _messagebox: HTMLDivElement | undefined;

  onAdd(map: mapboxgl.Map) {
    this._map = map;
    this._container = document.createElement("div");
    this._messagebox = document.createElement("div");
    this._messagebox.id = "developer-mode-display";
    this._container.classList.add("mapboxgl-ctrl", "mapboxgl-ctrl-group");
    _setStatusIndicatorText(this._messagebox, "Developer Mode");
    return this._container;
  }
  onRemove() {
    this._container?.parentNode?.removeChild(this._container);
    this._map = undefined;
  }
}
class AdminPanelToggler {
  _map: mapboxgl.Map | undefined;
  _container: HTMLDivElement | undefined;

  onAdd(map: mapboxgl.Map) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.classList.add("mapboxgl-ctrl", "mapboxgl-ctrl-group");
    let _adminPanel = document.getElementById("admin-panel");
    let _button = document.createElement("button");
    _button.id = "admin-panel-toggle";
    _button.textContent = "Admin Panel";
    if (_adminPanel)
      _button.addEventListener(
        "click",
        hideParentOnClick.bind(null, _adminPanel)
      );
    this._container.appendChild(_button);
    return this._container;
  }

  onRemove() {
    this._container?.parentNode?.removeChild(this._container);
    this._map = undefined;
  }
}
export const Map: React.FunctionComponent = () => {
  const mapContainer: React.RefObject<HTMLDivElement> = createRef();
  const map = useRef<mapboxgl.Map>();
  const markerManager = new MarkerManager(map);
  let _updateInterval: ReturnType<typeof setInterval>;
  const [_loadingMarkers, setLoadingMarkers] = useState(false);
  const _oidcUser = useReactOidc().oidcUser;
  const [_lat, setLat] = useState(STARTING_COORDINATES[0]);
  const [_long, setLng] = useState(STARTING_COORDINATES[1]);
  const [zoom, setZoom] = useState(STARTING_ZOOM);

  function _setupControls() {
    if (_oidcUser) {
      map.current?.addControl(new AdminPanelToggler(), "top-left");
      map.current?.addControl(new DeveloperModeDisplay(), "top-left");
    }
    map.current?.addControl(new mapboxgl.NavigationControl());
    map.current?.addControl(new mapboxgl.FullscreenControl());
  }

  function _setMarkerDisplayState(state: "Updating" | "Success" | "Failed") {
    const messageBox = document.getElementById("loading-markers-indicator");
    if (state === "Success") {
      if (messageBox) messageBox.style.visibility = "hidden";
      else _setMarkerDisplayState("Success");
      return;
    }
    if (messageBox) {
      messageBox.style.visibility = "visible";
      if (state === "Updating") {
        messageBox.classList.remove("failed");
        _setStatusIndicatorText(messageBox, "Updating markers...");
      } else if (state === "Failed") {
        messageBox.classList.add("failed");
        _setStatusIndicatorText(messageBox, "Marker Update Failed!");
        console.error("Marker update timed out...retrying");
      }
    }
  }

  async function _updateBeaconMarkers() {
    setLoadingMarkers(true);
    _setMarkerDisplayState("Updating");
    let beacons = await APIMiddleware.retrieveBeacons((error: any) => {
      _setMarkerDisplayState("Failed");
      console.error(error);
    }, true);
    // Exclude beacons older than specified BEACON_TIMEOUT_MS
    if (beacons) {
      if (!DEVELOPER_MODE) {
        let unexpiredBeacons: Beacon[] = [];
        beacons.forEach((beacon_obj: Beacon) => {
          const beacon_id = Object.keys(beacon_obj)[0];
          const esps = beacon_obj[beacon_id].esps;
          const unexpiredEspsKeys = Object.keys(esps).filter((espKey) => {
            return (
              Math.round(new Date().getTime() / 1000) - esps[espKey].timestamp <
              BEACON_TIMEOUT_MINS * 60
            );
          });
          // If any unexpired esps, add to unexpired beacons
          if (unexpiredEspsKeys.length > 0) {
            unexpiredBeacons.push(beacon_obj);
          }
        });
        beacons = unexpiredBeacons;
      }
      markerManager.updateHackerLocations(beacons);
      // Update map with any new markers in markerManager._geojson
      markerManager.updateMarkers();
      _setMarkerDisplayState("Success");
    } else {
      _setMarkerDisplayState("Failed");
    }
    setLoadingMarkers(false);
  }

  function _setupUpdateInterval() {
    return setInterval(() => {
      // (if not still loading)
      // Update markerManager._geojson with beacon locations
      // Start marker update timeout handler
      if (!_loadingMarkers) {
        _updateBeaconMarkers();
      }
    }, MARKER_UPDATE_INTERAL_MS);
  }

  function _cleanup() {
    map.current = undefined;
    clearInterval(_updateInterval);
  }

  useLayoutEffect(() => {
    if (map.current) return; // initialize map only once
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v11",
        antialias: true,
        center: [_long, _lat],
        zoom: zoom,
        minZoom: MIN_ZOOM,
        pitch: STARTING_PITCH,
        bearing: STARTING_BEARING,
        maxBounds: MAX_BOUNDS,
      });
      if (map.current) {
        map.current.on("load", () => {
          markerManager.initialize();
          APIMiddleware.initialize();
          // Insert the layer beneath any symbol layer.
          const layers = map.current?.getStyle().layers;
          const labelLayerId: string | undefined = layers?.find(
            (layer: any) => {
              let text_field: mapboxgl.Layout = layer.layout;
              return (
                layer.type === "symbol" && text_field?.hasOwnProperty("id")
              );
            }
          )?.id;
          // The 'building' layer in the Mapbox
          // vector tileset contains building height data
          // from OpenStreetMap.
          map.current?.addLayer(
            {
              id: "add-3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: MIN_ZOOM,
              paint: {
                "fill-extrusion-color": BUILDING_FILL_COLOR,
                // Use an 'interpolate' expression to
                // add a smooth transition effect to
                // the buildings as the user zooms in.
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  15.05,
                  ["get", "height"],
                ],
                "fill-extrusion-base": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  15.05,
                  ["get", "min_height"],
                ],
                "fill-extrusion-opacity": BUILDING_FILL_OPACITY,
              },
            },
            labelLayerId
          );
          // Put layers on top of layer-view hierarchy, update font-size
          layers
            ?.filter((layer: mapboxgl.AnyLayer) => layer.id.includes("label"))
            .forEach((layer: mapboxgl.AnyLayer) => {
              map.current?.moveLayer(layer.id);
              map.current?.setLayoutProperty(layer.id, "text-size", 16);
            });
          markerManager.updateMarkers();
          _setupControls();
          _updateInterval = _setupUpdateInterval();
          map.current?.resize();
          // Perform page-switch cleanup operations
          [].slice
            .call(document.getElementsByClassName("nav-link"))
            .forEach((navlink: HTMLAnchorElement) =>
              navlink.addEventListener("click", _cleanup)
            );
        });
      }
    }
  });

  useLayoutEffect(() => {
    map.current?.on("move", () => {
      if (typeof map.current !== "undefined") {
        setLng(+map.current.getCenter().lng.toFixed(4));
        setLat(+map.current.getCenter().lat.toFixed(4));
        setZoom(+map.current.getZoom().toFixed(2));
      }
    });
  });

  useLayoutEffect(() => {}, [_loadingMarkers]);

  return <div ref={mapContainer} className="map-container"></div>;
};

export default Map;
