import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

// Estado compartido del Área Infantil (familias + bitácora + llegadas) en
// Netlify Blobs, para operar desde varios dispositivos a la vez.
// GET  → devuelve el estado actual.
// POST → une el estado enviado con el guardado (unión por id: las familias son
//        inmutables y las bitácoras son append-only, así que la unión no
//        pierde ni sobrescribe nada) y devuelve el resultado.
const TOKEN_SEED = "practicum-ninos-2026";
const KEY = "state";
const DEFAULT_PASSWORD = "practicum2026";

function authorized(req) {
  const pass = process.env.NINOS_PASSWORD || DEFAULT_PASSWORD;
  const given = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const expected = crypto.createHmac("sha256", pass).update(TOKEN_SEED).digest("hex");
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export function mergeStates(base, incoming) {
  const famIds = new Set(base.families.map((f) => f.id));
  const families = base.families.concat(
    (incoming.families || []).filter((f) => f && f.id && !famIds.has(f.id))
  );
  families.sort((x, y) => String(x.createdAt || "").localeCompare(String(y.createdAt || "")));
  const logIds = new Set(base.log.map((l) => l.id));
  const log = base.log.concat(
    (incoming.log || []).filter((l) => l && l.id && !logIds.has(l.id))
  );
  log.sort((x, y) => String(x.ts || "").localeCompare(String(y.ts || "")));
  const baseArrivals = base.arrivals || [];
  const arrIds = new Set(baseArrivals.map((a) => a.id));
  const arrivals = baseArrivals.concat(
    (incoming.arrivals || []).filter((a) => a && a.id && !arrIds.has(a.id))
  );
  arrivals.sort((x, y) => String(x.ts || "").localeCompare(String(y.ts || "")));
  const baseWalkins = base.walkins || [];
  const wkIds = new Set(baseWalkins.map((w) => w.id));
  const walkins = baseWalkins.concat(
    (incoming.walkins || []).filter((w) => w && w.id && !wkIds.has(w.id))
  );
  walkins.sort((x, y) => String(x.ts || "").localeCompare(String(y.ts || "")));
  return { families, log, arrivals, walkins };
}

export default async (req) => {
  if (!authorized(req)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  const store = getStore("ninos");
  const current = (await store.get(KEY, { type: "json" })) || { families: [], log: [], arrivals: [] };

  if (req.method === "GET") {
    return Response.json(current);
  }
  if (req.method === "POST") {
    let body = {};
    try { body = await req.json(); } catch {}
    const merged = mergeStates(current, body);
    await store.setJSON(KEY, merged);
    return Response.json(merged);
  }
  return Response.json({ error: "Método no permitido" }, { status: 405 });
};
