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

  // Assign values
  data.productId = "kz-time";

  data.start = data.start.split(/[^\d]+/).map((str) => parseInt(str, 10));

  const [durationVal, durationUnit] = data.duration.split(",");
  data.duration = { [durationUnit]: parseInt(durationVal, 10) };

  // Bump sequence if provided
  if (data.sequence) data.sequence = parseInt(data.sequence, 10) + 1;

  // Create iCal file
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
