import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { formatInTimeZone } from "date-fns-tz";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { DATETIME_FULL } from "./util";

export function DateColumn({ date: initialDate, index, localZone, zones }) {
  const [date, setDate] = useState(initialDate);

  return html`
    <div class="Column">
      <div class="Cell">${index + 1}</div>
      ${zones.map((zone, index) => {
        if (index === 0) {
          return html`
            <div class="Cell${localZone === zone ? " isLocal" : ""}">
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
            <div class="Cell${localZone === zone ? " isLocal" : ""}">
              ${formatInTimeZone(date, zone, DATETIME_FULL)}
            </div>
          `;
        }
      })}
      <div class="Cell"></div>
    </div>
  `;
}
