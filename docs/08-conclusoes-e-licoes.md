# 8. Conclusões, Lições Aprendidas e Limitações

Neste trabalho, avaliamos o **Practice Software Testing (Toolshop)** usando testes manuais, exploratórios e automatizados. O objetivo foi verificar se as principais funcionalidades atendiam ao comportamento esperado, identificar defeitos e registrar evidências para justificar os resultados.

## 8.1 Conclusões sobre os testes

A estratégia de **priorizar os testes pelos riscos** foi importante porque direcionou a análise para funcionalidades que poderiam causar mais problemas ao usuário, como pagamento, carrinho e checkout. Foi nessas áreas que encontramos alguns dos defeitos mais relevantes, entre eles:

- **BUG-003:** a API permite adicionar ao carrinho um produto sem estoque, embora a interface bloqueie essa ação.
- **BUG-005:** a verificação de pagamento aceita um método que não existe.
- **BUG-007:** o endereço informado pode ser substituído durante o checkout, afetando os dados da fatura.
- **BUG-008:** uma requisição permite consultar um favorito pertencente a outro usuário.

Na execução oficial local, realizada em **20/11/2026**, foram registrados **104 testes automatizados**: 77 de API, 25 de interface e 2 E2E. Desses, 93 passaram diretamente, 2 passaram após nova tentativa (*flaky*) e 9 apresentaram falhas esperadas por defeitos já conhecidos. **Não houve falhas inesperadas nessa execução.**

A cobertura das operações de API incluídas no escopo chegou a **79,2% (38 de 48)**, superando a meta de 60%. Os resultados mostram que os testes de API foram especialmente úteis para encontrar problemas nas regras do sistema. Já os testes de interface e E2E ajudaram a verificar o que acontece na prática durante o uso. No caso do BUG-007, por exemplo, foi importante conferir os dados da fatura no back-end, e não apenas o que aparecia na tela.

Mesmo com esses resultados, **não podemos dizer que o sistema está livre de falhas**. Os nove defeitos identificados continuam documentados e ainda não foram corrigidos na aplicação testada.

## 8.2 Critérios de saída

Ao comparar os resultados com os critérios definidos no [plano de testes](01-plano-de-testes.md), observamos que:

- A execução local atingiu a meta de **zero falhas inesperadas** na regressão automatizada.
- A taxa de testes *flaky* foi de **1,9% (2 de 104)**, abaixo do limite de 5%.
- A cobertura de operações de API em escopo (**79,2%**) superou a meta de 60%.
- Os **9 defeitos confirmados** possuem registros, evidências e testes associados.
- O pipeline do GitHub Actions foi implementado, mas sua validação remota ficou **parcial**, pois o Cloudflare bloqueou parte dos testes de interface e E2E. A solução para identificar esses bloqueios foi validada localmente, mas a documentação ainda apontava uma nova execução no GitHub como pendente.

Além disso, a documentação indica que a **execução manual dos casos e as sessões exploratórias feitas diretamente pela equipe** ainda precisam ser concluídas e registradas. Por isso, consideramos que os objetivos técnicos da automação foram alcançados em boa parte, mas nem todos os critérios de encerramento do projeto foram atendidos.

## 8.3 Lições aprendidas

Um dos principais aprendizados foi perceber que **um teste aprovado nem sempre significa que tudo está correto**. Alguns problemas só apareceram quando verificamos a resposta da API ou os dados que realmente foram gravados, em vez de confiar apenas na interface.

Também vimos a importância de **conferir os próprios testes**. Durante o desenvolvimento, um teste com *mock* chegou a passar sem verificar corretamente o cenário esperado. Isso mostrou que uma asserção mal construída pode dar uma falsa sensação de segurança.

Outra dificuldade foi trabalhar com um **sistema público, fora do nosso controle**. Houve lentidão, mudanças nos identificadores dos produtos (*re-seed*) e bloqueios de acesso no ambiente de CI. Foi necessário adaptar os testes para buscar dados atualizados, esperar pelas respostas corretas e distinguir problemas do ambiente de defeitos reais da aplicação.

Por fim, entendemos que **testes automatizados e exploratórios se complementam**. A automação ajuda a repetir os cenários e acompanhar regressões; a exploração ajuda a encontrar situações que ainda não tinham sido previstas. Os resultados precisam ser analisados, e não apenas contabilizados.

## 8.4 Limitações

O trabalho teve algumas limitações que devem ser consideradas ao interpretar os resultados:

- **Ambiente compartilhado:** não controlamos os dados, as atualizações nem a disponibilidade do sistema testado.
- **Cobertura:** os 79,2% correspondem às operações de API em escopo, **não à cobertura do código-fonte** da aplicação.
- **Navegadores e dispositivos:** a automação da interface foi realizada no Chromium, sem uma avaliação completa em outros navegadores ou dispositivos móveis.
- **CI/CD:** o Cloudflare impediu a execução remota de parte dos fluxos de interface e E2E.
- **Correção dos defeitos:** os problemas foram registrados, mas não alteramos o código do sistema testado.
- **Execução manual:** os casos MT-05, MT-10, MT-11 e MT-14 não foram executados (ver a [rastreabilidade do projeto](10-rastreabilidade-e-auditoria.md)).

Essas limitações não anulam os resultados, mas deixam claro **até onde as conclusões podem ser aplicadas**.

## 8.5 Considerações finais e melhorias futuras

De modo geral, o projeto permitiu aplicar técnicas de teste, acompanhar defeitos e avaliar a qualidade de um sistema real. A combinação de testes de API, interface e E2E trouxe uma visão mais completa do que seria possível usando apenas uma dessas abordagens.

Se o trabalho fosse ampliado, os próximos passos seriam executar os testes em um ambiente local controlado, ampliar a cobertura para outros navegadores, concluir as atividades manuais da equipe e validar novamente o pipeline no GitHub Actions. Também seria importante encaminhar os defeitos aos responsáveis pelo sistema e repetir os testes depois das correções.

**Não recomendaríamos liberar a versão avaliada sem antes tratar os defeitos de maior impacto**, principalmente os relacionados a pagamento, estoque e endereço. A principal conclusão é que testar não consiste apenas em obter resultados positivos: também é necessário entender os riscos, verificar as evidências e reconhecer o que ainda não foi validado.
