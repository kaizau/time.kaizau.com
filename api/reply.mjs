export default async (req /* , ctx */) => {
  const formData = await req.formData();
  const parts = {};
  for (const [key, value] of formData) {
    parts[key] = value;
  }
  console.log(parts);

  return new Response("ok");
};
