// This function is a thin wrapper on top of https://www.npmjs.com/package/ics.

import { v4 as uuidv4 } from "uuid";
import rrule from "rrule";
import ics from "ics";

// RRule is actually CJS, so throws warnings if not imported as default
const { RRule } = rrule;
const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// eslint-disable-next-line no-unused-vars
export default async (req, ctx) => {
  const url = new URL(req.url);
  const qs = Object.fromEntries(url.searchParams.entries());

  if (!qs.title || !qs.ts || !qs.interval || !qs.email) {
    return {
      statusCode: 400,
      body: "Missing required parameters",
    };
  }

  const data = {};
  data.uid = qs.uid || uuidv4();
  data.sequence = qs.sequence ? parseInt(qs.sequence, 10) + 1 : 1;

  // Cache state into URL
  qs.uid = data.uid;
  qs.sequence = data.sequence;
  const searchParams = new URLSearchParams(qs);
  data.url = `${url.origin}/calendar?${searchParams.toString()}`;

  //
  // Format iCal values
  //

  data.productId = "time.kaizau.com";
  data.organizer = { name: "Kai Zau", email: "calendar@kaizau.com" };
  data.attendees = [{ name: qs.email, email: qs.email }];

  data.title = qs.title;

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

  //
  // Create iCal file
  //

  const { error, value } = ics.createEvent(data);
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return new Response("Error creating iCal data", { status: 500 });
  }

  const headers = {
    "X-UID": data.uid,
    "X-Sequence": data.sequence,
    "Content-Type": "text/calendar",
    "Content-Disposition": `attachment; filename=${encodeURIComponent(
      "event.ics",
    )}`,
  };
  return new Response(value, { headers });
};
