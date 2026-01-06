// netlify/functions/create-checkout.js
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Products with weights
const PRODUCTS = {
  theydidntknowwewereseeds: { price: "price_1SltMXLp5l1JmABsZREYzvaM", weight: 0.05 },
  another_product: { price: "price_XXXX", weight: 0.1 } // add more if needed
};

// Shipping rates
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
    const { items, shipping_country } = JSON.parse(event.body || "{}");

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
      totalWeight += product.weight * item.quantity;
    });

    // Pick the right shipping rate for the country
    const country = shipping_country === "GB" ? "GB" : "WW";
    let shippingOption = SHIPPING_RATES[country].find(rate => totalWeight <= rate.maxWeight);
    if (!shippingOption) shippingOption = SHIPPING_RATES[country][SHIPPING_RATES[country].length - 1]; // fallback

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      shipping_options: [{ shipping_rate: shippingOption.rate }],
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
