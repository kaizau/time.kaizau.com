import { Readable } from "stream";
import busboy from "busboy";
import ical from "node-ical";

export default async (req /* , ctx */) => {
  if (
    req.method === "POST" &&
    req.headers.get("content-type").includes("multipart/form-data")
  ) {
    const [fields, files] = await parseForm(req);

    let envelope;
    try {
      envelope = JSON.parse(fields.envelope);
    } catch (error) {
      console.error("Error parsing email envelope:", error);
    }
    const events = files.filter((file) => file.filename.endsWith(".ics"));

    if (envelope.from && events.length) {
      let selectedICS;
      try {
        for (const event of events) {
          const icsData = ical.sync.parseICS(event.content.toString());
          const icsEvent = Object.values(icsData)[0];
          if (icsEvent?.organizer?.val === "MAILTO:serendipity@m.kaizau.com") {
            selectedICS = icsEvent;
            break;
          }
        }
      } catch (error) {
        console.error("Error processing ICS file:", error);
      }

      if (selectedICS && selectedICS.attendee) {
        const forwardTo = selectedICS.attendee
          .filter((attendee) => attendee.params.EMAIL !== envelope.from)
          .map((attendee) => attendee.params.EMAIL);
        console.log("fw to", forwardTo);
      }
    }
  }

  return new Response("🧞‍♂️");
};

async function parseForm(req) {
  const fields = {};
  const files = [];
  const headers = Object.fromEntries(req.headers.entries());
  const bb = busboy({ headers });

  bb.on("field", (key, val) => {
    fields[key] = val;
  });

  bb.on("file", (name, file, info) => {
    let content = Buffer.from("");
    file
      .on("data", (data) => {
        content = Buffer.concat([content, data]);
      })
      .on("end", () => {
        files.push({ ...info, content });
      });
  });

  const finished = new Promise((resolve, reject) => {
    bb.on("finish", () => resolve([fields, files]));
    bb.on("error", (error) => reject(error));
  });

  const stream = await convertToNodeStream(req.body);
  stream.pipe(bb);
  return await finished;
}

async function convertToNodeStream(webStream) {
  const nodeStream = new Readable({
    read() {},
  });
  for await (const chunk of webStream) {
    nodeStream.push(Buffer.from(chunk));
  }
  nodeStream.push(null);
  return nodeStream;
}
