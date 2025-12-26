import './index.css';
import React from "react";
import { render } from "react-dom";
import { App } from "./App";
import { AppModalProvider } from "./contexts/AppModalContext";
render(<AppModalProvider><App /></AppModalProvider>, document.getElementById("root"));
