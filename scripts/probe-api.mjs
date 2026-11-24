// Fase 1: sondagem exploratória da API. Registra requisição + status + trecho da resposta.
import fs from 'node:fs';
const A = 'https://api.practicesoftwaretesting.com';
const log = [];
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
async function call(label, method, path, body, headers = {}) {
  await sleep(400); // evita sobrecarregar o ambiente público compartilhado
  let r, t;
  for (let i = 0; i < 3 && !r; i++) {
    try {
      r = await fetch(A + path, { method, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });
      t = await r.text();
    } catch (e) { r = undefined; console.log(`   (falha de rede, tentativa ${i + 1}: ${e.cause?.code || e.message})`); await sleep(3000); }
  }
  if (!r) { log.push({ label, method, path, erro: 'falha de rede após 3 tentativas' }); console.log(`[ERR] ${label}`); return { status: 0, json: null }; }
  log.push({ label, method, path, body, status: r.status, resp: t.slice(0, 400) });
  console.log(`[${r.status}] ${label} :: ${t.slice(0, 220).replace(/\s+/g, ' ')}`);
  try { return { status: r.status, json: JSON.parse(t) }; } catch { return { status: r.status, json: null }; }
}
const p = await call('lista produtos', 'GET', '/products');
console.log('   total=', p.json.total, 'per_page=', p.json.per_page, 'last_page=', p.json.last_page);
await call('pagina 0', 'GET', '/products?page=0');
await call('pagina -1', 'GET', '/products?page=-1');
await call('pagina alem do fim', 'GET', '/products?page=999');
await call('pagina texto', 'GET', '/products?page=abc');
await call('sort price asc', 'GET', '/products?sort=price,asc');
await call('sort invalido', 'GET', '/products?sort=foo,bar');
await call('between price 10-20', 'GET', '/products?between=price,10,20');
await call('between invertido 20-10', 'GET', '/products?between=price,20,10');
await call('between negativo', 'GET', '/products?between=price,-5,-1');
await call('busca thor', 'GET', '/products/search?q=thor');
await call('busca vazia', 'GET', '/products/search?q=');
await call('busca sem resultado', 'GET', '/products/search?q=zzzzzzzz');
await call('busca SQL-like', 'GET', "/products/search?q=" + encodeURIComponent("' OR 1=1 --"));
await call('produto inexistente (ULID valido)', 'GET', '/products/01AAAAAAAAAAAAAAAAAAAAAAAA');
await call('produto id invalido', 'GET', '/products/abc');
await call('related', 'GET', '/products/01M7XC56PE2A3HM6VQJDSCYSHQ/related');
await call('categoria inexistente', 'GET', '/categories/tree/01AAAAAAAAAAAAAAAAAAAAAAAA');
// carrinho
const c = await call('cria carrinho', 'POST', '/carts');
const id = c.json?.id;
await call('add qty 1', 'POST', `/carts/${id}`, { product_id: '01M7XC56PE2A3HM6VQJDSCYSHQ', quantity: 1 });
await call('add qty 0', 'POST', `/carts/${id}`, { product_id: '01M7XC56PGCRPYYAAYQ9A2BPXV', quantity: 0 });
await call('add qty -1', 'POST', `/carts/${id}`, { product_id: '01M7XC56PGCRPYYAAYQ9A2BPXV', quantity: -1 });
await call('add qty 1000000', 'POST', `/carts/${id}`, { product_id: '01M7XC56PJ7YBFA7E08QS8P1N2', quantity: 1000000 });
await call('add qty decimal', 'POST', `/carts/${id}`, { product_id: '01M7XC56PJ7YBFA7E08QS8P1N2', quantity: 1.5 });
await call('add produto inexistente', 'POST', `/carts/${id}`, { product_id: '01AAAAAAAAAAAAAAAAAAAAAAAA', quantity: 1 });
await call('add out-of-stock (Long Nose Pliers)', 'POST', `/carts/${id}`, { product_id: '01M7XC56PMV40G7HKEPVECHFZ4', quantity: 1 });
await call('ver carrinho', 'GET', `/carts/${id}`);
await call('update qty -> 3', 'PUT', `/carts/${id}/product/quantity`, { product_id: '01M7XC56PE2A3HM6VQJDSCYSHQ', quantity: 3 });
await call('update qty -> 0', 'PUT', `/carts/${id}/product/quantity`, { product_id: '01M7XC56PE2A3HM6VQJDSCYSHQ', quantity: 0 });
await call('ver carrinho 2', 'GET', `/carts/${id}`);
await call('carrinho inexistente', 'GET', '/carts/01AAAAAAAAAAAAAAAAAAAAAAAA');
// auth
await call('login senha errada', 'POST', '/users/login', { email: 'naoexiste@example.com', password: 'Errada#123' });
await call('login corpo vazio', 'POST', '/users/login', {});
await call('me sem token', 'GET', '/users/me');
await call('me token invalido', 'GET', '/users/me', null, { Authorization: 'Bearer abc.def.ghi' });
await call('register vazio', 'POST', '/users/register', {});
await call('register senha fraca', 'POST', '/users/register', { first_name: 'Qa', last_name: 'Probe', email: `qa.probe.${Date.now()}@example.com`, password: 'abc', dob: '1990-01-01', address: { street: 'Rua 1', city: 'Natal', state: 'RN', country: 'BR', postal_code: '59000000' }, phone: '84999999999' });
await call('register menor de idade', 'POST', '/users/register', { first_name: 'Qa', last_name: 'Probe', email: `qa.probe.${Date.now()}@example.com`, password: 'Sup3r$ecretQA!', dob: '2015-01-01', address: { street: 'Rua 1', city: 'Natal', state: 'RN', country: 'BR', postal_code: '59000000' }, phone: '84999999999' });
await call('register email invalido', 'POST', '/users/register', { first_name: 'Qa', last_name: 'Probe', email: 'nao-e-email', password: 'Sup3r$ecretQA!', dob: '1990-01-01' });
await call('payment check cc invalido', 'POST', '/payment/check', { payment_method: 'credit-card', payment_details: { credit_card_number: '1234', expiration_date: '01/2020', cvv: '1', card_holder_name: 'X' } });
await call('payment check metodo invalido', 'POST', '/payment/check', { payment_method: 'bitcoin', payment_details: {} });
await call('payment check cod', 'POST', '/payment/check', { payment_method: 'cash-on-delivery', payment_details: {} });
await call('contato vazio', 'POST', '/messages', {});
await call('metodo nao permitido', 'DELETE', '/products');
fs.writeFileSync('evidencias/fase1-api/sondagem-api.json', JSON.stringify({ executado_em: new Date().toISOString(), resultados: log }, null, 2));
