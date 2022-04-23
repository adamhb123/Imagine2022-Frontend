import React from "react";
import "./About.scss";

export const About: React.FunctionComponent = () => (
  <div id="about-page-container">
    <h1>About</h1>
    <hr className="header-underline" />
    <p>
      CSH has been hacked and we need your help to track down the hackers! They
      broke into our server room in the Nathaniel Rochester dorm hall, stole
      many of our servers, and encrypted our data. In their haste, they also
      grabbed some of our Bluetooth location trackers! We need your help to
      track them down using our mapping system, working through system outages
      and completing side quests to help us get our systems back up and running!
    </p>
  </div>
);

export default About;
