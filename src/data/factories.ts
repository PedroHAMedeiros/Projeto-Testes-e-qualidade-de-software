/**
 * Fábricas de dados de teste: geram dados únicos a cada execução para manter os testes independentes
 * (evita conflito de e-mail duplicado e dependência de contas compartilhadas do ambiente público).
 */
export interface NewUser {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  dob: string;
  phone: string;
  address: { street: string; house_number: string; city: string; state: string; country: string; postal_code: string };
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  const id = uid();
  return {
    first_name: 'Qa',
    last_name: 'Tester',
    email: `qa.tqs.${id}@example.com`,
    // Senha gerada a cada execução (não é credencial real); atende à política da API:
    // >= 8 caracteres, maiúscula, minúscula, número e símbolo.
    password: `Tq#${id}Aa1!`,
    dob: '1995-05-20',
    phone: '84999990000',
    address: { street: 'Rua das Flores', house_number: '100', city: 'Natal', state: 'RN', country: 'BR', postal_code: '59000000' },
    ...overrides,
  };
}

/** Data (YYYY-MM-DD) de exatamente N anos atrás, deslocada em `days` dias. Usada nos testes de fronteira de idade. */
export function dateYearsAgo(years: number, days = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
