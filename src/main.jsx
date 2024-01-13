import { render } from "preact";
import { html } from "htm/preact";
import { App } from "./app.jsx";

render(html`<${App} />`, document.getElementById("App"));

fetch(
  "/api/ical?title=My%20Meeting&start=2022-01-01T10:00:00&duration=1,hours&description=My%20description",
)
  .then((res) => res.text())
  .then(console.log);
