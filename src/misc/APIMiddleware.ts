const axios = require("axios").default;
import {
  API_BACKEND_URL,
  API_BEACON_LOCATIONS_URL,
  DEVELOPER_MODE,
} from "./config";
import { buildPath } from "../misc/utility";
import MarkerManager from "../components/Markers";
import { MAX_BOUNDS } from "../components/Map";
import { Beacon } from "../components/types";

const FETCH_BEACON_DATA_TIMEOUT_MS = 7000;

const TEST_DATA_SECTION_COUNT = 10;
let testData: Beacon[];

function _flipArray<T>(input: [T, T]): [T, T] {
  return [input[1], input[0]];
}

function _beaconJsonToList(json: any): Beacon[] {
  let list: Beacon[] = [];
  Object.keys(json).forEach((key) => {
    const obj: any = {};
    json[key].absolute_position = _flipArray(json[key].absolute_position);
    json[key].position = _flipArray(json[key].position);
    obj[key] = json[key];
    list.push(obj);
  });
  return list;
}

export function initialize() {
  testData = MarkerManager.generateFakeBeaconLocationData(
    MAX_BOUNDS,
    TEST_DATA_SECTION_COUNT
  );
}

export async function retrieveBeacons(
  failureCallback?: Function,
  provideError: boolean = false
): Promise<Beacon[] | void> {
  return DEVELOPER_MODE
    ? testData
    : await axios({
        method: "get",
        url: buildPath(API_BACKEND_URL, API_BEACON_LOCATIONS_URL),
        timeout: FETCH_BEACON_DATA_TIMEOUT_MS,
      })
        .then((response: any) => _beaconJsonToList(response.data))
        .catch((error: any) => {
          provideError
            ? failureCallback?.call(null, error)
            : failureCallback?.call(null);
          return;
        });
}

async function main() {
  let result = await retrieveBeacons();
}

if (require.main === module) {
  main();
}
