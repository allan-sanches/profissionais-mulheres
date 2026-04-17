import { A as ADMIN_TOKEN } from "./server_Mjp-O15s.mjs";

const prerender = false;
const POST = async ({ request }) => {
  try {
    const authHeader = request.headers.get("Authorization");
    const tokenRecebido = authHeader?.replace("Bearer ", "");
    console.log("--- DEBUG DE SENHA ---");
    console.log("Senha que você digitou:", tokenRecebido);
    console.log("Senha que o Astro espera:", ADMIN_TOKEN);
    console.log("-----------------------");
    if (tokenRecebido && tokenRecebido === ADMIN_TOKEN) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Error" }), {
      status: 500,
    });
  }
};

const _page = /*#__PURE__*/ Object.freeze(
  /*#__PURE__*/ Object.defineProperty(
    {
      __proto__: null,
      POST,
      prerender,
    },
    Symbol.toStringTag,
    { value: "Module" },
  ),
);

const page = () => _page;

export { page };
