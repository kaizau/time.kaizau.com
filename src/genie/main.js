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

  const url = `/api/genie?${new URLSearchParams(data).toString()}`;

  fetch(url)
    .then((res) => res.json())
    .then((res) => {
      // Update uid and sequence
      data.uid = res.uid;
      data.sequence = res.sequence;
      const query = new URLSearchParams(data).toString();
      window.history.pushState({}, "", `?${query}`);
      $form.querySelector("[name=uid]").value = data.uid;
      $form.querySelector("[name=sequence]").value = data.sequence;
      // TODO Show confirmation
    })
    .catch((error) => {
      console.error(error);
    });
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
  let date;
  if (ts) {
    date = new Date(parseInt(ts, 10));
  } else {
    date = new Date();
    date.setHours(date.getHours() + 1, 0, 0, 0);
  }

  const hours = `0${date.getHours()}`.slice(-2);
  const minutes = `0${date.getMinutes()}`.slice(-2);
  const time = `${hours}:${minutes}`;

  return { date, time };
}
