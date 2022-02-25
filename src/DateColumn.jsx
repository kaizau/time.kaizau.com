import { html } from "htm/preact";
import { formatInTimeZone, zonedTimeToUtc } from "date-fns-tz";
import { google, ics } from "calendar-link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { DATETIME_FULL } from "./util";

export function DateColumn({
  index,
  dates,
  zones,
  title,
  titleInitial,
  setDates,
}) {
  const date = dates[index];

  const setDate = (newDate) => {
    if (!newDate) return;
    dates[index] = newDate;
    setDates([...dates]);
  };

  const removeDate = () => {
    dates.splice(index, 1);
    setDates([...dates]);
  };

  const calendarLink = (type) => {
    const event = {
      title: !title || title === titleInitial ? "Meeting" : title,
      start: zonedTimeToUtc(dates[index], zones[0]),
      duration: [1, "hour"],
    };

    if (type === "google") {
      window.open(google(event), "_blank");
    } else if (type === "ical") {
      const a = document.createElement("a");
      a.href = ics(event);
      a.target = "_blank";
      a.download = "event.ics";
      a.click();
    }
  };

  return html`
    <div class="Column DateColumn">
      <div class="Cell">
        <h2 class="heading">${index + 1}</h2>
        <button class="CloseButton" onClick=${removeDate}>×</button>
      </div>

      ${zones.map((zone, index) => {
        const localTime = parseInt(formatInTimeZone(date, zone, "H"), 10);
        const timeOfDay = 8 <= localTime && localTime <= 20 ? "day" : "night";

        if (index === 0) {
          const utcDate = zonedTimeToUtc(date, zone);
          return html`
            <div class="Cell ${timeOfDay}">
              <${DatePicker}
                showTimeSelect
                popperPlacement="top"
                dateFormat=${DATETIME_FULL}
                timeFormat="HH:mm"
                selected=${utcDate}
                onChange=${(d) => setDate(d)}
              />
            </div>
          `;
        } else {
          return html`
            <div class="Cell ${timeOfDay}">
              <div class="text">
                ${formatInTimeZone(date, zone, DATETIME_FULL)}
              </div>
            </div>
          `;
        }
      })}
      <div class="Cell DownloadCell">
        <button onClick=${() => calendarLink("google")}>Google</button>
        <button onClick=${() => calendarLink("ical")}>iCal</button>
      </div>
    </div>
  `;
}
