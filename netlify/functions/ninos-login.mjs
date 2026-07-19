import crypto from "node:crypto";

// Valida la contraseña del equipo del Área Infantil contra la variable de
// entorno NINOS_PASSWORD y devuelve un token para las llamadas a ninos-state.
const TOKEN_SEED = "practicum-ninos-2026";

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método no permitido" }, { status: 405 });
  }
  const pass = process.env.NINOS_PASSWORD;
  if (!pass) {
    return Response.json({ error: "NINOS_PASSWORD no configurada en Netlify" }, { status: 500 });
  }
  let body = {};
  try { body = await req.json(); } catch {}
  const given = crypto.createHash("sha256").update(String(body.password || "")).digest();
  const expected = crypto.createHash("sha256").update(pass).digest();
  if (!crypto.timingSafeEqual(given, expected)) {
    return Response.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  const token = crypto.createHmac("sha256", pass).update(TOKEN_SEED).digest("hex");
  return Response.json({ token });
};
