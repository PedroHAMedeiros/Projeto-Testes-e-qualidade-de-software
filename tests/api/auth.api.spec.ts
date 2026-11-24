import { test, expect } from '../../src/fixtures/test-fixtures';
import { buildUser, dateYearsAgo } from '../../src/data/factories';

/**
 * Cadastro e autenticação via API. Requisitos RF-07 (cadastro), RF-08 (login/sessão) e RN-02 (idade 18..75), RN-03 (política de senha).
 */
test.describe('API · Cadastro e autenticação', () => {
  test('API-AUTH-01 cadastro válido retorna 201 sem expor a senha @smoke @regression', async ({ api }) => {
    const user = buildUser();
    const res = await api.register(user);
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ email: user.email, first_name: user.first_name });
    expect(body).not.toHaveProperty('password');
  });

  test('API-AUTH-02 e-mail duplicado é rejeitado com 409 Conflict @negative @regression', async ({ api, registeredUser }) => {
    const res = await api.register(buildUser({ email: registeredUser.email }));
    // Contrato OpenAPI documenta 409 para este caso (a 1ª versão deste teste esperava 422 — erro do teste, corrigido).
    expect(res.status()).toBe(409);
    expect(await res.json()).toHaveProperty('email');
  });

  test('API-AUTH-03 campos obrigatórios ausentes @negative @regression', async ({ api }) => {
    const res = await api.register({});
    expect(res.status()).toBe(422);
    expect(Object.keys(await res.json())).toEqual(expect.arrayContaining(['first_name', 'last_name', 'email', 'password']));
  });

  // Particionamento de equivalência da política de senha (RN-03): cada classe inválida viola uma única regra.
  const invalidPasswords: Array<[string, string]> = [
    ['Ab1!xyz', 'menos de 8 caracteres'],
    ['abcdefg1!', 'sem maiúscula'],
    ['ABCDEFG1!', 'sem minúscula'],
    ['Abcdefgh!', 'sem número'],
    ['Abcdefgh1', 'sem símbolo'],
  ];
  for (const [password, why] of invalidPasswords) {
    test(`API-AUTH-04 senha inválida (${why}) é rejeitada @negative @regression`, async ({ api }) => {
      const res = await api.register(buildUser({ password }));
      expect(res.status()).toBe(422);
      expect(await res.json()).toHaveProperty('password');
    });
  }

  // Análise de valor-limite da idade (RN-02: entre 18 e 75 anos, segundo a documentação do contrato).
  const ages: Array<[string, string, boolean]> = [
    ['17 anos e 364 dias', dateYearsAgo(18, 1), false],
    ['18 anos e 1 dia', dateYearsAgo(18, -1), true],
    ['75 anos menos 1 dia', dateYearsAgo(75, 1), true],
  ];
  for (const [label, dob, ok] of ages) {
    test(`API-AUTH-05 idade ${label} (dob=${dob}) → ${ok ? 'aceita' : 'rejeitada'} @boundary @regression`, async ({ api }) => {
      const res = await api.register(buildUser({ dob }));
      expect(res.status(), await res.text()).toBe(ok ? 201 : 422);
    });
  }

  test('API-AUTH-05b idade acima de 75 anos deve ser rejeitada @boundary @known-defect', async ({ api }) => {
    test.info().annotations.push({ type: 'defect', description: 'BUG-006 — limite superior de idade efetivo é 93 anos (Carbon mutável)' });
    test.fail(true, 'BUG-006 aberto: dob de 75 anos e 1 dia é aceita (201).');
    const res = await api.register(buildUser({ dob: dateYearsAgo(75, -1) }));
    expect(res.status()).toBe(422);
  });

  test('API-AUTH-05c limite efetivo atual: 93 anos é rejeitado (documenta o comportamento real) @boundary @regression', async ({ api }) => {
    // Teste de caracterização: fixa o comportamento atual para detectar mudanças (útil na análise de impacto da correção do BUG-006).
    const res = await api.register(buildUser({ dob: dateYearsAgo(93, -1) })); // 93 anos e 1 dia (margem contra diferença de fuso UTC × servidor)
    expect(res.status()).toBe(422);
    expect((await res.json()).dob).toEqual(['Customer must be younger than 75 years old.']);
  });

  test('API-AUTH-06 login válido retorna token JWT e /users/me identifica o usuário @smoke @regression', async ({ api, registeredUser }) => {
    expect(registeredUser.token.split('.')).toHaveLength(3); // formato JWT header.payload.assinatura
    const me = await api.withToken(registeredUser.token).me();
    expect(me.status()).toBe(200);
    expect((await me.json()).email).toBe(registeredUser.email);
  });

  test('API-AUTH-07 login com senha errada retorna 401 @negative @regression', async ({ api, registeredUser }) => {
    const res = await api.login(registeredUser.email, registeredUser.password + 'x');
    expect(res.status()).toBe(401);
  });

  for (const [label, token] of [['sem token', undefined], ['token malformado', 'abc.def.ghi']] as const) {
    test(`API-AUTH-08 rota protegida ${label} retorna 401 @negative @regression`, async ({ api }) => {
      const res = await api.withToken(token).me();
      expect(res.status()).toBe(401);
    });
  }

  test('API-AUTH-09 logout invalida o token @regression', async ({ api, registeredUser }) => {
    const client = api.withToken(registeredUser.token);
    expect((await client.logout()).status()).toBe(200);
    expect((await client.me()).status()).toBe(401);
  });

  test('API-AUTH-10 cadastro com e-mail em formato inválido deve ser rejeitado @negative @known-defect', async ({ api }) => {
    test.info().annotations.push({ type: 'defect', description: 'BUG-004 — API aceita e-mail sem formato válido no cadastro' });
    test.fail(true, 'BUG-004 aberto: POST /users/register aceita "nao-e-email" (201).');
    const res = await api.register(buildUser({ email: `nao-e-email-${Date.now()}` }));
    expect(res.status()).toBe(422);
  });
});
