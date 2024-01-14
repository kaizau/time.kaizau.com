const searchParams = new URLSearchParams(window.location.search);
const qs = Object.fromEntries(searchParams.entries());

// Deserialize UTC timestamp to local time
const { date, time } = getDateTime(qs.ts);
qs.date = date;
qs.time = time;

const $form = document.querySelector("form");
prefill(qs);

$form.addEventListener("submit", (e) => {
  e.preventDefault();
  const entries = new FormData($form).entries();
  const data = Object.fromEntries(entries);

  // Serialize local time to UTC timestamp
  data.ts = new Date(`${data.date} ${data.time}`).getTime();
  delete data.date;
  delete data.time;

  const url = `/api/ical?${new URLSearchParams(data).toString()}`;

  fetch(url)
    .then((res) => {
      // Update uid and sequence
      data.uid = res.headers.get("X-UID");
      data.sequence = res.headers.get("X-Sequence");
      const query = new URLSearchParams(data).toString();
      window.history.pushState({}, "", `?${query}`);
      $form.querySelector("[name=uid]").value = data.uid;
      $form.querySelector("[name=sequence]").value = data.sequence;

      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const $a = document.createElement("a");
      $a.href = url;
      $a.download = "magic.ics";
      document.body.appendChild($a);
      $a.click();
      document.body.removeChild($a);
      URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.error(error);
    });
  // TODO Show confirmation
});

function prefill(obj) {
  for (const key in obj) {
    const value = obj[key];
    const $inputs = $form.querySelectorAll(`[name="${key}"]`);
    $inputs.forEach(($input) => {
      if ($input.type === "date") {
        $input.valueAsDate = new Date(value);
      } else {
        $input.value = value;
      }
    });
  }
}

function getDateTime(ts) {
  const date = ts ? new Date(parseInt(ts, 10)) : Date.now();

  let hours = new Date().getHours();
  hours = hours === 23 ? 0 : hours + 1;
  hours = `0${hours.toString()}`.slice(-2);
  const minutes = `0${date.getMinutes()}`.slice(-2);
  const time = `${hours}:${minutes}`;

  return { date, time };
}
