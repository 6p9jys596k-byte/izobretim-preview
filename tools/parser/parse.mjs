#!/usr/bin/env node
/* ============================================================
   Сборщик каталога. Два режима:

   1) prices  — читает прайс партнёра в формате YML (его отдают
                почти все российские поставщики) и превращает в
                наш формат каталога. ЭТО ОСНОВНОЙ, ЧИСТЫЙ ПУТЬ.

   2) crawl   — заготовка парсера сайта: качает страницы и
                достаёт название/цену/фото. Запасной способ для
                чернового наполнения (тексты потом переписываем).

   Запуск:
     node tools/parser/parse.mjs prices tools/parser/samples/example.yml
     node tools/parser/parse.mjs crawl https://site.ru/catalog

   Результат:
     assets/js/data-parsed.js  — черновой каталог в формате сайта
     tools/parser/out/catalog.json — то же в JSON (для проверки)
   ============================================================ */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/* ---- Настройки брендов: сюда добавляем партнёров ---- */
const BRANDS = {
  enjoy:     { name: "Enjoy Robotics", site: "https://enjoy-robotics.ru" },
  amperka:   { name: "Амперка",        site: "https://amperka.ru" },
  znatok:    { name: "ЗНАТОК",         site: "https://znatok.ru" },
  fanclastic:{ name: "Фанкластик",     site: "https://fanclastic.ru" },
  wowhow:    { name: "WOW! HOW?",      site: "https://opt.festnauki.ru" },
  simple:    { name: "Простая Наука",  site: "https://shop.simplescience.ru" },
  levenhuk:  { name: "Levenhuk",       site: "https://www.levenhuk.ru" }
};

/* Единый формат карточки нашего каталога */
function blank(over = {}) {
  return {
    id: 0, brand: "", cat: "robots", emo: "📦", title: "",
    price: 0, old: null, age: "9-11", time: "—", adult: "можно с родителем",
    screen: false, battery: false, level: "старт", develops: "—",
    badge: null, status: "check", source: "",
    ...over
  };
}

/* ---------- РЕЖИМ 1: прайс YML ---------- */
/* Мини-парсер YML без внешних библиотек: достаём <offer>…</offer>. */
function parseYML(xml, brandId) {
  const offers = [...xml.matchAll(/<offer\b[^>]*>([\s\S]*?)<\/offer>/gi)];
  const tag = (block, name) => {
    const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
    return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
  };
  return offers.map((o, i) => {
    const b = o[1];
    const price = parseInt(tag(b, "price") || "0", 10);
    const oldp = parseInt(tag(b, "oldprice") || "0", 10);
    return blank({
      id: 1000 + i,
      brand: brandId,
      title: tag(b, "name") || tag(b, "model") || "Без названия",
      price,
      old: oldp && oldp > price ? oldp : null,
      source: tag(b, "url"),
      // категорию/возраст угадываем по названию — потом чистим руками
      cat: guessCat(tag(b, "name")),
      status: "check"
    });
  });
}

function guessCat(name = "") {
  const s = name.toLowerCase();
  if (/робот|arduino|ардуино|манипул|квадро/.test(s)) return "robots";
  if (/код|программ|scratch|блок/.test(s)) return "coding";
  if (/электрон|схем|датчик|цепь/.test(s)) return "electro";
  if (/хими|кристалл|реактив/.test(s)) return "chem";
  if (/опыт|физик|вулкан|магнит/.test(s)) return "physics";
  if (/констру|3d|деталей/.test(s)) return "construct";
  if (/микроскоп|телескоп|ферма|раскоп/.test(s)) return "explore";
  return "physics";
}

/* ---------- РЕЖИМ 2: парсер сайта (заготовка) ---------- */
async function crawl(url) {
  console.log("→ качаю", url);
  const html = await (await fetch(url)).text();
  // ВНИМАНИЕ: у каждого сайта своя вёрстка. Ниже — грубый пример,
  // под конкретного партнёра селекторы правим точечно.
  const titles = [...html.matchAll(/<a[^>]*class="[^"]*product[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, "").trim());
  const prices = [...html.matchAll(/([\d\s]{3,})\s*₽/g)].map(m => parseInt(m[1].replace(/\s/g, ""), 10));
  const items = titles.map((t, i) => blank({
    id: 2000 + i, title: t, price: prices[i] || 0, source: url, status: "check"
  }));
  console.log(`  найдено черновых карточек: ${items.length}`);
  if (!items.length) {
    console.log("  ⚠ ничего не поймали — надо настроить селекторы под этот сайт (см. README).");
  }
  return items;
}

/* ---------- Запись результата ---------- */
async function save(products) {
  await mkdir(resolve(ROOT, "tools/parser/out"), { recursive: true });
  await writeFile(resolve(ROOT, "tools/parser/out/catalog.json"),
    JSON.stringify(products, null, 2), "utf8");
  const js = `/* Черновой каталог от сборщика. Проверить и перенести в data.js. */\nwindow.STORE_PARSED = ${JSON.stringify(products, null, 2)};\n`;
  await writeFile(resolve(ROOT, "assets/js/data-parsed.js"), js, "utf8");
  console.log(`✓ сохранено: ${products.length} товаров`);
  console.log("  → tools/parser/out/catalog.json");
  console.log("  → assets/js/data-parsed.js");
}

/* ---------- CLI ---------- */
const [mode, arg, brandArg] = process.argv.slice(2);
try {
  if (mode === "prices") {
    if (!arg) throw new Error("укажите путь к YML: node parse.mjs prices file.yml [brandId]");
    const xml = await readFile(arg, "utf8");
    const brandId = brandArg || "unknown";
    const items = parseYML(xml, brandId);
    console.log(`Прайс «${BRANDS[brandId]?.name || brandId}»: ${items.length} позиций`);
    await save(items);
  } else if (mode === "crawl") {
    if (!arg) throw new Error("укажите URL: node parse.mjs crawl https://site.ru/catalog");
    await save(await crawl(arg));
  } else {
    console.log(`Сборщик каталога. Режимы:
  node tools/parser/parse.mjs prices <файл.yml> <brandId>   — прайс партнёра (основной путь)
  node tools/parser/parse.mjs crawl  <url>                  — парсер сайта (запасной)

Бренды: ${Object.keys(BRANDS).join(", ")}`);
  }
} catch (e) {
  console.error("Ошибка:", e.message);
  process.exit(1);
}
