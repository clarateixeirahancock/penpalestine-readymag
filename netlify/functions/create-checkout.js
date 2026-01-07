// File: create-checkout.js (Netlify function)

const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe Price IDs for different weight tiers
const GENERIC_PRICE_IDS = {
  10: "price_1SltMXLp5l1JmABsZREYzvaM", // up to 0.05 kg
  20: "price_1SmtmjLp5l1JmABsePebzdfJ", // up to 0.10 kg
  40: "price_1Smto4Lp5l1JmABsdtaQp2Ed"  // up to 0.20 kg
};

// Products with weights
const PRODUCTS = {
  theydidntknowwewereseeds: { name: "Seed Pack", weight: 0.05 },
  pickmixbundle: { name: "Pick & Mix Bundle", weight: 0.10 },
  postcard40: { name: "Postcard Pack 40", weight: 0.20 },
  clawsoffgaza: { name: "Claws Off Gaza", weight: 0.05 }
};

// Shipping rates by weight + region
const SHIPPING_RATES = [
  { maxWeight: 0.05, region: "GB", rate: "shr_1SmepTLp5l1JmABsJzFF773I" },
  { maxWeight: 0.10, region: "GB", rate: "shr_1Smes2Lp5l1JmABs2eSRdmI9" },
  { maxWeight: 0.20, region: "GB", rate: "shr_1SmgR0Lp5l1JmABsJVkE4raC" },

  { maxWeight: 0.05, region: "WW", rate: "shr_1Smeq6Lp5l1JmABsxxy2qNRv" },
  { maxWeight: 0.10, region: "WW", rate: "shr_1SmgQgLp5l1JmABssFDuJ3Nn" },
  { maxWeight: 0.20, region: "WW", rate: "shr_1SmgRJLp5l1JmABsc7qmBqit" }
];

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    const { items, shipping_country } = JSON.parse(event.body || "{}");

    if (!items || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No items provided" })
      };
    }

    // Build Stripe line items
    const line_items = items.map(item => {
      const product = PRODUCTS[item.id];
      if (!product) throw new Error(`Unknown product ID: ${item.id}`);

      let priceId;
      if (product.weight <= 0.05) priceId = GENERIC_PRICE_IDS[10];
      else if (product.weight <= 0.10) priceId = GENERIC_PRICE_IDS[20];
      else priceId = GENERIC_PRICE_IDS[40];

      return {
        price: priceId,
        quantity: item.quantity
      };
    });

    // Calculate total shipment weight
    const totalWeight = items.reduce((sum, item) => {
      const product = PRODUCTS[item.id];
      return sum + product.weight * item.quantity;
    }, 0);

    const countryCode = (shipping_country || "GB").toUpperCase();
    const region = countryCode === "GB" ? "GB" : "WW";

    // Pick correct shipping rate
    let shipping = SHIPPING_RATES.find(r =>
      r.region === region && totalWeight <= r.maxWeight
    );

    if (!shipping) {
      shipping = SHIPPING_RATES
        .filter(r => r.region === region)
        .slice(-1)[0];
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      shipping_options: [{ shipping_rate: shipping.rate }],
      shipping_address_collection: {
        allowed_countries: ["GB", "US", "CA", "AU", "NZ", "IE", "FR", "DE"]
      },
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    console.error("Checkout error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
