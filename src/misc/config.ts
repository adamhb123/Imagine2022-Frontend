import { stringToPrimitive, PrimitiveTypeString } from "./utility";

const _parseEnvVar = (failureDefault: any, ...envVarNames: string[]) => {
  const desiredPrimitive = <PrimitiveTypeString>typeof failureDefault;
  for (const envVarName of envVarNames) {
    const envVar = process.env[envVarName];
    if (typeof envVar !== "undefined") {
      return stringToPrimitive(envVar, desiredPrimitive);
    }
  }
  return failureDefault;
};

// ..._OKD envvars used if run on OKD (can't edit .env on OKD)
export const DEVELOPER_MODE = _parseEnvVar(
  false,
  "REACT_APP_DEVELOPER_MODE_OKD",
  "REACT_APP_DEVELOPER_MODE"
);
export const MAPBOX_TOKEN = _parseEnvVar(
  "you-really-need-a-mapbox-token",
  "REACT_APP_MAPBOX_TOKEN_OKD",
  "REACT_APP_MAPBOX_TOKEN"
);

/*export const SITE_URL =
  .REACT_APP_SITE_URL_OKD ,
  .REACT_APP_SITE_URL ,
  "http://localhost:3000/";*/

export const API_BACKEND_URL = _parseEnvVar(
  "https://imagine-2022-backend-git-imagine2022-backend.apps.okd4.csh.rit.edu",
  "REACT_APP_API_BACKEND_URL_OKD",
  "REACT_APP_API_BACKEND_URL"
);

export const API_BEACON_LOCATIONS_URL = _parseEnvVar(
  "/beacons/locations",
  "REACT_APP_API_BEACON_LOCATIONS_URL_OKD",
  "REACT_APP_API_BEACON_LOCATIONS_URL"
);

// SSO
const _CLIENT_ID = _parseEnvVar(
  "react-boilerplate",
  "REACT_APP_SSO_CLIENT_ID_OKD",
  "REACT_APP_SSO_CLIENT_ID"
);
const _CLIENT_SECRET = _parseEnvVar(
  "",
  "REACT_APP_SSO_CLIENT_SECRET_OKD",
  "REACT_APP_SSO_CLIENT_SECRET"
);
const _POST_LOGOUT_REDIRECT_URI = _parseEnvVar(
  "http://localhost:3000/",
  "REACT_APP_SITE_URL_OKD",
  "REACT_APP_SITE_URL"
);
const _AUTHORITY = _parseEnvVar(
  "https://sso.csh.rit.edu/auth/realms/csh",
  "REACT_APP_SSO_AUTHORITY_OKD",
  "REACT_APP_SSO_AUTHORITY"
);

export const oidcConfiguration = {
  client_id: _CLIENT_ID,
  client_secret: _CLIENT_SECRET,
  redirect_uri: `${window.location.protocol}//${window.location.hostname}${
    window.location.port ? `:${window.location.port}` : ""
  }/authentication/callback`,
  response_type: "code",
  post_logout_redirect_uri: _POST_LOGOUT_REDIRECT_URI,
  scope: "openid profile email offline_access",
  authority: _AUTHORITY,
  silent_redirect_uri: `${window.location.protocol}//${
    window.location.hostname
  }${
    window.location.port ? `:${window.location.port}` : ""
  }/authentication/silent_callback`,
  automaticSilentRenew: true,
  loadUserInfo: true,
};
