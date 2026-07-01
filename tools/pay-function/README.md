# Платёжная функция (PayKeeper)

Маленький бэкенд для оплаты. Развёрнут как **Yandex Cloud Function** на вашем облаке.
Работает на «рельсах» PayKeeper хелпекселя (тот же мерчант `helpexcel.server.paykeeper.ru`).

- **Функция:** `izobretim-pay`
- **Публичный URL:** https://functions.yandexcloud.net/d4e2sbk6rjre32pnfauk
- **Что делает:** принимает корзину → считает сумму на сервере по `products.json` → **создаёт лид в AmoCRM (воронка «изобретим» 11064538)** → создаёт счёт в PayKeeper → возвращает ссылку на оплату.

## AmoCRM
- Лид падает в воронку **11064538 «изобретим»**, этап **«Первичный контакт»** (`86911274`).
  В служебное «Неразобранное» напрямую класть нельзя — Amo отклоняет.
- Создаётся лид + контакт (имя, телефон, e-mail) одним запросом `/leads/complex`.
- В лид добавляется заметка с составом заказа, суммой, контактами и ссылкой на оплату.
- Номер заказа — `SHOPL<leadId>_<rand>` (в него вшит id лида — пригодится, чтобы позже
  автоматически ставить «оплачено», когда придёт подтверждение от PayKeeper).
- Креды Amo (`AMOCRM_SUBDOMAIN`, `AMOCRM_ACCESS_TOKEN`) — из `helpexcel/.env.ycf`, только в окружении функции.

## Важные решения
- Сумма считается **на сервере** (клиенту не доверяем — иначе можно было бы подменить цену).
- **Email/телефон покупателя в PayKeeper НЕ передаём.** Иначе приёмник оплат хелпекселя запишет покупателя в подписчиков и пришлёт welcome-письмо. Контакты храним у себя (в логах заказа).
- Номер заказа с префиксом `SHOP...` — не пересекается с форматами хелпекселя (`L...`) и финпилота (`W...__T...`), поэтому приёмник хелпекселя их просто подтверждает и ничего лишнего не делает.

## Секреты (НЕ в коде)
Лежат в окружении функции, берутся из `helpexcel/.env.ycf`:
- `PAYKEEPER_SERVER`
- `PAYKEEPER_AUTH_B64`

## Переразвернуть после правок
```bash
yc serverless function version create \
  --function-name izobretim-pay \
  --runtime nodejs22 --entrypoint index.handler \
  --memory 128m --execution-timeout 30s \
  --source-path tools/pay-function \
  --environment "PAYKEEPER_SERVER=...,PAYKEEPER_AUTH_B64=..."
```
`products.json` пересобрать из каталога:
```bash
node -e 'global.window={};require("./assets/js/data.js");const m={};for(const p of window.STORE.products)m[p.id]={price:p.price,title:p.title};require("fs").writeFileSync("tools/pay-function/products.json",JSON.stringify(m))'
```

## Полный цикл (готово)
1. Оформление → лид в воронке 11064538, этап «Первичный контакт» + счёт PayKeeper.
2. Успешная оплата → приёмник хелпекселя (`helpexcel/api/paykeeper-notify-shared.js`)
   по `orderid = SHOPL<leadId>_…` двигает лид в **«Успешно реализовано» (142)** и пишет заметку.
   Ветка добавлена в `processPayKeeperForm`; в `api/index.js` добавлено декодирование base64-тела.
   ⚠️ Это правки боевого кода хелпекселя — они развёрнуты, но не закоммичены в репо helpexcel.

## Что доработать для боевого режима
- Своя витрина заказов/статусы; дедуп лидов при повторных попытках оплаты.
- Фискальный чек 54-ФЗ формирует PayKeeper (при необходимости — передавать email покупателя).
