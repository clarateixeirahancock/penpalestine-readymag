// File: netlify/functions/create-checkout.js

const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Price tiers
const GENERIC_PRICE_IDS = {
  10: "price_1SltMXLp5l1JmABsZREYzvaM",
  20: "price_1SmtmjLp5l1JmABsePebzdfJ",
  40: "price_1Smto4Lp5l1JmABsdtaQp2Ed"
};

// Products
const PRODUCTS = {
  theydidntknowwewereseeds: { name: "Seed Pack", weight: 0.05 },
  pickmixbundle: { name: "Pick & Mix Bundle", weight: 0.10 },
  clawsoffgaza: { name: "clawsoffgaza", weight: 0.05 }
};

// Shipping rates
const SHIPPING_RATES = [
  { maxWeight: 0.05, country: "GB", shipping_rate: "shr_1SmepTLp5l1JmABsJzFF773I" },
  { maxWeight: 0.10, country: "GB", shipping_rate: "shr_1Smes2Lp5l1JmABs2eSRdmI9" },
  { maxWeight: 0.20, country: "GB", shipping_rate: "shr_1SmgR0Lp5l1JmABsJVkE4raC" },
  { maxWeight: 0.05, country: "WW", shipping_rate: "shr_1Smeq6Lp5l1JmABsxxy2qNRv" },
  { maxWeight: 0.10, country: "WW", shipping_rate: "shr_1SmgQgLp5l1JmABssFDuJ3Nn" },
  { maxWeight: 0.20, country: "WW", shipping_rate: "shr_1SmgRJLp5l1JmABsc7qmBqit" }
];

exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*", // allow any origin
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "OK"
    };
  }

  try {
    const { items, shipping_country } = JSON.parse(event.body || "{}");

    if (!items || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No items sent" })
      };
    }

    // Line items
    const line_items = items.map(item => {
      const product = PRODUCTS[item.id];
      if (!product) throw new Error(`Unknown product ID: ${item.id}`);

      let priceId;
      if (product.weight <= 0.05) priceId = GENERIC_PRICE_IDS[10];
      else if (product.weight <= 0.10) priceId = GENERIC_PRICE_IDS[20];
      else priceId = GENERIC_PRICE_IDS[40];

      return {
        price: priceId,
        quantity: item.quantity,
        adjustable_quantity: { enabled: false },
        metadata: { product_name: product.name, product_id: item.id }
      };
    });

    // Total weight
    let totalWeight = 0;
    items.forEach(item => {
      const product = PRODUCTS[item.id];
      totalWeight += product.weight * item.quantity;
    });

    // Shipping rate
    let shippingOption = SHIPPING_RATES.find(rate =>
      totalWeight <= rate.maxWeight &&
      ((shipping_country === "GB" && rate.country === "GB") ||
       (shipping_country !== "GB" && rate.country === "WW"))
    );

    if (!shippingOption) {
      shippingOption = SHIPPING_RATES
        .filter(r => r.country === (shipping_country === "GB" ? "GB" : "WW"))
        .slice(-1)[0];
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      shipping_options: [{ shipping_rate: shippingOption.shipping_rate }],
      shipping_address_collection: { allowed_countries: ["GB", "US", "CA", "AU"] },
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    console.error("Stripe error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
}; // <--- Make sure this closing brace and semicolon exist
