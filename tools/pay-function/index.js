/**
 * Yandex Cloud Function: оформление заказа магазина «Изобретим».
 *  1) считает сумму на сервере по products.json (клиенту не доверяем);
 *  2) создаёт лид+контакт в AmoCRM хелпекселя (воронка «изобретим» 11064538);
 *  3) создаёт счёт PayKeeper (рельсы хелпекселя) и возвращает ссылку на оплату.
 *
 * Email/телефон в PayKeeper НЕ передаём — иначе приёмник хелпекселя запишет
 * покупателя в подписчики и пришлёт welcome-письмо. Контакты уходят только в Amo.
 */
const PRODUCTS = require("./products.json");

const SERVER = (process.env.PAYKEEPER_SERVER || "").trim().replace(/\/$/, "");
const AUTH = (process.env.PAYKEEPER_AUTH_B64 || "").trim();
const SUCCESS_URL = process.env.SUCCESS_URL || "https://6p9jys596k-byte.github.io/izobretim-preview/thanks.html";
const FAIL_URL = process.env.FAIL_URL || "https://6p9jys596k-byte.github.io/izobretim-preview/pay-fail.html";
const ORIGIN = process.env.CORS_ORIGIN || "https://6p9jys596k-byte.github.io";

// AmoCRM хелпекселя: лиды заказов → воронка «изобретим»
const AMO_SUB = (process.env.AMOCRM_SUBDOMAIN || "").trim();
const AMO_TOKEN = (process.env.AMOCRM_ACCESS_TOKEN || "").trim();
const AMO_PIPELINE = parseInt(process.env.AMO_PIPELINE_ID || "11064538", 10);
const AMO_STATUS = parseInt(process.env.AMO_STATUS_ID || "86911274", 10); // «Первичный контакт» (в «Неразобранное» напрямую нельзя)

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

const rub = n => Number(n).toLocaleString("ru-RU") + " руб.";

async function amoFetch(path, options) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    return await fetch("https://" + AMO_SUB + ".amocrm.ru" + path, {
      ...options,
      signal: ctrl.signal,
      headers: {
        Authorization: "Bearer " + AMO_TOKEN,
        "Content-Type": "application/json",
        ...(options && options.headers),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

/** Лид+контакт в воронке «изобретим». Возвращает leadId или null. Ошибку не роняем — оплата важнее. */
async function createAmoLead(customer, total, names) {
  if (!AMO_SUB || !AMO_TOKEN) return null;
  try {
    const contact = { name: String(customer.name || "Покупатель").slice(0, 200) };
    const cf = [];
    if (customer.phone) cf.push({ field_code: "PHONE", values: [{ value: String(customer.phone), enum_code: "WORK" }] });
    if (customer.email) cf.push({ field_code: "EMAIL", values: [{ value: String(customer.email), enum_code: "WORK" }] });
    if (cf.length) contact.custom_fields_values = cf;

    const body = [{
      name: ("Заказ Изобретим: " + names.join(", ")).slice(0, 240),
      price: Math.round(total),
      pipeline_id: AMO_PIPELINE,
      status_id: AMO_STATUS,
      _embedded: { contacts: [contact] },
    }];

    const res = await amoFetch("/api/v4/leads/complex", { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) {
      console.error("AMO lead failed", res.status, (await res.text().catch(() => "")).slice(0, 200));
      return null;
    }
    const j = await res.json();
    return Array.isArray(j) && j[0] && j[0].id ? j[0].id : null;
  } catch (e) {
    console.error("AMO lead exception", e && e.message);
    return null;
  }
}

async function addAmoNote(leadId, message) {
  if (!leadId) return;
  try {
    await amoFetch("/api/v4/leads/notes", {
      method: "POST",
      body: JSON.stringify([{ entity_id: leadId, note_type: "common", params: { text: String(message).slice(0, 900) } }]),
    });
  } catch (e) {
    console.error("AMO note exception", e && e.message);
  }
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

  const customer = (data.customer && typeof data.customer === "object") ? data.customer : {};

  // 1) лид в Amo (до счёта — чтобы вшить leadId в номер заказа для будущей отметки «оплачено»)
  const leadId = await createAmoLead(customer, total, names);

  const rand = Math.random().toString(36).slice(2, 8);
  const orderid = leadId ? `SHOPL${leadId}_${rand}` : `SHOP${Date.now()}_${rand}`;
  const service_name = ("Заказ Изобретим: " + names.join(", ")).slice(0, 240);

  try {
    // 2) токен PayKeeper
    const tr = await fetch(SERVER + "/info/settings/token/", {
      headers: { Authorization: "Basic " + AUTH, Accept: "application/json" },
    });
    if (!tr.ok) return resp(502, { error: "token_http_" + tr.status });
    const tj = await tr.json();
    if (!tj || !tj.token) return resp(502, { error: "no_token" });

    // 3) счёт
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

    const paymentUrl = SERVER + "/bill/" + ij.invoice_id + "/";

    // 4) заметка в лид с составом заказа и ссылкой на оплату
    const note = [
      "🛒 Новый заказ с сайта Изобретим",
      "Состав: " + names.join(", "),
      "Сумма: " + rub(total),
      "Телефон: " + (customer.phone || "—"),
      "E-mail: " + (customer.email || "—"),
      "Номер заказа: " + orderid,
      "Ссылка на оплату: " + paymentUrl,
      "🕒 Статус: ожидает оплаты",
    ].join("\n");
    await addAmoNote(leadId, note);

    console.log("ORDER", JSON.stringify({ orderid, leadId, total, customer, items }));

    return resp(200, { paymentUrl, orderid, total, leadId });
  } catch (e) {
    return resp(502, { error: "exception", detail: String(e && e.message).slice(0, 150) });
  }
};
