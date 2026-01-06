// netlify/functions/create-checkout.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = {
  theydidntknowwewereseeds: { 
    price: "price_1SltMXLp5l1JmABsZREYzvaM", // your Stripe price ID
    weight: 0.05 // kg
  },
  // Add more products here if needed
};

// Shipping rates: only one option per country to avoid dropdown
const SHIPPING_RATES = {
  GB: "shr_1SmepTLp5l1JmABsJzFF773I",  // default UK rate
  WW: "shr_1Smeq6Lp5l1JmABsxxy2qNRv"   // default Worldwide rate
};

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const { items, country } = JSON.parse(event.body || "{}"); // country optional
    if (!items || !items.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No items sent" }) };
    }

    // Build line items and calculate total weight (optional)
    const line_items = items.map(item => {
      const product = PRODUCTS[item.id];
      if (!product) throw new Error(`Unknown product: ${item.id}`);
      return { price: product.price, quantity: item.quantity };
    });

    // Determine shipping based on country, default to GB
    const shippingRateId = country === "WW" ? SHIPPING_RATES.WW : SHIPPING_RATES.GB;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      shipping_options: [{ shipping_rate: shippingRateId }],
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
