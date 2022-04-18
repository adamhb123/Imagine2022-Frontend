import React from "react";
import { useReactOidc } from "@axa-fr/react-oidc-context";
import Map from "../../components/Map";
import StatusIndicators from "../../components/StatusIndicators";
import AdminPanel from "../../components/AdminPanel";
export const Home: React.FunctionComponent = () => {
  const { oidcUser } = useReactOidc();
  return (
    <>
      {oidcUser ? <AdminPanel></AdminPanel> : null}
      <StatusIndicators></StatusIndicators>
      <Map></Map>
    </>
  );
};

export default Home;
