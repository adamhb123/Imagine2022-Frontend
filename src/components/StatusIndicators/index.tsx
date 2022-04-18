import React from "react";
export const LoadingMarkersIndicator = () => (
  <p className="hero glitch layers" id="info-message-box">
    Updating markers...
  </p>
);

export const UserTypeIndicator = (
  userType: "Guest" | "Member" | "Admin Member"
) => (
  <p className="hero glitch layers" id="user-type-indicator">
    {userType}
  </p>
);
