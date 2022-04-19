import React, { useEffect } from "react";
import { Button } from "reactstrap";
import { hideParentOnClick } from "../../misc/utility";
import "./AdminPanel.scss";

export const AdminPanel: React.FunctionComponent = () => {
  useEffect(() => {
    let closeButton = document.getElementById("close-button");
    closeButton?.addEventListener("click", hideParentOnClick);
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
        <Button id="clear-all-markers">Hide All Markers</Button>
        <Button id="clear-all-markers">Unhide All Markers</Button>
      </div>
    </div>
  );
};

export default AdminPanel;
