import { useReactOidc } from "@axa-fr/react-oidc-context";
import React from "react";
import "./StatusIndicators.scss";
export const LoadingMarkersIndicator = () => (
  <>
    <p
      className="status-indicator hero glitch layers"
      id="loading-markers-indicator"
      data-text="Updating markers..."
    >
      Updating markers...
    </p>
  </>
);

export const UserTypeIndicator = () => {
  // Authenticated
  const { oidcUser } = useReactOidc();
  let userType = oidcUser ? "Admin" : "Participant";
  return (
    <p
      className="status-indicator hero glitch layers"
      id="user-type-indicator"
      data-text="Role: {userType}"
    >
      <b>Role:</b> {userType}
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
