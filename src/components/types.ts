import mapboxgl from "mapbox-gl";
import { Position } from "geojson";
import {
  FeatureCollection,
  Feature,
  Polygon,
  GeoJsonProperties,
} from "geojson";
import { time } from "console";
export type MutableMapRef = React.MutableRefObject<mapboxgl.Map | undefined>;

export enum MarkerGeojsonIdentifier {
  VisibleGeojson,
  HiddenGeojson,
}

export interface MarkerFeature extends Feature<Polygon, GeoJsonProperties> {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: Position[][];
  };
  properties: {
    id: string;
    center: Position;
    radius: number;
  };
}

export type MarkerFeatureIdentifier = MarkerFeature | string;

export interface MarkerFeatureCollection
  extends FeatureCollection<Polygon, GeoJsonProperties> {
  features: Array<MarkerFeature>;
}

export interface MarkerFeatureQuery {
  feature: MarkerFeature;
  foundIn: MarkerGeojsonIdentifier | MarkerGeojsonIdentifier[];
}

export function instanceOfMarkerFeatureQuery(
  object: any
): object is MarkerFeatureQuery {
  if (!object) return false;
  return "feature" in object && "foundIn" in object;
}

export type MarkerFeatureQueryResult = MarkerFeatureQuery | null;

export enum MarkerDisplayState {
  Success,
  Updating,
  NoBeacons,
  Failed,
}

export enum AdminPanelModificationMode {
  HideMarkers,
  UnhideMarkers,
  HideAllMarkers,
  UnhideAllMarkers,
}

export interface BeaconJSON {
  [key: string]: {
    position: [number, number];
    absolute_position: [number, number];
    esps: EspJSON;
    beacon_id: string;
  };
}

export interface EspJSON {
  [id: string]: {
    timestamp: number;
    rssi: number;
    esp_position: [number, number];
    esp_position_normal: [number, number];
    distance: number;
  };
}

export class Esp {
  id: string;
  timestamp: number;
  rssi: number;
  position: [number, number];
  positionNormal: [number, number];
  distance: number;
  constructor(
    id: string,
    timestamp: number,
    rssi: number,
    position: [number, number],
    positionNormal: [number, number],
    distance: number
  ) {
    this.id = id;
    this.timestamp = timestamp;
    this.rssi = rssi;
    this.position = position;
    this.positionNormal = positionNormal;
    this.distance = distance;
  }
  static fromJSON(espJSON: EspJSON): Esp {
    const id = Object.keys(espJSON)[0];
    const esp = espJSON[id];
    return new Esp(
      id,
      esp.timestamp,
      esp.rssi,
      esp.esp_position,
      esp.esp_position_normal,
      esp.distance
    );
  }
  static fromJSONArray(espJSONs: EspJSON[]): Esp[] {
    const esps: Esp[] = [];
    espJSONs.forEach((espJSON: EspJSON) => {
      esps.push(Esp.fromJSON(espJSON));
    });
    return esps;
  }
}

export class Beacon {
  id: string;
  absolutePosition: [number, number];
  esps?: Esp[];
  feature?: MarkerFeature;
  radius?: number;
  constructor(
    id: string,
    absolutePosition: [number, number],
    esps?: Esp[],
    radius?: number,
    feature?: MarkerFeature
  ) {
    this.id = id;
    this.absolutePosition = absolutePosition;
    this.esps = esps;
    this.radius = radius;
    this.feature = feature;
  }
  static fromJSON(beaconJSON: BeaconJSON): Beacon {
    const _k = Object.keys(beaconJSON)[0];
    const parsedEsps: Esp[] = [];
    // parse esps
    for (const key of Object.keys(beaconJSON[_k].esps)) {
      let espJSON: EspJSON = {};
      espJSON[key] = beaconJSON[_k].esps[key];
      parsedEsps.push(Esp.fromJSON(espJSON));
    }
    return new Beacon(
      beaconJSON[_k].beacon_id,
      beaconJSON[_k].absolute_position,
      parsedEsps
    );
  }
  static fromJSONArray(beaconJSONs: BeaconJSON[]): Beacon[] {
    const beaconArray: Beacon[] = [];
    for (const json of beaconJSONs) {
      let beacon = Beacon.fromJSON(json);
      beaconArray.push(beacon);
    }
    return beaconArray;
  }
}

/* export interface PolygonCollectionObject extends FeatureCollection {
  type: "FeatureCollection";
  crs: { type: "name"; properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } };
  features: PolygonObject[];
}*/
