import busboy from "busboy";

export default async (req /* , ctx */) => {
  const fields = {};
  const files = [];

  const bb = busboy({ headers: req.headers });

  bb.on("field", (key, val) => {
    fields[key] = val;
  });

  bb.on("file", (name, file, info, encoding, mime) => {
    let content = Buffer.from("");
    file
      .on("data", (data) => {
        content = Buffer.concat([content, data]);
      })
      .on("close", () => {
        files.push({ name, file, info, encoding, mime, content });
      });
  });

  const finished = new Promise((resolve, reject) => {
    busboy.on("finish", () => resolve());
    busboy.on("error", (error) => reject(error));
  });

  await finished;

  console.log("Fields:", fields);
  console.log("Files:", files);

  return new Response("🧞‍♂️");
};
