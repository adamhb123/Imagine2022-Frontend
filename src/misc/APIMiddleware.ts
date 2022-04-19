const axios = require("axios").default;
import {
  API_ENDPOINTS,
  API_BACKEND_URL,
  DEVELOPER_MODE,
  API_BACKEND_TOKEN,
} from "./config";
import { buildPath } from "../misc/utility";
import MarkerManager from "../components/Markers";
import { MAX_BOUNDS } from "../components/Map";
import { Beacon } from "../components/types";

const FETCH_BEACON_DATA_TIMEOUT_MS = 7000;

const TEST_DATA_SECTION_COUNT = 10;
let testData: Beacon[];

const _flipArray = <T>(input: [T, T]): [T, T] => [input[1], input[0]];

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
        url: buildPath(API_BACKEND_URL, API_ENDPOINTS.BEACON_LOCATIONS),
        timeout: FETCH_BEACON_DATA_TIMEOUT_MS,
      })
        .then((response: any) => _beaconJsonToList(response.data))
        .catch((error: any) => {
          provideError
            ? failureCallback?.call(null, error)
            : failureCallback?.call(null);
        });
}

export async function setBeaconHidden(id: string, hidden: boolean) {
  return await axios({
    method: "post",
    url: buildPath(
      API_BACKEND_URL,
      hidden ? API_ENDPOINTS.HIDE_MARKER : API_ENDPOINTS.UNHIDE_MARKER
    ),
    headers: {
      token: API_BACKEND_TOKEN,
    },
    data: {
      id: id,
    },
  });
}

async function main() {
  let result = await retrieveBeacons();
  console.log(result);
}

if (require.main === module) {
  main();
}
