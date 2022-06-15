// Global Modules
const axios = require("axios").default;
// Local Modules
import {
  API_ENDPOINTS,
  API_BACKEND_URL,
  DEVELOPER_MODE,
  API_BACKEND_TOKEN,
} from "./config";
import { buildPath } from "../misc/utility";
import Logger from "easylogger-ts";
import MarkerManager from "../components/Markers";
import { MAX_BOUNDS } from "../components/Map";
import { BeaconJSON } from "../components/types";

const FETCH_BEACON_DATA_TIMEOUT_MS = 7000;
const TEST_DATA_SECTION_COUNT = 2;

let visibleTestData: BeaconJSON[];
let hiddenTestData: BeaconJSON[];

function beaconJsonToArray(json: any): BeaconJSON[] {
  const _flipArray = <T>(input: [T, T]): [T, T] => [input[1], input[0]];
  let list: BeaconJSON[] = [];
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
  visibleTestData = MarkerManager.generateFakeBeaconLocationData(
    MAX_BOUNDS,
    TEST_DATA_SECTION_COUNT
  );
}

export async function retrieveBeacons(
  failureCallback?: Function,
  provideError: boolean = false
): Promise<BeaconJSON[] | void> {
  return DEVELOPER_MODE
    ? visibleTestData
    : await axios({
        method: "get",
        url: buildPath(API_BACKEND_URL, API_ENDPOINTS.BEACON_LOCATIONS),
        timeout: FETCH_BEACON_DATA_TIMEOUT_MS,
      })
        .then((response: any) => beaconJsonToArray(response.data))
        .catch((error: any) => {
          provideError
            ? failureCallback?.call(null, error)
            : failureCallback?.call(null);
        });
}

export async function transmitBeaconHidden(beacon_id: string, hidden: boolean) {
  if (!DEVELOPER_MODE) {
    return await axios({
      method: "post",
      url: buildPath(
        API_BACKEND_URL,
        hidden ? API_ENDPOINTS.HIDE_MARKER : API_ENDPOINTS.UNHIDE_MARKER
      ),
      headers: {
        Authorization: `Bearer ${API_BACKEND_TOKEN}`,
      },
      params: {
        id: beacon_id,
      },
    });
  } else {
    let targetBeaconJSON = visibleTestData.filter(
      (e: BeaconJSON) => beacon_id === e[Object.keys(e)[0]].beacon_id
    )[0]; // Should be guaranteed unique
    hiddenTestData.push(targetBeaconJSON);
    visibleTestData = visibleTestData.filter(
      (e: BeaconJSON) => beacon_id !== e[Object.keys(e)[0]].beacon_id
    ); // I haven't slept in 2 days...
  }
}

export default {
  initialize: initialize,
  retrieveBeacons: retrieveBeacons,
  transmitBeaconHidden: transmitBeaconHidden,
};

async function main() {
  let result = await retrieveBeacons();
  Logger.debug(result);
}

if (require.main === module) {
  main();
}
