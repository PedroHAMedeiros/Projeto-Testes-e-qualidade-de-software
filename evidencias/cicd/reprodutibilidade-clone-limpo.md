# Reprodutibilidade — clone limpo (2026-11-20T23:12:53Z)
- git clone do repositório local para pasta vazia
- npm ci: 105 pacotes em ~7 s
- npx tsc --noEmit: OK
- npx eslint . --max-warnings 10: OK
- npx playwright test --list: Total: 104 tests in 12 files
- Execução dos testes no clone: não feita (evita carga duplicada no SUT público; a execução oficial roda no repositório principal)
