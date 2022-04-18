import { useReactOidc } from "@axa-fr/react-oidc-context";
import React from "react";
import "./StatusIndicators.scss";
export const LoadingMarkersIndicator = () => (
  <p
    className="status-indicator hero glitch layers"
    id="loading-markers-indicator"
  >
    Updating markers...
  </p>
);

export const UserTypeIndicator = () => {
  // Authenticated
  const { oidcUser } = useReactOidc();
  return (
    <p className="status-indicator hero glitch layers" id="user-type-indicator">
      <b>Role:</b> {oidcUser ? "Admin" : "Participant"}
    </p>
  );
};

export const StatusIndicators = () => (
  <div id="status-indicator-container">
    <LoadingMarkersIndicator></LoadingMarkersIndicator>
    <UserTypeIndicator></UserTypeIndicator>
  </div>
);

export default StatusIndicators;
