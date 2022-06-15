import React, { useEffect, useState } from "react";
import { Button } from "reactstrap";
import {
  hideParentOnClick,
  getElementFromMouseEvent,
} from "../../misc/utility";
import { AdminPanelModificationMode } from "../types";
import "./AdminPanel.scss";

function onHideMarkersClicked(event: MouseEvent) {
  const hideMarkersButton = getElementFromMouseEvent(event, "hide-markers");
}

function onHideAllMarkersClicked(event: MouseEvent) {
  const hideAllMarkersButton = getElementFromMouseEvent(
    event,
    "hide-all-markers"
  );
}

function onUnhideMarkersClicked(event: MouseEvent) {
  const unhideMarkersButton = getElementFromMouseEvent(event, "unhide-markers");
}

function onUnhideAllMarkersClicked(event: MouseEvent) {
  const unhideAllMarkersButton = getElementFromMouseEvent(
    event,
    "unhide-all-markers"
  );
}

export const AdminPanel: React.FunctionComponent = () => {
  const [
    currentMode,
    setCurrentMode,
  ] = useState<AdminPanelModificationMode | null>(null);
  useEffect(() => {
    /* Setup button click events */
    // Close button
    const closeButton = document.getElementById("close-button");
    closeButton?.addEventListener("click", hideParentOnClick);
    // Hide Marker Mode
    const hideMarkersButton = document.getElementById("hide-markers");
    hideMarkersButton?.addEventListener("click", (event: MouseEvent) => {
      setCurrentMode(AdminPanelModificationMode.HideMarkers);
      onHideMarkersClicked(event);
    });
    // Hide All One-hit
    const hideAllMarkersButton = document.getElementById("hide-all-markers");
    hideAllMarkersButton?.addEventListener("click", (event: MouseEvent) => {
      setCurrentMode(AdminPanelModificationMode.HideAllMarkers);
      onHideAllMarkersClicked(event);
    });
    // Unhide Marker Mode
    const unhideMarkersButton = document.getElementById("unhide-markers");
    unhideMarkersButton?.addEventListener("click", (event: MouseEvent) => {
      setCurrentMode(AdminPanelModificationMode.UnhideMarkers);
      onUnhideMarkersClicked(event);
    });
    // Unhide All One-hit
    const unhideAllMarkersButton = document.getElementById(
      "unhide-all-markers"
    );
    unhideAllMarkersButton?.addEventListener("click", (event: MouseEvent) => {
      setCurrentMode(AdminPanelModificationMode.UnhideAllMarkers);
      onUnhideAllMarkersClicked(event);
    });
  });
  return (
    <div id="admin-panel" className="no-transition">
      <h1>Admin Panel</h1>
      <Button id="close-button">X</Button>
      <hr />
      <div id="mode-selection-menu">
        <Button id="unhide-markers">Unhide Markers</Button>
        <Button id="hide-markers">Hide Markers</Button>
      </div>
      <div id="one-hit-menu">
        <Button id="hide-all-markers">Hide All Markers</Button>
        <Button id="clear-all-markers">Unhide All Markers</Button>
      </div>
    </div>
  );
};

export default AdminPanel;
