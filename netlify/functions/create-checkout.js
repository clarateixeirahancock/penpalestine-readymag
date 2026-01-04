const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = {
  theydidntknowwewereseeds: {
    price: "price_1SltMXLp5l1JmABsZREYzvaM"
  }
};

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    const { items } = JSON.parse(event.body || "{}");

    if (!items || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No items sent" })
      };
    }

    const line_items = items.map((item) => {
      const product = PRODUCTS[item.id];
      if (!product) {
        throw new Error(`Unknown product: ${item.id}`);
      }

      return {
        price: product.price,
        quantity: item.quantity
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

