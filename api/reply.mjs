import { IncomingForm } from "formidable";

export default async (req /* , ctx */) => {
  let field, files;
  try {
    const form = new IncomingForm();
    [field, files] = await form.parse(req);
  } catch (error) {
    console.error("Ignoring invalid request:", error);
    return new Response("🧞‍♂️");
  }

  console.log("Fields:", field);
  console.log("Files:", files);

  return new Response("ok");
};
