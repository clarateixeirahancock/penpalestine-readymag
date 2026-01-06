const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = {
  theydidntknowwewereseeds: {
    price: "price_1SltMXLp5l1JmABsZREYzvaM",
    weight: 0.05 // kg (10 postcards)
  }
};

// Replace ALL of these with REAL Stripe shipping_rate IDs
const SHIPPING_RATES = {
  GB: [
    { maxWeight: 0.05, rate: "shr_GB_10" },
    { maxWeight: 0.10, rate: "shr_GB_20" },
    { maxWeight: 0.20, rate: "shr_GB_40" }
  ],
  WW: [
    { maxWeight: 0.05, rate: "shr_WW_10" },
    { maxWeight: 0.10, rate: "shr_WW_20" },
    { maxWeight: 0.20, rate: "shr_WW_40" }
  ]
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
    const { items, shipping_country = "GB" } = JSON.parse(event.body || "{}");

    if (!items || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No items sent" })
      };
    }

    let totalWeight = 0;

    const line_items = items.map(item => {
      const product = PRODUCTS[item.id];
      if (!product) throw new Error(`Unknown product: ${item.id}`);
      totalWeight += product.weight * item.quantity;

      return {
        price: product.price,
        quantity: item.quantity
      };
    });

    const rates = SHIPPING_RATES[shipping_country === "GB" ? "GB" : "WW"];
    const shipping = rates.find(r => totalWeight <= r.maxWeight);

    if (!shipping) {
      throw new Error("No valid shipping rate found");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      shipping_options: [
        { shipping_rate: shipping.rate }
      ],
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
