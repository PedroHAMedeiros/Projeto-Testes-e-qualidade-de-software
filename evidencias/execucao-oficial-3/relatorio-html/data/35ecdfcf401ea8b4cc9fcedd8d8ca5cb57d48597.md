# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api\auth.api.spec.ts >> API · Cadastro e autenticação >> API-AUTH-05b idade acima de 75 anos deve ser rejeitada @boundary @known-defect
- Location: tests\api\auth.api.spec.ts:59:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 422
Received: 201
```

# Test source

```ts
  1   | import { test, expect } from '../../src/fixtures/test-fixtures';
  2   | import { buildUser, dateYearsAgo } from '../../src/data/factories';
  3   | 
  4   | /**
  5   |  * Cadastro e autenticação via API. Requisitos RF-07 (cadastro), RF-08 (login/sessão) e RN-02 (idade 18..75), RN-03 (política de senha).
  6   |  */
  7   | test.describe('API · Cadastro e autenticação', () => {
  8   |   test('API-AUTH-01 cadastro válido retorna 201 sem expor a senha @smoke @regression', async ({ api }) => {
  9   |     const user = buildUser();
  10  |     const res = await api.register(user);
  11  |     expect(res.status()).toBe(201);
  12  |     const body = await res.json();
  13  |     expect(body).toMatchObject({ email: user.email, first_name: user.first_name });
  14  |     expect(body).not.toHaveProperty('password');
  15  |   });
  16  | 
  17  |   test('API-AUTH-02 e-mail duplicado é rejeitado com 409 Conflict @negative @regression', async ({ api, registeredUser }) => {
  18  |     const res = await api.register(buildUser({ email: registeredUser.email }));
  19  |     // Contrato OpenAPI documenta 409 para este caso (a 1ª versão deste teste esperava 422 — erro do teste, corrigido).
  20  |     expect(res.status()).toBe(409);
  21  |     expect(await res.json()).toHaveProperty('email');
  22  |   });
  23  | 
  24  |   test('API-AUTH-03 campos obrigatórios ausentes @negative @regression', async ({ api }) => {
  25  |     const res = await api.register({});
  26  |     expect(res.status()).toBe(422);
  27  |     expect(Object.keys(await res.json())).toEqual(expect.arrayContaining(['first_name', 'last_name', 'email', 'password']));
  28  |   });
  29  | 
  30  |   // Particionamento de equivalência da política de senha (RN-03): cada classe inválida viola uma única regra.
  31  |   const invalidPasswords: Array<[string, string]> = [
  32  |     ['Ab1!xyz', 'menos de 8 caracteres'],
  33  |     ['abcdefg1!', 'sem maiúscula'],
  34  |     ['ABCDEFG1!', 'sem minúscula'],
  35  |     ['Abcdefgh!', 'sem número'],
  36  |     ['Abcdefgh1', 'sem símbolo'],
  37  |   ];
  38  |   for (const [password, why] of invalidPasswords) {
  39  |     test(`API-AUTH-04 senha inválida (${why}) é rejeitada @negative @regression`, async ({ api }) => {
  40  |       const res = await api.register(buildUser({ password }));
  41  |       expect(res.status()).toBe(422);
  42  |       expect(await res.json()).toHaveProperty('password');
  43  |     });
  44  |   }
  45  | 
  46  |   // Análise de valor-limite da idade (RN-02: entre 18 e 75 anos, segundo a documentação do contrato).
  47  |   const ages: Array<[string, string, boolean]> = [
  48  |     ['17 anos e 364 dias', dateYearsAgo(18, 1), false],
  49  |     ['18 anos e 1 dia', dateYearsAgo(18, -1), true],
  50  |     ['75 anos menos 1 dia', dateYearsAgo(75, 1), true],
  51  |   ];
  52  |   for (const [label, dob, ok] of ages) {
  53  |     test(`API-AUTH-05 idade ${label} (dob=${dob}) → ${ok ? 'aceita' : 'rejeitada'} @boundary @regression`, async ({ api }) => {
  54  |       const res = await api.register(buildUser({ dob }));
  55  |       expect(res.status(), await res.text()).toBe(ok ? 201 : 422);
  56  |     });
  57  |   }
  58  | 
  59  |   test('API-AUTH-05b idade acima de 75 anos deve ser rejeitada @boundary @known-defect', async ({ api }) => {
  60  |     test.info().annotations.push({ type: 'defect', description: 'BUG-006 — limite superior de idade efetivo é 93 anos (Carbon mutável)' });
  61  |     test.fail(true, 'BUG-006 aberto: dob de 75 anos e 1 dia é aceita (201).');
  62  |     const res = await api.register(buildUser({ dob: dateYearsAgo(75, -1) }));
> 63  |     expect(res.status()).toBe(422);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  64  |   });
  65  | 
  66  |   test('API-AUTH-05c limite efetivo atual: 93 anos é rejeitado (documenta o comportamento real) @boundary @regression', async ({ api }) => {
  67  |     // Teste de caracterização: fixa o comportamento atual para detectar mudanças (útil na análise de impacto da correção do BUG-006).
  68  |     const res = await api.register(buildUser({ dob: dateYearsAgo(93, -1) })); // 93 anos e 1 dia (margem contra diferença de fuso UTC × servidor)
  69  |     expect(res.status()).toBe(422);
  70  |     expect((await res.json()).dob).toEqual(['Customer must be younger than 75 years old.']);
  71  |   });
  72  | 
  73  |   test('API-AUTH-06 login válido retorna token JWT e /users/me identifica o usuário @smoke @regression', async ({ api, registeredUser }) => {
  74  |     expect(registeredUser.token.split('.')).toHaveLength(3); // formato JWT header.payload.assinatura
  75  |     const me = await api.withToken(registeredUser.token).me();
  76  |     expect(me.status()).toBe(200);
  77  |     expect((await me.json()).email).toBe(registeredUser.email);
  78  |   });
  79  | 
  80  |   test('API-AUTH-07 login com senha errada retorna 401 @negative @regression', async ({ api, registeredUser }) => {
  81  |     const res = await api.login(registeredUser.email, registeredUser.password + 'x');
  82  |     expect(res.status()).toBe(401);
  83  |   });
  84  | 
  85  |   for (const [label, token] of [['sem token', undefined], ['token malformado', 'abc.def.ghi']] as const) {
  86  |     test(`API-AUTH-08 rota protegida ${label} retorna 401 @negative @regression`, async ({ api }) => {
  87  |       const res = await api.withToken(token).me();
  88  |       expect(res.status()).toBe(401);
  89  |     });
  90  |   }
  91  | 
  92  |   test('API-AUTH-09 logout invalida o token @regression', async ({ api, registeredUser }) => {
  93  |     const client = api.withToken(registeredUser.token);
  94  |     expect((await client.logout()).status()).toBe(200);
  95  |     expect((await client.me()).status()).toBe(401);
  96  |   });
  97  | 
  98  |   test('API-AUTH-10 cadastro com e-mail em formato inválido deve ser rejeitado @negative @known-defect', async ({ api }) => {
  99  |     test.info().annotations.push({ type: 'defect', description: 'BUG-004 — API aceita e-mail sem formato válido no cadastro' });
  100 |     test.fail(true, 'BUG-004 aberto: POST /users/register aceita "nao-e-email" (201).');
  101 |     const res = await api.register(buildUser({ email: `nao-e-email-${Date.now()}` }));
  102 |     expect(res.status()).toBe(422);
  103 |   });
  104 | });
  105 | 
```