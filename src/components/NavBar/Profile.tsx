import { useReactOidc } from "@axa-fr/react-oidc-context";
import React from "react";
import {
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown,
} from "reactstrap";
import { DEVELOPER_MODE } from "../../misc/config";
import "./Profile.scss";

export const Profile: React.FunctionComponent = () => {
  const { oidcUser, login, logout } = useReactOidc();
  const name =
    oidcUser?.profile.preferred_username || DEVELOPER_MODE
      ? "Developer"
      : "Guest";
  const user_avatar_url = `https://profiles.csh.rit.edu/image/${
    oidcUser?.profile.preferred_username || "potate"
  }`;
  let profile_dropdown = oidcUser ? (
    <>
      <DropdownItem>Dashboard</DropdownItem>
      <DropdownItem>Settings</DropdownItem>
      <DropdownItem divider />
      <DropdownItem onClick={() => logout()}>Logout</DropdownItem>
    </>
  ) : (
    <>
      <DropdownItem onClick={() => login()}>Login</DropdownItem>
    </>
  );
  return (
    <UncontrolledDropdown nav inNavbar>
      <DropdownToggle nav caret className="navbar-user">
        <img
          id="user-avatar-image"
          className="rounded-circle"
          src={user_avatar_url}
          alt=""
          aria-hidden={true}
          width={32}
          height={32}
        />
        {name}
        <span className="caret" />
      </DropdownToggle>
      <DropdownMenu>{profile_dropdown}</DropdownMenu>
    </UncontrolledDropdown>
  );
};

export default Profile;
