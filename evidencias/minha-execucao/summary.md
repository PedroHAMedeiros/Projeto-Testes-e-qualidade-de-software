# Resumo da execução

- Arquivo de origem: `reports/results.json`
- Início: 2026-11-23T20:41:35.262Z
- Taxa de sucesso (resultado conforme esperado, incluindo falhas esperadas de defeitos conhecidos): **100.0%**
- Taxa de testes instáveis (flaky): **0.0%**

| projeto | total | passou | falhou | flaky | defeito conhecido (falha esperada) | pulado | duração (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| api | 77 | 69 | 0 | 0 | 8 | 0 | 130.9 |
| ui | 25 | 24 | 0 | 0 | 1 | 0 | 304.0 |
| e2e | 2 | 2 | 0 | 0 | 0 | 0 | 51.4 |
| TOTAL | 104 | 95 | 0 | 0 | 9 | 0 | 272.7 (wall) |

## Falhas inesperadas (0)
- nenhuma

## Testes instáveis — passaram só na nova tentativa (0)
- nenhum

## Testes pulados — não executados (0)
- nenhum

## Defeitos conhecidos confirmados nesta execução (9)
- [api] API-AUTH-05b idade acima de 75 anos deve ser rejeitada @boundary @known-defect
- [api] API-AUTH-10 cadastro com e-mail em formato inválido deve ser rejeitado @negative @known-defect
- [api] API-AUTHZ-03 cliente B NÃO pode ler o favorito do cliente A @negative @known-defect
- [api] API-CART-08 adições acumuladas não podem ultrapassar o máximo de 99 @boundary @known-defect
- [api] API-CART-09 produto sem estoque não deve ser aceito no carrinho @negative @known-defect
- [api] API-CEP-02 o mesmo CEP com e sem hífen deve devolver a mesma cidade @known-defect
- [api] API-PAY-04 método de pagamento fora da lista deve ser rejeitado @negative @known-defect
- [api] API-PROD-13 ordenação com parâmetro inválido deve ser rejeitada com 4xx, não 500 @negative @known-defect
- [ui] UI-CHK-02 endereço digitado pelo usuário não pode ser sobrescrito pela busca de CEP @known-defect
