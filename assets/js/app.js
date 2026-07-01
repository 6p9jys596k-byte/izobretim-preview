/* ============================================================
   Общая логика: карточки товаров, витрина на главной, каталог с фильтрами.
   ============================================================ */
(function () {
  const S = window.STORE;
  const rub = n => n.toLocaleString("ru-RU") + " ₽";
  const brandName = id => (S.brands.find(b => b.id === id) || {}).name || id;
  const catName = id => (S.categories.find(c => c.id === id) || {}).name || id;
  const prod = id => S.products.find(p => String(p.id) === String(id));
  // префикс пути: страницы в /pages/ ссылаются на корень через ../
  const BASE = location.pathname.indexOf("/pages/") !== -1 ? "../" : "";

  // ----- карточка товара -----
  function card(p) {
    const badge = p.badge === "hit" ? `<span class="chip hit">Хит</span>`
                : p.badge === "new" ? `<span class="chip new">Новинка</span>` : "";
    const brandFlag = p.brand === "enjoy" ? `<span class="chip brand">Флагман</span>` : "";
    const old = p.old ? `<s>${rub(p.old)}</s>` : "";
    const note = p.status === "wait" ? `<div class="status-note">⏳ ждём условия партнёра</div>`
               : p.status === "check" ? `<div class="status-note">✎ черновик — проверить</div>` : "";
    return `
      <a class="card" href="${BASE}product.html?id=${p.id}" data-brand="${p.brand}" data-cat="${p.cat}"
         data-age="${p.age}" data-screen="${p.screen}" data-price="${p.price}">
        <div class="thumb${p.img ? " has-img" : ""}">
          <div class="tags">${badge}${brandFlag}</div>
          ${p.img
            ? `<img src="${p.img}" alt="${p.title}" loading="lazy" referrerpolicy="no-referrer"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="emo-fb" style="display:none">${p.emo}</span>`
            : `<span>${p.emo}</span>`}
        </div>
        <div class="body">
          <div class="brandline">${brandName(p.brand)}</div>
          <h3>${p.title}</h3>
          <div class="meta">
            <span>👶 ${p.age} лет</span>
            <span>⏱ ${p.time}</span>
            <span>${p.screen ? "📱 нужен телефон" : "🚫 без экрана"}</span>
          </div>
          <div class="meta"><span>🎯 ${p.develops}</span></div>
          ${note}
          <div class="foot">
            <div class="price">${old} ${rub(p.price)}</div>
            <span class="buy" role="button" title="В корзину">+</span>
          </div>
        </div>
      </a>`;
  }

  // ----- витрина на главной: подборки -----
  function mountHome() {
    const flag = document.getElementById("home-flagman-products");
    if (flag) {
      flag.innerHTML = S.products.filter(p => p.brand === "enjoy").slice(0, 4).map(card).join("");
    }
    const first = document.getElementById("home-first-robot");
    if (first) {
      first.innerHTML = S.products
        .filter(p => p.cat === "robots" && (p.level === "старт" || p.level === "средний"))
        .slice(0, 4).map(card).join("");
    }
    const noscreen = document.getElementById("home-no-screen");
    if (noscreen) {
      noscreen.innerHTML = S.products.filter(p => !p.screen).slice(0, 4).map(card).join("");
    }
    const gifts = document.getElementById("home-gifts");
    if (gifts) {
      gifts.innerHTML = S.products.filter(p => p.price <= 2000).slice(0, 4).map(card).join("");
    }
  }

  // ----- каталог с фильтрами -----
  function mountCatalog() {
    const grid = document.getElementById("catalog-grid");
    if (!grid) return;

    const params = new URLSearchParams(location.search);
    const preCat = params.get("cat");

    // построить фильтры
    const fCat = document.getElementById("f-cat");
    const fBrand = document.getElementById("f-brand");
    const fAge = document.getElementById("f-age");
    fCat.innerHTML = S.categories.map(c =>
      `<label class="check"><input type="checkbox" name="cat" value="${c.id}" ${preCat === c.id ? "checked" : ""}> ${c.emo} ${c.name}</label>`).join("");
    fBrand.innerHTML = S.brands.map(b =>
      `<label class="check"><input type="checkbox" name="brand" value="${b.id}"> ${b.name}${b.flag ? " ⭐" : ""}</label>`).join("");
    fAge.innerHTML = S.ages.map(a =>
      `<label class="check"><input type="checkbox" name="age" value="${a.id}"> ${a.name}</label>`).join("");

    const title = document.getElementById("catalog-title");
    if (preCat && title) title.textContent = catName(preCat);

    function checked(name) {
      return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(i => i.value);
    }
    function apply() {
      const cats = checked("cat"), brands = checked("brand"), ages = checked("age");
      const noScreen = document.getElementById("f-noscreen").checked;
      const sort = document.getElementById("sort").value;

      let list = S.products.filter(p =>
        (!cats.length || cats.includes(p.cat)) &&
        (!brands.length || brands.includes(p.brand)) &&
        (!ages.length || ages.includes(p.age)) &&
        (!noScreen || !p.screen)
      );
      if (sort === "cheap") list.sort((a, b) => a.price - b.price);
      else if (sort === "exp") list.sort((a, b) => b.price - a.price);

      grid.innerHTML = list.length ? list.map(card).join("")
        : `<div class="empty">😔 Ничего не нашлось. Сбросьте пару фильтров.</div>`;
      document.getElementById("catalog-count").textContent = `${list.length} товаров`;
    }

    document.querySelectorAll(".filters input, #sort").forEach(el => el.addEventListener("change", apply));
    document.getElementById("f-reset").addEventListener("click", () => {
      document.querySelectorAll(".filters input").forEach(i => i.checked = false);
      apply();
    });
    apply();
  }

  // ----- страница товара -----
  function mountProduct() {
    const root = document.getElementById("product-root");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    const p = prod(id);
    if (!p) {
      root.innerHTML = `<div class="empty">Товар не найден. <a href="catalog.html" style="color:var(--brand)">Вернуться в каталог</a></div>`;
      return;
    }
    document.title = `${p.title} — Изобретим`;
    const badge = p.badge === "hit" ? `<span class="chip hit">Хит</span>`
                : p.badge === "new" ? `<span class="chip new">Новинка</span>` : "";
    const brandFlag = p.brand === "enjoy" ? `<span class="chip brand">Флагман</span>` : "";
    const old = p.old ? `<s>${rub(p.old)}</s>` : "";
    const save = p.old && p.old > p.price
      ? `<span class="pd-save">−${Math.round((1 - p.price / p.old) * 100)}%</span>` : "";
    const note = p.status === "wait" ? `⏳ Ждём условия партнёра — цена и наличие уточняются`
               : p.status === "check" ? `✎ Черновик карточки — цену и наличие проверяем у бренда` : "";

    const specs = [
      ["👶", "Возраст", `${p.age} лет`],
      ["🧩", "Сложность", p.level],
      ["🙌", "Кто собирает", p.adult],
      ["⏱", "Время занятия", p.time],
      ["📱", "Экран/телефон", p.screen ? "нужен (программирование в приложении)" : "не нужен"],
      ["🔋", "Питание", p.battery ? "нужны батарейки/аккумулятор" : "не требуется"],
      ["🎯", "Что развивает", p.develops],
      ["🏷", "Бренд", brandName(p.brand)]
    ].map(([e, k, v]) => `<div class="spec"><span class="spec-i">${e}</span><span class="spec-k">${k}</span><span class="spec-v">${v}</span></div>`).join("");

    const thumb = p.img
      ? `<img src="${p.img}" alt="${p.title}" referrerpolicy="no-referrer"
           onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="emo-fb" style="display:none;font-size:120px">${p.emo}</span>`
      : `<span style="font-size:120px">${p.emo}</span>`;

    root.innerHTML = `
      <div class="crumbs"><a href="index.html">Главная</a> / <a href="catalog.html?cat=${p.cat}">${catName(p.cat)}</a> / ${p.title}</div>
      <div class="pd">
        <div class="pd-gallery${p.img ? " has-img" : ""}">
          <div class="pd-tags">${badge}${brandFlag}</div>
          ${thumb}
        </div>
        <div class="pd-info">
          <div class="brandline" style="color:var(--accent);font-weight:700">${brandName(p.brand)}</div>
          <h1>${p.title}</h1>
          <div class="pd-price">${old} ${rub(p.price)} ${save}</div>
          ${note ? `<div class="pd-note">${note}</div>` : ""}
          <div class="pd-cta">
            <button class="btn btn-primary btn-lg buy-lg">В корзину</button>
            <a class="btn btn-ghost btn-lg" href="${p.source || "#"}" target="_blank" rel="noopener">Открыть у бренда ↗</a>
          </div>
          <div class="pd-specs">${specs}</div>
          <div class="pd-trust">🚚 Доставка по России · самовывоз · оплата онлайн</div>
        </div>
      </div>`;

    // похожие товары
    const rel = document.getElementById("product-related");
    if (rel) {
      const items = S.products.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
      rel.innerHTML = items.length ? items.map(card).join("")
        : S.products.filter(x => x.id !== p.id).slice(0, 4).map(card).join("");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    mountHome();
    mountCatalog();
    mountProduct();
    // «в корзину» — заглушка; не даём ссылке-карточке сработать
    document.body.addEventListener("click", e => {
      const b = e.target.closest(".buy, .buy-lg");
      if (b) {
        e.preventDefault();
        e.stopPropagation();
        const label = b.classList.contains("buy-lg") ? "Добавлено ✓" : "✓";
        const prev = b.textContent;
        b.textContent = label;
        setTimeout(() => (b.textContent = prev), 1000);
      }
    });
  });
})();
