import { Readable } from "stream";
import formidable from "formidable";

export default async (req /* , ctx */) => {
  // Convert to stream for formidable, since Netlify functions don't
  // seem to provide a standard IncomingMessage
  const stream = new Readable();
  stream.push(req.body);
  stream.push(null); // end of stream

  const form = formidable();
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
