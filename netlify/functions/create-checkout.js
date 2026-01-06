const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = {
  theydidntknowwewereseeds: { price: "price_1SltMXLp5l1JmABsZREYzvaM", weight: 0.05 }
};

const SHIPPING_RATES = {
  GB: [
    { maxWeight: 0.05, rate: "shr_1SmepTLp5l1JmABsJzFF773I" },
    { maxWeight: 0.10, rate: "shr_1Smes2Lp5l1JmABs2eSRdmI9" },
    { maxWeight: 0.20, rate: "shr_1SmgR0Lp5l1JmABsJVkE4raC" }
  ],
  WW: [
    { maxWeight: 0.05, rate: "shr_1Smeq6Lp5l1JmABsxxy2qNRv" },
    { maxWeight: 0.10, rate: "shr_1SmgQgLp5l1JmABssFDuJ3Nn" },
    { maxWeight: 0.20, rate: "shr_1SmgRJLp5l1JmABsc7qmBqit" }
  ]
};

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const { items } = JSON.parse(event.body || "{}");
    if (!items || !items.length) return { statusCode: 400, headers, body: JSON.stringify({ error: "No items sent" }) };

    // Calculate total weight
    let totalWeight = 0;
    const line_items = items.map(item => {
      const product = PRODUCTS[item.id];
      if (!product) throw new Error(`Unknown product: ${item.id}`);
      totalWeight += product.weight * item.quantity;
      return { price: product.price, quantity: item.quantity };
    });

    // Filter shipping options by weight
    const shipping_options = [];
    Object.keys(SHIPPING_RATES).forEach(country => {
      SHIPPING_RATES[country].forEach(rate => {
        if (rate.maxWeight >= totalWeight) shipping_options.push({ shipping_rate: rate.rate });
      });
    });

    // Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      shipping_address_collection: { allowed_countries: ["GB","US","CA","AU","FR","DE"] },
      shipping_options,
      mode: "payment",
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
