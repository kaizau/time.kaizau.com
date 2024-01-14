// This function is a thin wrapper on top of https://www.npmjs.com/package/ics.

const { v4: uuidv4 } = require("uuid");
const { RRule } = require("rrule");
const ics = require("ics");

const dayOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// eslint-disable-next-line no-unused-vars
exports.handler = async function (event, context) {
  // Use query params as starting point
  const qs = {};
  Object.keys(event.queryStringParameters).forEach((key) => {
    if (event.queryStringParameters[key]) {
      qs[key] = event.queryStringParameters[key];
    }
  });

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
  data.url = `http://localhost:8888/calendar?${searchParams.toString()}`;

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
    return {
      statusCode: 500,
      body: "Error creating iCal data",
    };
  }

  const headers = {
    "X-UID": data.uid,
    "X-Sequence": data.sequence,
    "Content-Type": "text/calendar",
    "Content-Disposition": `attachment; filename=${encodeURIComponent(
      "event.ics",
    )}`,
  };

  return {
    statusCode: 200,
    headers,
    body: value,
  };
};
