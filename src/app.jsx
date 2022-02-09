import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { nextHour } from "./util";
import { TimeZoneColumn } from "./TimeZoneColumn";
import { DateColumn } from "./DateColumn";

export function App() {
  const [localZone, setLocalZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [zones, setZones] = useState([
    localZone,
    "America/Chicago",
    "America/New_York",
  ]);
  const [dates, setDates] = useState([nextHour()]);
  const props = { localZone, zones, dates };

  const addDateColumn = () => setDates([...dates, nextHour()]);
  const addZoneRow = () => {
    setZones([...zones, zones[zones.length - 1]]);
  };

  return html`
    <${TimeZoneColumn} ...${props} />

    ${dates.map(
      (date, index) =>
        html`<${DateColumn}
          date=${date}
          index=${index}
          key=${index}
          ...${props}
        />`
    )}
    <div class="Column">
      <div class="Cell"></div>
      <div class="Cell">
        <button onClick=${addDateColumn}>+</button>
      </div>
    </div>
  `;
}
