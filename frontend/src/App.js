import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import CreateCall from "./host.jsx";
import JoinCall from "./join.jsx";

export default function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/join">join</Link>
            </li>
            <li>
              <Link to="/host">host</Link>
            </li>
          </ul>
        </nav>

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/host">
            <CreateCall />
          </Route>
          <Route path="/join">
            <JoinCall />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}