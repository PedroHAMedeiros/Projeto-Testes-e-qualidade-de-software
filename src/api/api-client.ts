import { APIRequestContext, APIResponse } from '@playwright/test';
import { recordEndpoint } from './endpoint-recorder';
import { NewUser } from '../data/factories';

type Body = Record<string, unknown> | undefined;
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Cliente fino sobre o APIRequestContext do Playwright.
 * Centraliza URLs, cabeçalhos e token, evitando duplicação nos testes (reuso + manutenção em um único ponto).
 */
export class ApiClient {
  private token?: string;

  constructor(private readonly request: APIRequestContext, private readonly baseUrl: string) {}

  /**
   * Retorna um NOVO cliente autenticado com `token` (o original não muda).
   * Refatoração S-07: a 1ª versão alterava o próprio objeto (`this.token = token`) — o token "vazava" para chamadas
   * seguintes do mesmo teste, o que inviabilizaria testes com dois usuários (autorização).
   */
  withToken(token: string | undefined): ApiClient {
    const client = new ApiClient(this.request, this.baseUrl);
    client.token = token;
    return client;
  }

  async send(method: Method, path: string, data?: Body): Promise<APIResponse> {
    const url = this.baseUrl + path;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    // timeout de 45 s: cobre a cauda de latência medida no SUT (máx. observado ≈ 31 s)
    const res = await this.request.fetch(url, { method, data, headers, failOnStatusCode: false, timeout: 45_000 });
    recordEndpoint(method, url, 'api', res.status());
    return res;
  }

  // --- Produtos / catálogo ---
  listProducts(query = '') { return this.send('GET', `/products${query}`); }
  getProduct(id: string) { return this.send('GET', `/products/${id}`); }
  relatedProducts(id: string) { return this.send('GET', `/products/${id}/related`); }
  searchProducts(q: string) { return this.send('GET', `/products/search?q=${encodeURIComponent(q)}`); }
  categoriesTree() { return this.send('GET', '/categories/tree'); }
  brands() { return this.send('GET', '/brands'); }

  // --- Carrinho ---
  async createCart(): Promise<string> {
    const res = await this.send('POST', '/carts');
    if (res.status() !== 201) throw new Error(`Falha ao criar carrinho: HTTP ${res.status()}`);
    return (await res.json()).id;
  }
  addToCart(cartId: string, productId: string, quantity: unknown) {
    return this.send('POST', `/carts/${cartId}`, { product_id: productId, quantity });
  }
  updateQuantity(cartId: string, productId: string, quantity: unknown) {
    return this.send('PUT', `/carts/${cartId}/product/quantity`, { product_id: productId, quantity });
  }
  removeFromCart(cartId: string, productId: string) { return this.send('DELETE', `/carts/${cartId}/product/${productId}`); }
  getCart(cartId: string) { return this.send('GET', `/carts/${cartId}`); }
  deleteCart(cartId: string) { return this.send('DELETE', `/carts/${cartId}`); }

  // --- Usuários / autenticação ---
  register(user: Partial<NewUser> | Record<string, unknown>) { return this.send('POST', '/users/register', user as Body); }
  login(email: string, password: string) { return this.send('POST', '/users/login', { email, password }); }
  me() { return this.send('GET', '/users/me'); }
  logout() { return this.send('GET', '/users/logout'); }

  refresh() { return this.send('GET', '/users/refresh'); }
  changePassword(current_password: string, new_password: string) {
    return this.send('POST', '/users/change-password', { current_password, new_password, new_password_confirmation: new_password });
  }

  // --- Catálogo auxiliar ---
  categories() { return this.send('GET', '/categories'); }
  searchCategories(q: string) { return this.send('GET', `/categories/search?q=${encodeURIComponent(q)}`); }
  categoryTree(id: string) { return this.send('GET', `/categories/tree/${id}`); }
  brand(id: string) { return this.send('GET', `/brands/${id}`); }
  searchBrands(q: string) { return this.send('GET', `/brands/search?q=${encodeURIComponent(q)}`); }
  productSpecs(productId: string) { return this.send('GET', `/products/${productId}/specs`); }
  specNames() { return this.send('GET', '/product-specs/names'); }

  // --- Favoritos (exigem token) ---
  addFavorite(product_id: string) { return this.send('POST', '/favorites', { product_id }); }
  favorites() { return this.send('GET', '/favorites'); }
  favorite(id: string) { return this.send('GET', `/favorites/${id}`); }
  deleteFavorite(id: string) { return this.send('DELETE', `/favorites/${id}`); }

  // --- Endereço / faturas ---
  postcodeLookup(country: string, postcode: string, house_number = '1') {
    return this.send('GET', `/postcode-lookup?country=${country}&postcode=${encodeURIComponent(postcode)}&house_number=${house_number}`);
  }
  createInvoice(body: Record<string, unknown>) { return this.send('POST', '/invoices', body); }
  invoice(id: string) { return this.send('GET', `/invoices/${id}`); }
  searchInvoices(q: string) { return this.send('GET', `/invoices/search?q=${encodeURIComponent(q)}`); }

  // --- Pagamento / contato ---
  paymentCheck(payment_method: string, payment_details: Record<string, unknown> = {}) {
    return this.send('POST', '/payment/check', { payment_method, payment_details });
  }
  sendMessage(body: Record<string, unknown>) { return this.send('POST', '/messages', body); }
}
