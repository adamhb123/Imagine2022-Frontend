import React, { useEffect, useState } from "react";
import { Button } from "reactstrap";
import { hideParentOnClick } from "../../misc/utility";
import { AdminPanelModificationMode } from "../types";
import "./AdminPanel.scss";

function _elementClickedSafeguard(
  event: MouseEvent,
  fallbackId?: string
): HTMLElement {
  let element = event.target as HTMLElement | null;
  if (!element) {
    if (fallbackId)
      element = document.getElementById(fallbackId) as HTMLElement;
    else {
      throw new Error(
        `elementClickedSafeguard: couldn't find element with fallbackId: ${fallbackId}`
      );
    }
  }
  return element;
}

function onHideMarkersClicked(event: MouseEvent) {
  const hideMarkersButton = _elementClickedSafeguard(event, "hide-markers");
  
}

function onHideAllMarkersClicked(event: MouseEvent) {
  const hideAllMarkersButton = _elementClickedSafeguard(
    event,
    "hide-all-markers"
  );
}

function onUnhideMarkersClicked(event: MouseEvent) {
  const unhideMarkersButton = _elementClickedSafeguard(event, "unhide-markers");

}

function onUnhideAllMarkersClicked(event: MouseEvent) {
  const unhideAllMarkersButton = _elementClickedSafeguard(
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
    const closeButton = document.getElementById("close-button");
    const hideMarkersButton = document.getElementById("hide-markers");
    const unhideMarkersButton = document.getElementById("unhide-markers");
    const hideAllMarkersButton = document.getElementById("hide-all-markers");
    const unhideAllMarkersButton = document.getElementById(
      "unhide-all-markers"
    );
    closeButton?.addEventListener("click", hideParentOnClick);
    hideMarkersButton?.addEventListener("click", onHideMarkersClicked);
    hideAllMarkersButton?.addEventListener("click", onHideAllMarkersClicked);
    unhideMarkersButton?.addEventListener("click", onUnhideMarkersClicked);
    unhideMarkersButton?.addEventListener("click", onUnhideAllMarkersClicked);
    unhideMarkersButton?.addEventListener("click", () => {
      onUnhideMarkersClicked(unhideMarkersButton as HTMLButtonElement);
    });
    hideAllMarkersButton?.addEventListener("click", () => {
      setCurrentMode(AdminPanelModificationMode.HideAllMarkers);
      onUnhideMarkersClicked(unhideMarkersButton as HTMLButtonElement);
    });
    unhideAllMarkersButton?.addEventListener("click", () => {
      setCurrentMode(AdminPanelModificationMode.UnhideAllMarkers);
      onUnhideMarkersClicked(unhideMarkersButton as HTMLButtonElement);
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
