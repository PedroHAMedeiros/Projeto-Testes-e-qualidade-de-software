// Sondagem 2: favoritos, faturas, refresh/troca de senha, contato e catálogo auxiliar (formato real das respostas).
const A = 'https://api.practicesoftwaretesting.com';
const j = async (m, p, body, token) => { const r = await fetch(A + p, { method: m, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); const t = await r.text(); console.log(`[${r.status}] ${m} ${p} :: ${t.slice(0, 260)}`); try { return JSON.parse(t); } catch { return null; } };
const mk = async (tag) => { const id = Date.now().toString(36) + tag; const u = { first_name: 'Qa', last_name: 'Probe', email: `qa.probe2.${id}@example.com`, password: `Tq#${id}Aa1!`, dob: '1995-05-20' }; await j('POST', '/users/register', u); const l = await j('POST', '/users/login', { email: u.email, password: u.password }); return { ...u, token: l.access_token }; };
const a = await mk('a'), b = await mk('b');
const prods = await (await fetch(A + '/products')).json(); const pid = prods.data[0].id;
const fav = await j('POST', '/favorites', { product_id: pid }, a.token);
await j('GET', '/favorites', null, a.token);
if (fav?.id) { await j('GET', `/favorites/${fav.id}`, null, b.token); await j('DELETE', `/favorites/${fav.id}`, null, b.token); await j('GET', `/favorites/${fav.id}`, null, a.token); }
const cart = await j('POST', '/carts'); await j('POST', `/carts/${cart.id}`, { product_id: pid, quantity: 1 });
const inv = await j('POST', '/invoices', { billing_street: 'Rua das Flores', billing_city: 'Natal', billing_state: 'RN', billing_country: 'BR', billing_postal_code: '59000-000', payment_method: 'cash-on-delivery', payment_details: {}, cart_id: cart.id }, a.token);
if (inv?.id) { await j('GET', `/invoices/${inv.id}`, null, a.token); await j('GET', `/invoices/${inv.id}`, null, b.token); await j('GET', `/invoices/search?q=${inv.invoice_number}`, null, a.token); await j('GET', `/invoices/search?q=${inv.invoice_number}`, null, b.token); }
await j('GET', '/users/refresh', null, a.token);
await j('GET', '/categories'); await j('GET', '/categories/search?q=pliers'); await j('GET', '/brands/search?q=forge');
const brands = await (await fetch(A + '/brands')).json(); await j('GET', `/brands/${brands[0].id}`);
await j('GET', `/products/${pid}/specs`); await j('GET', '/product-specs/names');
await j('POST', '/messages', { subject: 'website', message: 'x'.repeat(251), email: 'nao-e-email', name: 'Qa' });
