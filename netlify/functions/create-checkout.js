const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Products with weights
const PRODUCTS = {
  theydidntknowwewereseeds: { price: "price_1SltMXLp5l1JmABsZREYzvaM", weight: 0.05 }
};

// Shipping rates
const SHIPPING_RATES = [
  { maxWeight: 0.05, rate: "shr_1SmepTLp5l1JmABsJzFF773I", countries: ["GB"] },
  { maxWeight: 0.10, rate: "shr_1Smes2Lp5l1JmABs2eSRdmI9", countries: ["GB"] },
  { maxWeight: 0.20, rate: "shr_1SmgR0Lp5l1JmABsJVkE4raC", countries: ["GB"] },
  { maxWeight: 0.05, rate: "shr_1Smeq6Lp5l1JmABsxxy2qNRv", countries: [] }, // worldwide
  { maxWeight: 0.10, rate: "shr_1SmgQgLp5l1JmABssFDuJ3Nn", countries: [] },
  { maxWeight: 0.20, rate: "shr_1SmgRJLp5l1JmABsc7qmBqit", countries: [] }
];

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const { items } = JSON.parse(event.body || "{}");
    if (!items || items.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No items sent" }) };
    }

    // Build line items
    const line_items = items.map(item => {
      const product = PRODUCTS[item.id];
      if (!product) throw new Error(`Unknown product: ${item.id}`);
      return { price: product.price, quantity: item.quantity };
    });

    // Total weight
    let totalWeight = 0;
    items.forEach(item => {
      totalWeight += PRODUCTS[item.id].weight * item.quantity;
    });

    // Pick only shipping options that match the weight (max 5)
    const shipping_options = SHIPPING_RATES
      .filter(rate => totalWeight <= rate.maxWeight)
      .slice(0, 5) // ensures max 5
      .map(rate => ({ shipping_rate: rate.rate }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      shipping_options,
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
