import { Readable } from "stream";
import busboy from "busboy";
import ical from "node-ical";

export default async (req /* , ctx */) => {
  if (
    req.method === "POST" &&
    req.headers.get("content-type").includes("multipart/form-data")
  ) {
    const [fields, files] = await parseForm(req);
    console.log("Fields:", fields);
    console.log("Files:", files);

    const events = files.filter((file) => file.filename.endsWith(".ics"));
    if (fields?.envelope?.from && events.length) {
      let selectedICS;
      try {
        for (const event of events) {
          const icsData = ical.sync.parseICS(event.content.toString());
          console.log("ics", icsData);
          if (icsData?.organizer?.email === "serendipity@m.kaizau.com") {
            selectedICS = icsData;
            break;
          }
        }
      } catch (error) {
        console.error("Error processing ICS file:", error);
      }

      if (selectedICS && selectedICS.attendees) {
        const forwardTo = selectedICS.attendees.filter(
          (attendee) => attendee.email !== envelope.from,
        );
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
