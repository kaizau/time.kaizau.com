import { html } from "htm/preact";

export function TimeZoneColumn({ localZone, zones, addZoneRow }) {
  return html`
    <div class="Column">
      <div class="Cell"></div>
      ${zones.map((zone) => {
        return html`<div class="Cell${localZone === zone ? " isLocal" : ""}">
          ${zone}
        </div>`;
      })}
      <div class="Cell">
        <button onClick=${addZoneRow}>+</button>
      </div>
    </div>
  `;
}
