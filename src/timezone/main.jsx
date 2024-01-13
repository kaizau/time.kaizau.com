import { render } from "preact";
import { html } from "htm/preact";
import { App } from "./app.jsx";

render(html`<${App} />`, document.getElementById("App"));
