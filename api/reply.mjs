import { Readable } from "stream";
import { IncomingForm } from "formidable";

export default async (req /* , ctx */) => {
  // Convert to stream for formidable, since Netlify functions don't
  // seem to provide a standard IncomingMessage
  const stream = new Readable();
  stream.push(req.body);
  stream.push(null); // end of stream
  stream.headers = req.headers;

  const form = new IncomingForm();
  form.parse(stream, (err, fields, files) => {
    if (err) {
      console.error("Ignoring invalid request:", err.message);
      return new Response("🏖️");
    }

    console.log("Fields:", fields);
    console.log("Files:", files);

    // Process the attachments as needed
    // Each file in 'files' will have properties like 'filepath', 'originalFilename', 'mimetype', etc.

    return new Response("ok");
  });
};
