import React, { Component } from "react";
import {
  Switch,
  Route,
  Redirect,
  BrowserRouter as Router,
} from "react-router-dom";
import { Home, About } from "./index";
import PageContainer from "../containers/PageContainer";

export class App extends Component {
  render() {
    return (
      <Router>
        <PageContainer>
          <Switch>
            <Route path="/about" component={About} />
            <Redirect path="/contact" to="https://csh.rit.edu/" />
            <Route path="/" component={Home} />
            <Route render={() => <Redirect to="/" />} />
          </Switch>
        </PageContainer>
      </Router>
    );
  }
}

export default App;
