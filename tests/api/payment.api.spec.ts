import { test, expect } from '../../src/fixtures/test-fixtures';

/** Validação de pagamento (RF-09). Não cria pedidos: /payment/check apenas valida os dados. */
test.describe('API · Pagamento', () => {
  const validCard = { credit_card_number: '1111-2222-3333-4444', expiration_date: '12/2035', cvv: '123', card_holder_name: 'Qa Tester' };

  test('API-PAY-01 cartão válido é aceito @smoke @regression', async ({ api }) => {
    const res = await api.paymentCheck('credit-card', validCard);
    expect(res.status()).toBe(200);
    expect((await res.json()).message).toBe('Payment was successful');
  });

  test('API-PAY-02 pagamento na entrega não exige detalhes @regression', async ({ api }) => {
    expect((await api.paymentCheck('cash-on-delivery')).status()).toBe(200);
  });

  // Tabela de decisão: um campo inválido por vez, demais válidos.
  const invalidCards: Array<[string, Record<string, string>]> = [
    ['número fora do padrão 0000-0000-0000-0000', { credit_card_number: '1234' }],
    ['cartão vencido', { expiration_date: '01/2020' }],
    ['CVV com 2 dígitos', { cvv: '12' }],
    ['titular com dígitos', { card_holder_name: 'Qa 123' }],
  ];
  for (const [why, override] of invalidCards) {
    test(`API-PAY-03 cartão inválido: ${why} @negative @regression`, async ({ api }) => {
      const res = await api.paymentCheck('credit-card', { ...validCard, ...override });
      expect(res.status()).toBe(422);
      expect(Object.keys((await res.json()).errors)).toEqual([`payment_details.${Object.keys(override)[0]}`]);
    });
  }

  test('API-PAY-04 método de pagamento fora da lista deve ser rejeitado @negative @known-defect', async ({ api }) => {
    test.info().annotations.push({ type: 'defect', description: 'BUG-005 — /payment/check aprova método inexistente' });
    test.fail(true, 'BUG-005 aberto: payment_method="bitcoin" retorna 200 "Payment was successful".');
    const res = await api.paymentCheck('bitcoin', {});
    expect(res.status()).toBe(422);
  });
});
