import formidable from "formidable";

export default async (req /* , ctx */) => {
  const form = formidable();
  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("Ignoring invalid request:", err);
      return new Response("🏖️");
    }

    console.log("Fields:", fields);
    console.log("Files:", files);

    // Process the attachments as needed
    // Each file in 'files' will have properties like 'filepath', 'originalFilename', 'mimetype', etc.

    return new Response("ok");
  });
};
