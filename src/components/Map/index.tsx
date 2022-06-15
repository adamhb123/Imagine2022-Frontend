/* External Modules */
import React, { useRef, useState, useLayoutEffect, createRef } from "react";
import { useReactOidc } from "@axa-fr/react-oidc-context";
import mapboxgl from "mapbox-gl";
/* Local Modules */
import MarkerManager from "../Markers";
import APIMiddleware from "../../misc/APIMiddleware";
import Logger from "easylogger-ts";
import { DEVELOPER_MODE, MAPBOX_TOKEN } from "../../misc/config";
import { hideParentOnClick } from "../../misc/utility";
import { Beacon, MarkerDisplayState } from "../types";
/* External CSS */
import "../../../node_modules/mapbox-gl/dist/mapbox-gl.css";
/* Local CSS */
import "./Map.scss";
import "../../glitchytext.scss";

const MARKER_UPDATE_INTERVAL_MS = 10000;

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

// class DeveloperModeDisplay {
//   _map: mapboxgl.Map | undefined;
//   _container: HTMLDivElement | undefined;
//   _messagebox: HTMLDivElement | undefined;

//   onAdd(map: mapboxgl.Map) {
//     this._map = map;
//     this._container = document.createElement("div");
//     this._messagebox = document.createElement("div");
//     this._messagebox.id = "developer-mode-display";
//     this._container.classList.add(
//       "mapboxgl-ctrl",
//       "mapboxgl-ctrl-group",
//       "status-indicator"
//     );
//     _setStatusIndicatorText(this._messagebox, "Developer Mode");
//     return this._container;
//   }
//   onRemove() {
//     this._container?.parentNode?.removeChild(this._container);
//     this._map = undefined;
//   }
// }

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
  let currentUserCoordinates = { latitude: -1, longitude: -1 };
  const navigatorAvailable = "geolocation" in navigator ? true : false;
  const [_loadingMarkers, setLoadingMarkers] = useState(false);
  const _oidcUser = useReactOidc().oidcUser;
  const [_lat, setLat] = useState(STARTING_COORDINATES[0]);
  const [_long, setLng] = useState(STARTING_COORDINATES[1]);
  const [zoom, setZoom] = useState(STARTING_ZOOM);

  function _setupControls() {
    /*
     * Initializes mapboxgl controls (other controls are defined)
     */
    if (_oidcUser) {
      map.current?.addControl(new AdminPanelToggler(), "top-left");
    }
    map.current?.addControl(new mapboxgl.NavigationControl());
    map.current?.addControl(new mapboxgl.FullscreenControl());
  }

  function setMarkerDisplayState(state: MarkerDisplayState) {
    const messageBox = document.getElementById("loading-markers-indicator");
    if (messageBox) {
      // "Reset" display state
      messageBox.style.visibility = "visible";
      messageBox.classList.remove("failed", "warning");
      // Success state
      if (state === MarkerDisplayState.Success) {
        messageBox.style.visibility = "hidden";
      }
      // Updating state
      else if (state === MarkerDisplayState.Updating) {
        _setStatusIndicatorText(messageBox, "Updating markers...");
      }
      // Failed state
      else if (state === MarkerDisplayState.Failed) {
        messageBox.classList.add("failed");
        _setStatusIndicatorText(messageBox, "Marker Update Failed!");
        Logger.error("Marker update timed out...retrying");
      }
      // NoBeacons state
      else if (state === MarkerDisplayState.NoBeacons) {
        messageBox.classList.add("warning");
      }
    } else {
      // If the messageBox is unavailable, set to Updating state
      setMarkerDisplayState(MarkerDisplayState.Updating);
    }
  }

  async function _updateBeaconMarkers() {
    setLoadingMarkers(true);
    setMarkerDisplayState(MarkerDisplayState.Updating);
    let beaconJSONs = await APIMiddleware.retrieveBeacons((error: any) => {
      setMarkerDisplayState(MarkerDisplayState.Failed);
      Logger.error(error);
    }, true);
    let beacons: Beacon[];
    // Exclude beacons older than specified BEACON_TIMEOUT_MS
    if (beaconJSONs) {
      if (!DEVELOPER_MODE) {
        let unexpiredBeacons: Beacon[] = [];
        Beacon.fromJSONArray(beaconJSONs).forEach((beacon: Beacon) => {
          if (beacon.esps) {
            const unexpiredESPs = beacon.esps.filter(
              (esp) =>
                Math.round(new Date().getTime() / 1000) - esp.timestamp <
                BEACON_TIMEOUT_MINS * 60
            );
            // If any unexpired esps, add to unexpired beacons
            if (unexpiredESPs.length > 0) {
              unexpiredBeacons.push(beacon);
            }
          }
        });
        beacons = Beacon.fromJSONArray(beaconJSONs);
      } else {
        beacons = Beacon.fromJSONArray(
          MarkerManager.generateFakeBeaconLocationData(MAX_BOUNDS, 5)
        );
      }
      if (beacons.length) {
        markerManager.updateHackerLocations(beacons);
        // Update map with any new markers in markerManager._geojson
        markerManager.updateMarkers();
        setMarkerDisplayState(MarkerDisplayState.Success);
      } else {
        setMarkerDisplayState(MarkerDisplayState.NoBeacons);
      }
      setLoadingMarkers(false);
    }
  }

  function _setupMarkerUpdateInterval() {
    return setInterval(() => {
      // (if not still loading)
      // Update markerManager._geojson with beacon locations
      // Start marker update timeout handler
      if (!_loadingMarkers) {
        _updateBeaconMarkers();
      }
    }, MARKER_UPDATE_INTERVAL_MS);
  }

  function _cleanup() {
    map.current = undefined;
    clearInterval(_updateInterval);
  }

  function _startUserPositionWatch() {
    navigator.geolocation.watchPosition((position) => {
      currentUserCoordinates.latitude = position.coords.latitude;
      currentUserCoordinates.longitude = position.coords.longitude;
    });
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
          _updateInterval = _setupMarkerUpdateInterval();
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

  // Setup navigator GPS location
  useLayoutEffect(() => {});

  useLayoutEffect(() => {
    if (map.current) {
      if (navigatorAvailable) {
        _startUserPositionWatch();
      }
      map.current.on("click", "visible-beacons", (e) => {
        Logger.debug("visible");
        if (e.features) {
          const feature = e.features[0];
          //markerManager.setMarkerVisible(feature.properties?.id, false); No
          if (!DEVELOPER_MODE) {
            APIMiddleware.transmitBeaconHidden(
              feature.properties?.id,
              true
            ).catch((err) => {
              Logger.error(`Failed to hide beacon: ${feature.properties?.id}`);
              Logger.error(err);
            });
          }
        }
      });
      map.current.on("click", "hidden-beacons", (e) => {
        Logger.debug("hidden");
        if (e.features) {
          Logger.debug(e.features);
          const feature = e.features[0];
          Logger.debug(feature.properties?.id);
          if (!DEVELOPER_MODE) {
            APIMiddleware.transmitBeaconHidden(
              feature.properties?.id,
              false
            ).catch((err) => {
              Logger.error(
                `Failed to unhide beacon: ${feature.properties?.id}`
              );
              Logger.error(err);
            });
          }
        }
      });

      map.current.on("move", () => {
        if (typeof map.current !== "undefined") {
          setLng(+map.current.getCenter().lng.toFixed(4));
          setLat(+map.current.getCenter().lat.toFixed(4));
          setZoom(+map.current.getZoom().toFixed(2));
        }
      });
    }
  });

  //useLayoutEffect(() => {}, [_loadingMarkers]);

  return <div ref={mapContainer} className="map-container"></div>;
};

export default Map;
