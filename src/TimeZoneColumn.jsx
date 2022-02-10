import { html } from "htm/preact";
import TimezoneSelect from "react-timezone-select";
import { nextHour } from "./util";

export function TimeZoneColumn(props) {
  const { zones, setZones, dates, setDates } = props;
  const addZoneRow = () => {
    setZones([...zones, zones[zones.length - 1]]);
  };
  const addDateColumn = () => {
    setDates([...dates, nextHour()]);
  };

  return html`
    <div class="Column ZoneColumn">
      <div class="Cell ControlCell">
        <button onClick=${addZoneRow}>Add Time Zone ↓</button>
        <button onClick=${addDateColumn}>Add Date →</button>
      </div>

      ${zones.map(
        (zone, index) => html`<${TimeZoneCell} index=${index} ...${props} />`
      )}
    </div>
  `;
}

const timeZoneSelectStyles = {
  container(provided) {
    return {
      ...provided,
      minWidth: 0,
      flexBasis: "100%",
    };
  },
};

function TimeZoneCell({ index, zones, setZones }) {
  const zone = zones[index];

  const setZone = (newZone) => {
    if (!newZone?.value) return;
    zones[index] = newZone.value;
    setZones([...zones]);
  };

  const removeZone = () => {
    zones.splice(index, 1);
    setZones([...zones]);
  };

  return html`
    <div class="Cell">
      <${TimezoneSelect}
        value=${zone}
        onChange=${setZone}
        styles=${timeZoneSelectStyles}
      />
      ${index === 0
        ? html`<span class="CloseButtonSpacer">×</span>`
        : html`<button class="CloseButton" onClick=${removeZone}>×</button>`}
    </div>
  `;
}
