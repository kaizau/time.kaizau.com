import { render } from "preact";
import { html } from "htm/preact";
import { App } from "./app.jsx";
import "./index.css";

render(html`<${App} />`, document.getElementById("App"));
