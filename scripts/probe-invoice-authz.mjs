// Sondagem: autorização em faturas (usuário B tenta ler/buscar a fatura do usuário A).
const A = 'https://api.practicesoftwaretesting.com';
const j = async (m, p, body, token) => { const r = await fetch(A + p, { method: m, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); console.log(`[${r.status}] ${m} ${p} ${token ? '(token ' + token.slice(-6) + ')' : ''} :: ${t.slice(0, 200)}`); try { return JSON.parse(t); } catch { return null; } };
const mk = async (tag) => { const id = Date.now().toString(36) + tag; const u = { first_name: 'Qa', last_name: 'Authz', email: `qa.authz.${id}@example.com`, password: `Tq#${id}Aa1!`, dob: '1995-05-20' }; await j('POST', '/users/register', u); return (await j('POST', '/users/login', { email: u.email, password: u.password })).access_token; };
const ta = await mk('a'), tb = await mk('b');
const pid = (await (await fetch(A + '/products')).json()).data[0].id;
const cart = await j('POST', '/carts'); await j('POST', `/carts/${cart.id}`, { product_id: pid, quantity: 1 });
const inv = await j('POST', '/invoices', { billing_street: 'R. Horácio', billing_city: "Carmona d'Oeste", billing_state: 'Santa Catarina', billing_country: 'BR', billing_postal_code: '59000-000', payment_method: 'cash-on-delivery', payment_details: {}, cart_id: cart.id }, ta);
if (inv?.id) {
  await j('GET', `/invoices/${inv.id}`, null, ta);
  await j('GET', `/invoices/${inv.id}`, null, tb);
  await j('GET', `/invoices/search?q=${inv.invoice_number}`, null, tb);
  await j('GET', `/invoices/${inv.invoice_number}/download-pdf-status`, null, tb);
}
// Complemento: a busca falha também para o dono? (isola autorização × defeito da busca)
if (inv?.invoice_number) {
  await j('GET', `/invoices/search?q=${inv.invoice_number}`, null, ta);
  await j('GET', `/invoices/search?q=Carmona`, null, ta);
  await j('GET', `/invoices/search?q=${inv.invoice_number}`, null, tb);
}
