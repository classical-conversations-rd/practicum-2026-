const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Metodo no permitido' }) };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const a = Math.max(0, parseInt(body.adults, 10) || 0);
    const k = Math.max(0, parseInt(body.kids, 10) || 0);
    const l = Math.max(0, parseInt(body.lunch, 10) || 0);
    if (a + k + l === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Selecciona al menos una boleta.' }) };
    }

    const line_items = [];
    if (a > 0) line_items.push({ price: process.env.PRICE_ADULTO, quantity: a });
    if (k > 0) line_items.push({ price: process.env.PRICE_NINO, quantity: k });
    if (l > 0) line_items.push({ price: process.env.PRICE_ALMUERZO, quantity: l });

    const base = process.env.URL || ('https://' + event.headers.host);
    const success_url = process.env.SUCCESS_URL || (base + '/?pago=exito');
    const cancel_url = process.env.CANCEL_URL || (base + '/?pago=cancelado#boletas');

    const params = {
      mode: 'payment',
      locale: 'es',
      line_items: line_items,
      phone_number_collection: { enabled: true },
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: { adults: String(a), kids: String(k), lunch: String(l) },
    };

    // Discount handling:
    // - If a promo code arrives via ?promo= (forwarded from the front-end) and it
    //   matches an active promotion code in Stripe, apply it automatically so the
    //   discount is already reflected when checkout opens.
    // - Otherwise show Stripe's "add promotion code" field so customers can type it
    //   in manually (e.g. CCRD2026). Stripe does not allow both in the same session.
    const promo = String(body.promo || '').trim();
    let applied = false;
    if (promo) {
      const found = await stripe.promotionCodes.list({ code: promo, active: true, limit: 1 });
      if (found.data.length) {
        params.discounts = [{ promotion_code: found.data[0].id }];
        params.metadata.promo = promo;
        applied = true;
      }
    }
    if (!applied) {
      params.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(params);
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
