/* ============================================================
   Каталог-образец. Данные встроены в JS, чтобы сайт открывался
   двойным кликом (без сервера). Позже сюда парсер положит реальные
   товары, или заменим на загрузку с бэкенда.

   status: "ready" — карточка готова
           "check" — черновик, надо проверить цену/фото/описание
           "wait"  — ждём условия партнёра
   ============================================================ */
window.STORE = {
  brands: [
    { id: "enjoy",     name: "Enjoy Robotics", flag: true },
    { id: "amperka",   name: "Амперка" },
    { id: "znatok",    name: "ЗНАТОК" },
    { id: "fanclastic",name: "Фанкластик" },
    { id: "wowhow",    name: "WOW! HOW?" },
    { id: "simple",    name: "Простая Наука" },
    { id: "mrant",     name: "Мистер Ант" },
    { id: "levenhuk",  name: "Levenhuk" },
    { id: "bondibon",  name: "Bondibon" },
    { id: "boombaram", name: "Бумбарам" }
  ],
  categories: [
    { id: "robots",   name: "Робототехника",        emo: "🤖", cls: "c1" },
    { id: "coding",   name: "Программирование",      emo: "💻", cls: "c2" },
    { id: "electro",  name: "Электроника",           emo: "⚡", cls: "c3" },
    { id: "chem",     name: "Юный химик",            emo: "⚗️", cls: "c4" },
    { id: "physics",  name: "Физика и опыты",        emo: "🔬", cls: "c5" },
    { id: "construct",name: "Конструкторы",          emo: "🧩", cls: "c6" },
    { id: "explore",  name: "Исследуем мир",         emo: "🔭", cls: "c7" },
    { id: "school",   name: "Школам и кружкам",      emo: "🎓", cls: "c8" }
  ],
  // возрастные группы для фильтра
  ages: [
    { id: "3-5",  name: "3–5 лет" },
    { id: "6-8",  name: "6–8 лет" },
    { id: "9-11", name: "9–11 лет" },
    { id: "12+",  name: "12+ лет" }
  ],
  products: [
    // ---------- Enjoy Robotics (флагман) ----------
    { id:1, brand:"enjoy", cat:"robots", emo:"🤖", title:"Enjoy Robotics — Робот Отто (шагающий)",
      price:4990, old:5990, age:"6-8", time:"1–2 часа", adult:"можно с родителем",
      screen:true, battery:true, level:"старт", develops:"логика, сборка, основы кода",
      badge:"hit", status:"check" },
    { id:2, brand:"enjoy", cat:"robots", emo:"🦾", title:"Enjoy Robotics — Робот-манипулятор",
      price:7490, old:null, age:"9-11", time:"2–3 часа", adult:"сам соберёт",
      screen:true, battery:true, level:"средний", develops:"механика, программирование",
      badge:"new", status:"check" },
    { id:3, brand:"enjoy", cat:"robots", emo:"🕷️", title:"Enjoy Robotics — Квадропод (робот-паук)",
      price:8990, old:null, age:"9-11", time:"3+ часа", adult:"сам соберёт",
      screen:true, battery:true, level:"продвинутый", develops:"механика, координация, код",
      badge:null, status:"check" },
    { id:4, brand:"enjoy", cat:"coding", emo:"🌸", title:"Enjoy Robotics — Киберцветок (умный датчик)",
      price:3490, old:null, age:"6-8", time:"1 час", adult:"можно с родителем",
      screen:true, battery:true, level:"старт", develops:"датчики, программирование",
      badge:null, status:"check" },
    { id:5, brand:"enjoy", cat:"electro", emo:"🏠", title:"Enjoy Robotics — Умный дом (набор)",
      price:6490, old:null, age:"9-11", time:"2–3 часа", adult:"можно с родителем",
      screen:true, battery:true, level:"средний", develops:"электроника, автоматика",
      badge:null, status:"check" },
    { id:6, brand:"enjoy", cat:"school", emo:"📦", title:"Enjoy Box — комплект для кружка (10 мест)",
      price:39900, old:null, age:"9-11", time:"курс", adult:"с педагогом",
      screen:true, battery:true, level:"курс", develops:"полный курс робототехники",
      badge:null, status:"wait" },

    // ---------- Амперка ----------
    { id:7, brand:"amperka", cat:"electro", emo:"⚡", title:"Амперка — «Малина» стартовый Arduino-набор",
      price:5900, old:null, age:"12+", time:"курс", adult:"сам соберёт",
      screen:true, battery:false, level:"средний", develops:"электроника, Arduino, код",
      badge:"hit", status:"check" },
    { id:8, brand:"amperka", cat:"coding", emo:"🔌", title:"Амперка — Набор «Йодо» с датчиками",
      price:4500, old:null, age:"9-11", time:"курс", adult:"можно с родителем",
      screen:true, battery:false, level:"средний", develops:"схемы, датчики, логика",
      badge:null, status:"check" },
    { id:9, brand:"amperka", cat:"robots", emo:"🚗", title:"Амперка — Робот-машинка на Arduino",
      price:8900, old:null, age:"12+", time:"3+ часа", adult:"сам соберёт",
      screen:true, battery:true, level:"продвинутый", develops:"робототехника, код",
      badge:null, status:"check" },

    // ---------- ЗНАТОК ----------
    { id:10, brand:"znatok", cat:"electro", emo:"🔋", title:"ЗНАТОК — «180 схем» электронный конструктор",
      price:2790, old:3200, age:"6-8", time:"1 час", adult:"можно с родителем",
      screen:false, battery:true, level:"старт", develops:"основы электричества",
      badge:"hit", status:"check" },
    { id:11, brand:"znatok", cat:"electro", emo:"💡", title:"ЗНАТОК — «999 схем» большой набор",
      price:5490, old:null, age:"9-11", time:"много занятий", adult:"можно с родителем",
      screen:false, battery:true, level:"средний", develops:"электроника, схемотехника",
      badge:null, status:"check" },

    // ---------- Фанкластик ----------
    { id:12, brand:"fanclastic", cat:"construct", emo:"🧩", title:"Фанкластик — 3D-конструктор «Роботрон»",
      price:1990, old:null, age:"6-8", time:"1–2 часа", adult:"сам соберёт",
      screen:false, battery:false, level:"старт", develops:"пространственное мышление",
      badge:null, status:"check" },
    { id:13, brand:"fanclastic", cat:"construct", emo:"🏗️", title:"Фанкластик — Большой набор «Инженер»",
      price:3990, old:null, age:"9-11", time:"свободная сборка", adult:"сам соберёт",
      screen:false, battery:false, level:"средний", develops:"конструирование, фантазия",
      badge:"new", status:"check" },

    // ---------- WOW! HOW? ----------
    { id:14, brand:"wowhow", cat:"chem", emo:"⚗️", title:"WOW! HOW? — Набор «Химия для детей»",
      price:1490, old:1790, age:"6-8", time:"по опытам", adult:"с родителем",
      screen:false, battery:false, level:"старт", develops:"первые опыты, наблюдение",
      badge:null, status:"check" },
    { id:15, brand:"wowhow", cat:"physics", emo:"🌋", title:"WOW! HOW? — «Извержение вулкана»",
      price:990, old:null, age:"6-8", time:"30–60 мин", adult:"с родителем",
      screen:false, battery:false, level:"старт", develops:"интерес к науке",
      badge:"hit", status:"check" },

    // ---------- Простая Наука ----------
    { id:16, brand:"simple", cat:"chem", emo:"🧪", title:"Простая Наука — «Опыты с водой и воздухом»",
      price:1290, old:null, age:"6-8", time:"по опытам", adult:"с родителем",
      screen:false, battery:false, level:"старт", develops:"физика простыми словами",
      badge:null, status:"check" },
    { id:17, brand:"simple", cat:"physics", emo:"🔬", title:"Простая Наука — Большой набор «100 опытов»",
      price:2990, old:null, age:"9-11", time:"надолго", adult:"можно с родителем",
      screen:false, battery:false, level:"средний", develops:"наука, эксперименты",
      badge:null, status:"check" },

    // ---------- Мистер Ант ----------
    { id:18, brand:"mrant", cat:"explore", emo:"🐜", title:"Мистер Ант — Муравьиная ферма с подсветкой",
      price:2490, old:null, age:"6-8", time:"наблюдение", adult:"можно с родителем",
      screen:false, battery:false, level:"старт", develops:"биология, наблюдательность",
      badge:null, status:"check" },
    { id:19, brand:"mrant", cat:"physics", emo:"🦖", title:"Мистер Ант — Раскопки «Скелет динозавра»",
      price:1190, old:1490, age:"6-8", time:"1–2 часа", adult:"можно с родителем",
      screen:false, battery:false, level:"старт", develops:"усидчивость, палеонтология",
      badge:null, status:"check" },

    // ---------- Levenhuk ----------
    { id:20, brand:"levenhuk", cat:"explore", emo:"🔬", title:"Levenhuk — Детский микроскоп LabZZ",
      price:3690, old:null, age:"9-11", time:"надолго", adult:"можно с родителем",
      screen:false, battery:true, level:"средний", develops:"биология, исследование",
      badge:"hit", status:"check" },
    { id:21, brand:"levenhuk", cat:"explore", emo:"🔭", title:"Levenhuk — Телескоп для начинающих",
      price:6900, old:null, age:"9-11", time:"надолго", adult:"с родителем",
      screen:false, battery:false, level:"средний", develops:"астрономия",
      badge:null, status:"check" },

    // ---------- Bondibon ----------
    { id:22, brand:"bondibon", cat:"physics", emo:"🧲", title:"Bondibon — «Науки с Буки»: магнетизм",
      price:1590, old:null, age:"6-8", time:"по опытам", adult:"с родителем",
      screen:false, battery:false, level:"старт", develops:"физика, магниты",
      badge:null, status:"check" },
    { id:23, brand:"bondibon", cat:"coding", emo:"🎯", title:"Bondibon — Логическая игра-головоломка",
      price:1290, old:null, age:"3-5", time:"на каждый день", adult:"можно с родителем",
      screen:false, battery:false, level:"старт", develops:"логика, внимание",
      badge:null, status:"check" },

    // ---------- Бумбарам ----------
    { id:24, brand:"boombaram", cat:"chem", emo:"💎", title:"Бумбарам — Набор «Выращивание кристаллов»",
      price:890, old:null, age:"6-8", time:"несколько дней", adult:"с родителем",
      screen:false, battery:false, level:"старт", develops:"химия, терпение",
      badge:null, status:"check" }
  ]
};
