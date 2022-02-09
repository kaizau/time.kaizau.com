import { useEffect, useState } from "preact/hooks";
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
  const props = { localZone, zones, setZones, dates, setDates };

  useEffect(() => {
    console.log(dates, zones);
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
        <button onClick=${addDateColumn}>+</button>
      </div>
    </div>
  `;
}
