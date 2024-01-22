init();

function init() {
  const $form = document.querySelector("form");

  // Prefill form from URL
  const data = urlToForm(new URL(window.location));
  for (const key in data) {
    const value = data[key];
    const $inputs = $form.querySelectorAll(`[name="${key}"]`);
    $inputs.forEach(($input) => {
      if ($input.type === "date") {
        $input.valueAsDate = new Date(value);
      } else {
        $input.value = value;
      }
    });
  }

  bindSubmit($form);
}

function bindSubmit($form) {
  $form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = formToData($form);

    // Disable after we have the data
    $form.querySelector("fieldset").disabled = true;

    fetch("/api/butler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => {
        // Update uid
        data.uid = res.uid;
        $form.querySelector("[name=uid]").value = data.uid;

        // Update URL
        const query = new URLSearchParams(data).toString();
        window.history.pushState({}, "", `?${query}`);

        // Show confirmation
        const $confirm = document.createElement("div");
        $confirm.className =
          "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative";
        $confirm.role = "alert";
        $confirm.innerHTML = `
          <div class="font-bold text-lg mb-1">Sent!</div>
          <p>The calendar invite contains a link for rescheduling at any time.</p>`;
        $form.replaceWith($confirm);
      })
      .catch(() => {
        const $confirm = document.createElement("div");
        $confirm.className =
          "bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative";
        $confirm.role = "alert";
        $confirm.innerHTML = `
          <div class="font-bold text-lg mb-1">Uh-oh.</div>
          <p>That didn't work as expected. Let Kai know about this.</p>`;
        $form.replaceWith($confirm);
      });
  });
}

function urlToForm(url) {
  const data = Object.fromEntries(url.searchParams.entries());

  // Deserialize UTC timestamp to local time
  const { date, time } = getLocalDateTime(data.ts);
  data.date = date;
  data.time = time;

  // Unpack guests, self
  if (data.guests && data.self) {
    data.guests = data.guests.split(",");
    const selfIndex = parseInt(data.self, 10);
    data.self = data.guests[selfIndex];
    data.guests.splice(selfIndex, 1);
    data.guests = data.guests.join(", ");
  }

  return data;
}

function formToData($form) {
  const entries = new FormData($form).entries();
  const data = Object.fromEntries(entries);

  // Normalize guests
  data.guests = data.guests.split(",").map((a) => a.trim());
  data.self = data.self.trim();
  data.guests.push(data.self);
  data.guests.sort();

  // Mark requester
  data.self = data.guests.indexOf(data.self);

  // Mark requester as RSVP'ed
  // 0: needs action, 1: declined, 2: maybe, 3: accepted
  data.rsvp = new Array(data.guests.length).fill(0);
  data.rsvp[data.self] = 3;

  // Serialize local time to UTC timestamp
  data.ts = new Date(`${data.date} ${data.time}`).getTime();
  delete data.date;
  delete data.time;

  // Parse numerical values
  data.interval = parseInt(data.interval, 10);

  return data;
}

function getLocalDateTime(ts) {
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
