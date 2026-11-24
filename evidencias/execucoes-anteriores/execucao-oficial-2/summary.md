# Resumo da execução

- Arquivo de origem: `reports/results.json`
- Início: 2026-11-20T22:52:31.618Z
- Taxa de sucesso (resultado conforme esperado, incluindo falhas esperadas de defeitos conhecidos): **100.0%**
- Taxa de testes instáveis (flaky): **1.1%**

| projeto | total | passou | falhou | flaky | defeito conhecido (falha esperada) | pulado | duração (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| api | 60 | 54 | 0 | 0 | 6 | 0 | 244.2 |
| ui | 25 | 23 | 0 | 1 | 1 | 0 | 226.4 |
| e2e | 2 | 2 | 0 | 0 | 0 | 0 | 42.4 |
| TOTAL | 87 | 79 | 0 | 1 | 7 | 0 | 300.7 (wall) |

## Falhas inesperadas (0)
- nenhuma

## Testes instáveis — passaram só na nova tentativa (1)
- [ui] UI-CHK-01 endereço incompleto não permite avançar para o pagamento @negative @regression

## Defeitos conhecidos confirmados nesta execução (7)
- [api] API-AUTH-05b idade acima de 75 anos deve ser rejeitada @boundary @known-defect
- [api] API-AUTH-10 cadastro com e-mail em formato inválido deve ser rejeitado @negative @known-defect
- [api] API-CART-08 adições acumuladas não podem ultrapassar o máximo de 99 @boundary @known-defect
- [api] API-CART-09 produto sem estoque não deve ser aceito no carrinho @negative @known-defect
- [api] API-PAY-04 método de pagamento fora da lista deve ser rejeitado @negative @known-defect
- [api] API-PROD-13 ordenação com parâmetro inválido deve ser rejeitada com 4xx, não 500 @negative @known-defect
- [ui] UI-CHK-02 endereço digitado pelo usuário não pode ser sobrescrito pela busca de CEP @known-defect
