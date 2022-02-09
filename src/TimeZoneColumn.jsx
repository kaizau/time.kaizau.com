import { useState } from "preact/hooks";
import { html } from "htm/preact";
import TimezoneSelect from "react-timezone-select";
import { nextHour } from "./util";

export function TimeZoneColumn({
  localZone,
  zones,
  setZones,
  dates,
  setDates,
}) {
  const addZoneRow = () => {
    setZones([...zones, zones[zones.length - 1]]);
  };
  const addDateColumn = () => {
    setDates([...dates, nextHour()]);
  };

  return html`
    <div class="Column first">
      <div class="Cell ControlCell">
        <button onClick=${addZoneRow}>Add Time Zone</button>
        <button onClick=${addDateColumn}>Add Date</button>
      </div>

      ${zones.map((zone, index) => {
        return html`<${TimeZoneCell}
          isLocal=${localZone === zone}
          zones=${zones}
          index=${index}
          setZones=${setZones}
        />`;
      })}
    </div>
  `;
}

function TimeZoneCell({ isLocal, zones, index, setZones }) {
  const zone = zones[index];

  const setZone = (z) => {
    if (!z?.value) return;
    zones[index] = z.value;
    setZones([...zones]);
  };

  const removeZone = () => {
    zones.splice(index, 1);
    setZones([...zones]);
  };

  return html`
    <div class="Cell hasClose${isLocal ? " isLocal" : ""}">
      <${TimezoneSelect} value=${zone} onChange=${setZone} />
      <button class="CloseButton" onClick=${removeZone}>×</button>
    </div>
  `;
}
