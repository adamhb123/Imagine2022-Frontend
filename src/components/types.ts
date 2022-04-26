import mapboxgl from "mapbox-gl";
import { Position } from "geojson";
import {
  FeatureCollection,
  Feature,
  Polygon,
  GeoJsonProperties,
} from "geojson";
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

export interface BeaconJSON {
  [key: string]: {
    position: [number, number];
    absolute_position: [number, number];
    esps: {
      [id: string]: {
        timestamp: number;
        rssi: number;
        esp_position: [number, number];
        esp_position_normal: [number, number];
        distance: number;
      };
    };
    beacon_id: string;
  };
}

export class Beacon {
  id: string;
  absolutePosition: [number, number];
  feature?: MarkerFeature;
  radius?: number;
  constructor(
    id: string,
    absolutePosition: [number, number],
    radius?: number,
    feature?: MarkerFeature
  ) {
    this.id = id;
    this.absolutePosition = absolutePosition;
    this.radius = radius;
    this.feature = feature;
  }
  static parseBeaconJSON(beaconJSON: BeaconJSON): Beacon {
    const _k = Object.keys(beaconJSON)[0];
    return new Beacon(
      beaconJSON[_k].beacon_id,
      beaconJSON[_k].absolute_position
    );
  }
  static parseBeaconJSONArray(beaconJSONs: BeaconJSON[]): Beacon[] {
    const beaconArray: Beacon[] = [];
    for (const json of beaconJSONs) {
      let beacon = Beacon.parseBeaconJSON(json);
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
