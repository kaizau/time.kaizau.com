import { useState } from "preact/hooks";
import { html } from "htm/preact";
import TimezoneSelect from "react-timezone-select";

export function TimeZoneColumn({ localZone, zones, setZones }) {
  const addZoneRow = () => {
    setZones([...zones, zones[zones.length - 1]]);
  };

  return html`
    <div class="Column wide">
      <div class="Cell"></div>

      ${zones.map((zone, index) => {
        return html`<${TimeZoneCell}
          isLocal=${localZone === zone}
          zones=${zones}
          index=${index}
          setZones=${setZones}
        />`;
      })}

      <div class="Cell">
        <button class="AddButton" onClick=${addZoneRow}>+</button>
      </div>
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

  return html`
    <div class="Cell${isLocal ? " isLocal" : ""}">
      <${TimezoneSelect} value=${zone} onChange=${setZone} />
    </div>
  `;
}
