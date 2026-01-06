const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Your product(s) with Stripe price IDs
const PRODUCTS = {
  theydidntknowwewereseeds: { price: "price_1SltMXLp5l1JmABsZREYzvaM" }
};

// Shipping rates
const shipping_options = [
  { shipping_rate: "shr_1SmepTLp5l1JmABsJzFF773I" }, // 10 postcards UK
  { shipping_rate: "shr_1Smes2Lp5l1JmABs2eSRdmI9" }, // 20 postcards UK
  { shipping_rate: "shr_1SmgR0Lp5l1JmABsJVkE4raC" }, // 40 postcards UK
  { shipping_rate: "shr_1Smeq6Lp5l1JmABsxxy2qNRv" }, // 10 postcards WW
  { shipping_rate: "shr_1SmgQgLp5l1JmABssFDuJ3Nn" }, // 20 postcards WW
  { shipping_rate: "shr_1SmgRJLp5l1JmABsc7qmBqit" }  // 40 postcards WW
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

    // Calculate total weight
    let totalWeight = 0;
    items.forEach(item => {
      const product = PRODUCTS[item.id];
      totalWeight += (product.weight || 0.05) * item.quantity; // default 0.05kg if weight missing
    });

    // We send all shipping rates to Stripe; Stripe picks automatically based on address
    const shipping_options = [
      ...SHIPPING_RATES.GB.map(r => ({ shipping_rate: r.rate })),
      ...SHIPPING_RATES.WW.map(r => ({ shipping_rate: r.rate }))
    ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      shipping_options,
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };

  } catch (err) {
    console.error("Checkout error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
