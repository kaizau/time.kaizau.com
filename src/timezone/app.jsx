import { createPortal } from "preact/compat";
import { useEffect, useState } from "preact/hooks";
import { html } from "htm/preact";
import { add } from "date-fns";
import { nextHour, serialize, deserialize } from "./util";
import { TimeZoneColumn } from "./TimeZoneColumn.jsx";
import { DateColumn } from "./DateColumn.jsx";

const titleInitial = "Which times work for you?";

const headerEl = document.getElementById("Header");

function Header({ title, setTitle }) {
  const onInput = (e) => {
    setTitle(e.target.value);
  };
  return html`<input id="Title" value="${title}" onInput=${onInput} />`;
}

export function App() {
  const [zones, setZones] = useState([]);
  const [dates, setDates] = useState([]);
  const [title, setTitle] = useState(titleInitial);
  const props = {
    zones,
    setZones,
    dates,
    setDates,
    title,
    setTitle,
    titleInitial,
  };

  // Initial values from query string
  useEffect(() => {
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parsed = deserialize(window.location.search);
    let zones = parsed.zones.length
      ? parsed.zones
      : [
          "America/Los_Angeles",
          "America/New_York",
          "Europe/London",
          "Asia/Shanghai",
        ];

    if (!zones.includes(localZone)) {
      setZones([localZone, ...zones]);
    } else {
      setZones(zones);
    }

    if (!parsed.dates.length) {
      setDates([nextHour(), add(nextHour(), { days: 1 })]);
    } else {
      setDates(parsed.dates);
    }

    // TODO Sanitize?
    if (parsed.title) {
      setTitle(parsed.title);
    }
  }, []);

  // Update query string when state changes
  useEffect(() => {
    const data = {
      dates,
      zones,
      title: title === titleInitial ? "" : title,
    };
    const qs = serialize(data);
    window.history.replaceState({}, "", qs);
  }, [dates, zones, title]);

  return html`
    ${createPortal(html`<${Header} ...${props} />`, headerEl)}

    <${TimeZoneColumn} ...${props} />

    ${dates.map((date, index) => {
      return html`<${DateColumn} index=${index} ...${props} />`;
    })}
  `;
}
