import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { formatInTimeZone } from "date-fns-tz";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { DATETIME_FULL } from "./util";

export function DateColumn({ index, localZone, dates, zones, setDates }) {
  const date = dates[index];

  const setDate = (d) => {
    if (!d) return;
    dates[index] = d;
    setDates([...dates]);
  };

  const removeDate = () => {
    dates.splice(index, 1);
    setDates([...dates]);
  };

  return html`
    <div class="Column lighter">
      <div class="Cell hasClose">
        <h2 class="heading">${index + 1}</h2>
        <button class="CloseButton" onClick=${removeDate}>×</button>
      </div>

      ${zones.map((zone, index) => {
        const isLocal = localZone === zone ? " isLocal" : "";
        if (index === 0) {
          return html`
            <div class="Cell${isLocal}">
              <${DatePicker}
                showTimeSelect
                popperPlacement="top"
                dateFormat=${DATETIME_FULL}
                timeFormat="HH:mm"
                selected=${date}
                onChange=${(d) => setDate(d)}
              />
            </div>
          `;
        } else {
          return html`
            <div class="Cell${isLocal}">
              <div class="padded">
                ${formatInTimeZone(date, zone, DATETIME_FULL)}
              </div>
            </div>
          `;
        }
      })}
    </div>
  `;
}
