// This function is a thin wrapper on top of https://www.npmjs.com/package/ics.
// All config options are exposed as query params.
const ics = require("ics");

const supported = [
  "title",
  "start",
  "duration",
  "description",
  "recurrenceRule",
  "uid",
  "sequence",
];

// eslint-disable-next-line no-unused-vars
exports.handler = async function (event, context) {
  // Use query params as starting point
  const data = {};
  Object.keys(event.queryStringParameters).forEach((key) => {
    if (supported.includes(key)) {
      data[key] = event.queryStringParameters[key];
    }
  });

  if (!data.title || !data.start || !data.duration) {
    return {
      statusCode: 400,
      body: "Missing required parameters",
    };
  }

  //
  // Assign values
  //

  // Parses many date formats into compatible array, but ultimately persisted as
  // 2020,12,30,23,59,0
  data.start = data.start.split(/[^\d]+/).map((str) => parseInt(str, 10));

  // Cache state into URL
  const url = "http://localhost:8888/api/ical?";
  const searchParams = new URLSearchParams(data);
  data.url = url + searchParams.toString();

  //
  // Create iCal file
  //

  data.productId = "kz-time";

  // Expects exactly two values with plural unit, ex: 1,hours
  const [durationVal, durationUnit] = data.duration.split(",");
  data.duration = { [durationUnit]: parseInt(durationVal, 10) };

  const { error, value } = ics.createEvent(data);
  if (error) {
    return {
      statusCode: 500,
      body: "Error creating iCal data",
    };
  }

  const headers = {
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
