// This function is a thin wrapper on top of https://www.npmjs.com/package/ics.
//
// Given url params, it:
// - Creates an iCal event with a self-editing link
// - Sends the event to attendees by email
// - Provides the event as a download

// TODO
// - What happens when user replies from own calendar? Does Apple / Google send its own iCal to the organizer and all attendees?
// - Maybe automatically increment sequence based on time? Would prevent need to track this in URL messy.

import { v4 as uuidv4 } from "uuid";
import rrule from "rrule";
import ics from "ics";
import Mailjet from "node-mailjet";

const { RRule } = rrule; // Workaround rrule CJS export

const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY,
  apiSecret: process.env.MAILJET_API_SECRET,
});

// eslint-disable-next-line no-unused-vars
export default async (req, ctx) => {
  const url = new URL(req.url);
  const qs = Object.fromEntries(url.searchParams.entries());

  if (!qs.title || !qs.ts || !qs.interval || !qs.email) {
    return Response("Missing required parameters", { status: 400 });
  }

  const data = createEventData(url, qs);

  const { error, value: file } = ics.createEvent(data);
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return new Response("Error creating iCal data", { status: 500 });
  }

  await sendEmail({ email: qs.email, method: data.method, file });

  const headers = {
    "X-UID": data.uid,
    "X-Sequence": data.sequence,
    "Content-Type": "text/calendar",
    "Content-Disposition": `attachment; filename=${encodeURIComponent(
      "magic.ics",
    )}`,
  };
  return new Response(file, { headers });
};

function createEventData(url, qs) {
  const data = {};
  data.uid = qs.uid || uuidv4();
  data.sequence = qs.sequence ? parseInt(qs.sequence, 10) + 1 : 1;
  data.method = data.sequence > 1 ? "REQUEST" : "PUBLISH";

  // Cache essential state into URL
  const next = {
    uid: data.uid,
    sequence: data.sequence,
    title: qs.title,
    ts: qs.ts,
    interval: qs.interval,
    email: qs.email,
  };
  data.url = `${url.origin}/calendar?${new URLSearchParams(next).toString()}`;

  // Format iCal values
  data.productId = "time.kaizau.com";
  data.organizer = { name: "Kai Zau", email: "calendar@kaizau.com" };
  data.attendees = [
    {
      name: qs.email,
      email: qs.email,
      partstat: "ACCEPTED",
    },
  ];
  data.title = qs.title;

  // Parse start, duration, repeat
  data.startInputType = "utc";
  const date = new Date(parseInt(qs.ts, 10));
  data.start = date
    .toISOString()
    .split(".")[0]
    .split(/[^\d]+/)
    .map((str) => parseInt(str, 10));
  data.duration = { hours: 1 };
  const rule = new RRule({
    freq: RRule.WEEKLY,
    interval: parseInt(qs.interval, 10),
    byweekday: RRule[dayOfWeek[date.getDay()]],
  });
  data.recurrenceRule = rule.toString().slice(6); // Remove "RRULE:"

  return data;
}

function sendEmail({ email, method, file }) {
  const encoded = Buffer.from(file).toString("base64");

  return mailjet
    .post("send", { version: "v3.1" })
    .request({
      Messages: [
        {
          From: { Email: "magic@mail.kaizau.com", Name: "Calendar Magic" },
          To: [{ Email: email, Name: email }],
          Subject: "🗓️🧞‍♂️ Magical calendar invite!",
          TextPart: "Behold! A magic calendar invite!",
          HTMLPart: "<h1>Behold!</h1><p>A magic calendar invite!</p>",
          Attachments: [
            {
              ContentType: `text/calendar; method=${method}`,
              Filename: "magic.ics",
              Base64Content: encoded,
            },
          ],
        },
      ],
    })
    .then(() => console.log(`Email sent to ${email}`))
    .catch((error) => console.error(error));
}