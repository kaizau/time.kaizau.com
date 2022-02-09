import { useState } from "preact/hooks";
import { html } from "htm/preact";
import { add, set } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export function App() {
  const [local] = useState(nextHour(new Date()));
  const [zones] = useState([
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    "America/Chicago",
  ]);
  const [dates] = useState([local]);
  const props = { local, zones, dates };

  return html`
    <${TimeZoneColumn} ...${props} />
    ${dates.map((date) => html` <${DateColumn} date=${date} ...${props} /> `)}
    <${DateInput} ...${props} />
  `;
}

function TimeZoneColumn({ zones }) {
  return html`
    <div class="Column">
      ${zones.map((zone) => html` <div class="Cell">${zone}</div> `)}
    </div>
    <!-- <div class="Cell"> -->
    <!--   <input name='addTimeZone' placeholder='Add Time Zone' /> -->
    <!-- </div> -->
  `;
}

function DateColumn({ zones, date }) {
  console.log(date);
  return html`
    <div class="Column">
      ${zones.map(
        (zone) => html`
          <div class="Cell">
            ${formatInTimeZone(date, zone, "MMM d, y HH:mm")}
          </div>
        `
      )}
    </div>
  `;
}

function DateInput({ local }) {
  const [date, setDate] = useState(local);

  return html`
    <div class="Column">
      <div class="Cell">
        <${DatePicker}
          showTimeSelect
          dateFormat="MMM d, y HH:mm"
          timeFormat="HH:mm"
          selected=${date}
          onChange=${(d) => setDate(d)}
        />
      </div>
    </div>
  `;
}

function nextHour(date) {
  return add(
    set(date, {
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    }),
    { hours: 1 }
  );
}
