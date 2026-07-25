import crypto from "node:crypto";

// Valida la contraseña del equipo del Área Infantil y devuelve un token para
// las llamadas a ninos-state. Por defecto usa la contraseña del equipo
// incluida; la variable de entorno NINOS_PASSWORD (opcional) la reemplaza.
const TOKEN_SEED = "practicum-ninos-2026";
const DEFAULT_PASSWORD = "practicum2026";

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método no permitido" }, { status: 405 });
  }
  const pass = process.env.NINOS_PASSWORD || DEFAULT_PASSWORD;
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
