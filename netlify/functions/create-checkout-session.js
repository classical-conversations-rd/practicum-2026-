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
                  const session = await stripe.checkout.sessions.create({
                      mode: 'payment',
                      locale: 'es',
                      line_items: line_items,
                      phone_number_collection: { enabled: true },
                      success_url: success_url,
                      cancel_url: cancel_url,
                      metadata: { adults: String(a), kids: String(k), lunch: String(l) },
                      });
                  return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
                  } catch (err) {
                    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
                  }
                };
                  
