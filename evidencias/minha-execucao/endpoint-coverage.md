# Cobertura de endpoints da API (contrato OpenAPI × chamadas dos testes)

- Gerado em: 2026-11-23T20:46:11.160Z
- Operações no contrato: **88** (em escopo: **48**, fora de escopo: 40)
- Chamadas registradas durante a execução: 807
- **Cobertura das operações em escopo: 38/48 = 79.2%** (só pelos testes de API: 36)
- Cobertura do contrato inteiro (inclui admin): 43.2%

> Métrica de superfície de API, NÃO de cobertura de código do servidor (indisponível no ambiente público).

| Operação | Escopo | Chamadas (testes API) | Chamadas (via UI) | Status HTTP observados |
| --- | --- | ---: | ---: | --- |
| `GET /brands` | sim | 6 | 13 | 200 |
| `POST /brands` | fora | 0 | 0 |  |
| `GET /brands/{brandId}` | sim | 3 | 0 | 200 |
| `PUT /brands/{brandId}` | fora | 0 | 0 |  |
| `DELETE /brands/{brandId}` | fora | 0 | 0 |  |
| `PATCH /brands/{brandId}` | fora | 0 | 0 |  |
| `GET /brands/search` | sim | 3 | 0 | 200 |
| `QUERY /brands/search` | sim | 0 | 0 |  |
| `POST /carts` | sim | 51 | 9 | 201 |
| `POST /carts/{id}` | sim | 57 | 10 | 200,422 |
| `GET /carts/{cartId}` | sim | 27 | 19 | 200,404 |
| `DELETE /carts/{cartId}` | sim | 42 | 1 | 204 |
| `PUT /carts/{cartId}/product/quantity` | sim | 6 | 1 | 200,422 |
| `DELETE /carts/{cartId}/product/{productId}` | sim | 3 | 1 | 204 |
| `GET /categories/tree` | sim | 3 | 13 | 200 |
| `QUERY /categories/tree` | sim | 0 | 0 |  |
| `GET /categories` | sim | 3 | 0 | 200 |
| `POST /categories` | fora | 0 | 0 |  |
| `GET /categories/tree/{categoryId}` | sim | 6 | 0 | 200,404 |
| `GET /categories/search` | sim | 3 | 0 | 200 |
| `QUERY /categories/search` | sim | 0 | 0 |  |
| `PUT /categories/{categoryId}` | fora | 0 | 0 |  |
| `DELETE /categories/{categoryId}` | fora | 0 | 0 |  |
| `PATCH /categories/{categoryId}` | fora | 0 | 0 |  |
| `GET /messages` | fora | 0 | 0 |  |
| `POST /messages` | sim | 6 | 0 | 422 |
| `POST /messages/{messageId}/attach-file` | sim | 0 | 0 |  |
| `GET /messages/{messageId}` | fora | 0 | 0 |  |
| `POST /messages/{messageId}/reply` | fora | 0 | 0 |  |
| `PUT /messages/{messageId}/status` | fora | 0 | 0 |  |
| `GET /favorites` | sim | 9 | 0 | 200,401 |
| `POST /favorites` | sim | 9 | 0 | 201 |
| `GET /favorites/{favoriteId}` | sim | 9 | 0 | 200 |
| `DELETE /favorites/{favoriteId}` | sim | 6 | 0 | 204 |
| `GET /images` | fora | 0 | 0 |  |
| `GET /invoices` | sim | 1 | 0 | 200 |
| `POST /invoices` | sim | 9 | 1 | 201,422 |
| `POST /invoices/guest` | sim | 0 | 0 |  |
| `GET /invoices/{invoiceId}` | sim | 6 | 0 | 200,404 |
| `PUT /invoices/{invoiceId}` | fora | 0 | 0 |  |
| `PATCH /invoices/{invoiceId}` | fora | 0 | 0 |  |
| `GET /invoices/{invoice_number}/download-pdf` | sim | 0 | 0 |  |
| `GET /invoices/{invoice_number}/download-pdf-status` | sim | 0 | 0 |  |
| `PUT /invoices/{invoiceId}/status` | fora | 0 | 0 |  |
| `GET /invoices/search` | sim | 3 | 0 | 200 |
| `QUERY /invoices/search` | sim | 0 | 0 |  |
| `POST /payment/check` | sim | 21 | 1 | 200,422 |
| `GET /postcode-lookup` | sim | 15 | 7 | 200 |
| `GET /products` | sim | 40 | 0 | 200,500 |
| `POST /products` | fora | 0 | 0 |  |
| `QUERY /products` | sim | 0 | 17 | 200,500 |
| `GET /products/{productId}` | sim | 13 | 13 | 200,404 |
| `PUT /products/{productId}` | fora | 0 | 0 |  |
| `DELETE /products/{productId}` | fora | 0 | 0 |  |
| `PATCH /products/{productId}` | fora | 0 | 0 |  |
| `GET /products/{productId}/related` | sim | 3 | 13 | 200 |
| `GET /products/search` | sim | 12 | 0 | 200 |
| `QUERY /products/search` | sim | 0 | 2 | 200 |
| `GET /products/{productId}/specs` | sim | 3 | 0 | 200 |
| `POST /products/{productId}/specs` | fora | 0 | 0 |  |
| `GET /products/{productId}/specs/{specId}` | sim | 0 | 0 |  |
| `PUT /products/{productId}/specs/{specId}` | fora | 0 | 0 |  |
| `DELETE /products/{productId}/specs/{specId}` | fora | 0 | 0 |  |
| `GET /product-specs/names` | sim | 3 | 13 | 200 |
| `GET /reports/total-sales-per-country` | fora | 0 | 0 |  |
| `GET /reports/top10-purchased-products` | fora | 0 | 0 |  |
| `GET /reports/top10-best-selling-categories` | fora | 0 | 0 |  |
| `GET /reports/total-sales-of-years` | fora | 0 | 0 |  |
| `GET /reports/average-sales-per-month` | fora | 0 | 0 |  |
| `GET /reports/average-sales-per-week` | fora | 0 | 0 |  |
| `GET /reports/customers-by-country` | fora | 0 | 0 |  |
| `GET /sales-stream` | fora | 0 | 0 |  |
| `POST /totp/setup` | fora | 0 | 0 |  |
| `POST /totp/verify` | fora | 0 | 0 |  |
| `GET /users` | fora | 0 | 0 |  |
| `POST /users/register` | sim | 92 | 0 | 201,409,422 |
| `POST /users/login` | sim | 59 | 6 | 200,401 |
| `POST /users/forgot-password` | sim | 0 | 0 |  |
| `POST /users/change-password` | sim | 3 | 0 | 200 |
| `GET /users/me` | sim | 15 | 111 | 200,401 |
| `GET /users/logout` | sim | 3 | 0 | 200 |
| `GET /users/refresh` | sim | 3 | 0 | 200 |
| `GET /users/{userId}` | fora | 0 | 0 |  |
| `PUT /users/{userId}` | fora | 0 | 0 |  |
| `DELETE /users/{userId}` | fora | 0 | 0 |  |
| `PATCH /users/{userId}` | fora | 0 | 0 |  |
| `GET /users/search` | fora | 0 | 0 |  |
| `QUERY /users/search` | fora | 0 | 0 |  |
