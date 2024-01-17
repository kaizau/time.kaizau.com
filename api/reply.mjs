export default async (req /* , ctx */) => {
  const body = await req.json();
  console.log(body);

  return new Response("ok");
};
