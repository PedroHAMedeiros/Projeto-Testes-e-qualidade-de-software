# Resumo da execução

- Arquivo de origem: `reports/results.json`
- Início: 2026-11-20T22:40:05.218Z
- Taxa de sucesso (resultado conforme esperado, incluindo falhas esperadas de defeitos conhecidos): **98.9%**
- Taxa de testes instáveis (flaky): **3.4%**

| projeto | total | passou | falhou | flaky | defeito conhecido (falha esperada) | pulado | duração (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| api | 60 | 52 | 0 | 2 | 6 | 0 | 352.0 |
| ui | 25 | 23 | 0 | 1 | 1 | 0 | 239.1 |
| e2e | 2 | 1 | 1 | 0 | 0 | 0 | 78.4 |
| TOTAL | 87 | 76 | 1 | 3 | 7 | 0 | 464.5 (wall) |

## Falhas inesperadas (1)
- [e2e] E2E-01 cliente autenticado compra 2 produtos com pagamento na entrega @smoke @regression @e2e — `Error: expect(received).toBe(expected) // Object.is equality`

## Testes instáveis — passaram só na nova tentativa (3)
- [api] API-AUTH-03 campos obrigatórios ausentes @negative @regression
- [api] API-AUTH-04 senha inválida (menos de 8 caracteres) é rejeitada @negative @regression
- [ui] UI-CAT-06 segunda página exibe produtos diferentes da primeira @regression

## Defeitos conhecidos confirmados nesta execução (7)
- [api] API-AUTH-05b idade acima de 75 anos deve ser rejeitada @boundary @known-defect
- [api] API-AUTH-10 cadastro com e-mail em formato inválido deve ser rejeitado @negative @known-defect
- [api] API-CART-08 adições acumuladas não podem ultrapassar o máximo de 99 @boundary @known-defect
- [api] API-CART-09 produto sem estoque não deve ser aceito no carrinho @negative @known-defect
- [api] API-PAY-04 método de pagamento fora da lista deve ser rejeitado @negative @known-defect
- [api] API-PROD-13 ordenação com parâmetro inválido deve ser rejeitada com 4xx, não 500 @negative @known-defect
- [ui] UI-CHK-02 endereço digitado pelo usuário não pode ser sobrescrito pela busca de CEP @known-defect
