import { useReactOidc } from "@axa-fr/react-oidc-context";
import React from "react";
import "./StatusIndicators.scss";
export const LoadingMarkersIndicator = () => (
  <p
    className="status-indicator hero glitch layers"
    id="loading-markers-indicator"
    data-text="Updating markers..."
  >
    Updating markers...
  </p>
);

export const UserTypeIndicator = () => {
  // Authenticated
  const { oidcUser } = useReactOidc();
  let userType = oidcUser ? "Admin" : "Participant";
  return (
    <p
      className="status-indicator hero glitch layers"
      id="user-type-indicator"
      data-text="Role: {userType}" // Leaving {userType} in looks cooler with the glitch, and IS intentional
    >
      <b>Role:</b> {userType}
    </p>
  );
};

export const ColorSwatch = (props: { children: string; id: string }) => (
  <div className="swatch-container">
    <p>{props.children}</p>
    <span id={props.id} className="swatch-colorbox"></span>
  </div>
);

export const LegendInformationIndicator = () => (
  <div id="legend-indicator-container" className="status-indicator">
    <p id="legend-indicator-header">Legend:</p>
    <hr className="header-underline" />

    <div className="swatch-container">
      <p>CSH Booth</p>
      <span id="csh-booth" className="swatch-colorbox"></span>
    </div>
  </div>
);
export const StatusIndicators = () => (
  <div id="status-indicator-container">
    <LoadingMarkersIndicator></LoadingMarkersIndicator>
    <UserTypeIndicator></UserTypeIndicator>
  </div>
);

export default StatusIndicators;
