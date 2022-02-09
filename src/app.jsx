import { useEffect, useState } from "preact/hooks";
import { html } from "htm/preact";
import { add } from "date-fns";
import { nextHour, serialize, deserialize } from "./util";
import { TimeZoneColumn } from "./TimeZoneColumn.jsx";
import { DateColumn } from "./DateColumn.jsx";

export function App() {
  const [localZone, setLocalZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [zones, setZones] = useState([]);
  const [dates, setDates] = useState([]);
  const props = { localZone, zones, setZones, dates, setDates };

  // Initial values from query string
  useEffect(() => {
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
  }, []);

  // Update query string when state changes
  useEffect(() => {
    const qs = serialize(dates, zones);
    window.history.replaceState({}, "", qs);
  }, [dates, zones]);

  return html`
    <${TimeZoneColumn} ...${props} />

    ${dates.map((date, index) => {
      return html`<${DateColumn} index=${index} ...${props} />`;
    })}
  `;
}
