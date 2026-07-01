# Платёжная функция (PayKeeper)

Маленький бэкенд для оплаты. Развёрнут как **Yandex Cloud Function** на вашем облаке.
Работает на «рельсах» PayKeeper хелпекселя (тот же мерчант `helpexcel.server.paykeeper.ru`).

- **Функция:** `izobretim-pay`
- **Публичный URL:** https://functions.yandexcloud.net/d4e2sbk6rjre32pnfauk
- **Что делает:** принимает корзину → считает сумму на сервере по `products.json` → создаёт счёт в PayKeeper → возвращает ссылку на оплату.

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

## Что доработать для боевого режима
- Приём уведомления об оплате в свою базу заказов (сейчас заказ пишется в лог функции).
- Фискальный чек 54-ФЗ (сейчас email в PayKeeper не передаётся — чек не формируется).
- Своя витрина заказов/статусы.
