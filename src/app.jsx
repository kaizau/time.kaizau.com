import { useEffect, useState } from "preact/hooks";
import { html } from "htm/preact";
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
    if (!parsed.zones.length) {
      setZones([localZone]);
    } else {
      setZones(parsed.zones);
    }
    if (!parsed.dates.length) {
      setDates([nextHour()]);
    } else {
      setDates(parsed.dates);
    }
  }, []);

  // Update query string when state changes
  useEffect(() => {
    const qs = serialize(dates, zones);
    window.history.replaceState({}, "", qs);
  }, [dates, zones]);

  const addDateColumn = () => setDates([...dates, nextHour()]);

  return html`
    <${TimeZoneColumn} ...${props} />

    ${dates.map(
      (_, index) =>
        html`<${DateColumn} index=${index} key=${index} ...${props} />`
    )}

    <div class="Column">
      <div class="Cell"></div>
      <div class="Cell">
        <button class="AddButton" onClick=${addDateColumn}>+</button>
      </div>
    </div>
  `;
}
