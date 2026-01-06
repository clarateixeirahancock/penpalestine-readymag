// netlify/functions/create-checkout.js
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Products with weights (kg)
const PRODUCTS = {
  theydidntknowwewereseeds: { price: "price_1SltMXLp5l1JmABsZREYzvaM", weight: 0.05 },
  another_product: { price: "price_XXXX", weight: 0.1 } // add more products if needed
};

// Shipping rates
const SHIPPING_RATES = [
  { maxWeight: 0.05, countries: ["GB"], rate: "shr_1SmepTLp5l1JmABsJzFF773I" },   // 10 postcards UK
  { maxWeight: 0.10, countries: ["GB"], rate: "shr_1Smes2Lp5l1JmABs2eSRdmI9" },  // 20 postcards UK
  { maxWeight: 0.20, countries: ["GB"], rate: "shr_1SmgR0Lp5l1JmABsJVkE4raC" },  // 40 postcards UK
  { maxWeight: 0.05, countries: [], rate: "shr_1Smeq6Lp5l1JmABsxxy2qNRv" },      // 10 postcards Worldwide
  { maxWeight: 0.10, countries: [], rate: "shr_1SmgQgLp5l1JmABssFDuJ3Nn" },      // 20 postcards Worldwide
  { maxWeight: 0.20, countries: [], rate: "shr_1SmgRJLp5l1JmABsc7qmBqit" }       // 40 postcards Worldwide
];

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const { items, shipping_country } = JSON.parse(event.body || "{}");
    if (!items || !items.length) {
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
      totalWeight += PRODUCTS[item.id].weight * item.quantity;
    });

    // Select shipping rate based on weight and country
    let shippingOption = SHIPPING_RATES.find(rate =>
      totalWeight <= rate.maxWeight &&
      (rate.countries.includes(shipping_country) || (rate.countries.length === 0 && shipping_country !== "GB"))
    );

    if (!shippingOption) {
      shippingOption = SHIPPING_RATES[SHIPPING_RATES.length - 1]; // fallback
    }

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
