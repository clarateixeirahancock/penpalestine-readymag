const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Your product(s)
const PRODUCTS = {
  theydidntknowwewereseeds: { price: "price_1SltMXLp5l1JmABsZREYzvaM" }
};

// All shipping rates (UK + Worldwide)
const SHIPPING_RATES = [
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

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      shipping_options: SHIPPING_RATES,
      success_url: "https://your-site.com/success", // placeholder
      cancel_url: "https://your-site.com/cancel"    // placeholder
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };

  } catch (err) {
    console.error("Checkout error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
