/**
 * Yandex Cloud Function: создание счёта PayKeeper для магазина «Изобретим».
 * Рельсы — PayKeeper хелпекселя (тот же мерчант/секрет). Портировано из
 * helpexcel/api/paykeeper-notify-shared.js и helpfinance/lib/billing/paykeeper.ts.
 *
 * Сумму считаем на сервере по products.json (клиенту не доверяем).
 * Email/телефон в PayKeeper НЕ передаём — иначе приёмник хелпекселя
 * запишет покупателя в подписчики и пришлёт welcome-письмо.
 */
const PRODUCTS = require("./products.json");

const SERVER = (process.env.PAYKEEPER_SERVER || "").trim().replace(/\/$/, "");
const AUTH = (process.env.PAYKEEPER_AUTH_B64 || "").trim();
const SUCCESS_URL = process.env.SUCCESS_URL || "https://6p9jys596k-byte.github.io/izobretim-preview/thanks.html";
const FAIL_URL = process.env.FAIL_URL || "https://6p9jys596k-byte.github.io/izobretim-preview/pay-fail.html";
const ORIGIN = process.env.CORS_ORIGIN || "https://6p9jys596k-byte.github.io";

const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function resp(code, obj) {
  return {
    statusCode: code,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(obj),
  };
}

exports.handler = async (event) => {
  const method =
    (event && event.httpMethod) ||
    (event && event.requestContext && event.requestContext.http && event.requestContext.http.method) ||
    "";

  if (method === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (method !== "POST") return resp(405, { error: "method_not_allowed" });
  if (!SERVER || !AUTH) return resp(500, { error: "not_configured" });

  let raw = (event && event.body) || "";
  if (event && event.isBase64Encoded) raw = Buffer.from(raw, "base64").toString("utf8");
  let data;
  try {
    data = JSON.parse(raw || "{}");
  } catch {
    return resp(400, { error: "bad_json" });
  }

  const items = Array.isArray(data.items) ? data.items : [];
  if (!items.length) return resp(400, { error: "empty_cart" });

  // сумма и состав — на сервере
  let total = 0;
  const names = [];
  for (const it of items) {
    const p = PRODUCTS[String(it && it.id)];
    if (!p) continue;
    const qty = Math.max(1, Math.min(99, parseInt(it && it.qty, 10) || 1));
    total += p.price * qty;
    names.push(p.title + (qty > 1 ? ` ×${qty}` : ""));
  }
  if (total <= 0) return resp(400, { error: "no_valid_items" });

  const orderid = "SHOP" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  const service_name = ("Заказ Изобретим: " + names.join(", ")).slice(0, 240);
  const customer = (data.customer && typeof data.customer === "object") ? data.customer : {};

  try {
    // шаг 1 — токен
    const tr = await fetch(SERVER + "/info/settings/token/", {
      headers: { Authorization: "Basic " + AUTH, Accept: "application/json" },
    });
    if (!tr.ok) return resp(502, { error: "token_http_" + tr.status });
    const tj = await tr.json();
    if (!tj || !tj.token) return resp(502, { error: "no_token" });

    // шаг 2 — счёт
    const b = new URLSearchParams();
    b.set("token", tj.token);
    b.set("pay_amount", String(total));
    b.set("clientid", String(customer.email || customer.phone || "guest").slice(0, 120));
    b.set("orderid", orderid);
    b.set("service_name", service_name);
    b.set("success_url", SUCCESS_URL);
    b.set("fail_url", FAIL_URL);

    const ir = await fetch(SERVER + "/change/invoice/preview/", {
      method: "POST",
      headers: {
        Authorization: "Basic " + AUTH,
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        Accept: "application/json",
      },
      body: b.toString(),
    });
    if (!ir.ok) {
      const t = await ir.text().catch(() => "");
      return resp(502, { error: "invoice_http_" + ir.status, detail: t.slice(0, 150) });
    }
    const ij = await ir.json();
    if (!ij || !ij.invoice_id) return resp(502, { error: "no_invoice_id" });

    // лог заказа (наш email/телефон храним у себя, не в PayKeeper)
    console.log("ORDER", JSON.stringify({ orderid, total, customer, items }));

    return resp(200, {
      paymentUrl: SERVER + "/bill/" + ij.invoice_id + "/",
      orderid,
      total,
    });
  } catch (e) {
    return resp(502, { error: "exception", detail: String(e && e.message).slice(0, 150) });
  }
};
