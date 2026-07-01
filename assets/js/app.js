/* ============================================================
   Общая логика: карточки товаров, витрина на главной, каталог с фильтрами.
   ============================================================ */
(function () {
  const S = window.STORE;
  const rub = n => n.toLocaleString("ru-RU") + " ₽";
  const brandName = id => (S.brands.find(b => b.id === id) || {}).name || id;
  const catName = id => (S.categories.find(c => c.id === id) || {}).name || id;

  // ----- карточка товара -----
  function card(p) {
    const badge = p.badge === "hit" ? `<span class="chip hit">Хит</span>`
                : p.badge === "new" ? `<span class="chip new">Новинка</span>` : "";
    const brandFlag = p.brand === "enjoy" ? `<span class="chip brand">Флагман</span>` : "";
    const old = p.old ? `<s>${rub(p.old)}</s>` : "";
    const note = p.status === "wait" ? `<div class="status-note">⏳ ждём условия партнёра</div>`
               : p.status === "check" ? `<div class="status-note">✎ черновик — проверить</div>` : "";
    return `
      <article class="card" data-brand="${p.brand}" data-cat="${p.cat}" data-age="${p.age}"
               data-screen="${p.screen}" data-price="${p.price}">
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
            <button class="buy" title="В корзину">+</button>
          </div>
        </div>
      </article>`;
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

  document.addEventListener("DOMContentLoaded", () => {
    mountHome();
    mountCatalog();
    // корзина-заглушка
    document.body.addEventListener("click", e => {
      if (e.target.classList.contains("buy")) {
        e.target.textContent = "✓";
        setTimeout(() => (e.target.textContent = "+"), 900);
      }
    });
  });
})();
