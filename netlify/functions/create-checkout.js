const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const GENERIC_PRICE_IDS = {
  10: "price_1SltMXLp5l1JmABsZREYzvaM",
  20: "price_1SmtmjLp5l1JmABsePebzdfJ",
  40: "price_1Smto4Lp5l1JmABsdtaQp2Ed"
};

const PRODUCTS = {
  theydidntknowwewereseeds: { name: "Seed Pack", weight: 0.05 },
  clawsoffgaza: { name: "clawsoffgaza", weight: 0.10 },
};

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
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const { items, shipping_info } = JSON.parse(event.body || "{}");

    if (!items || items.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No items sent" }) };
    }

    if (!shipping_info || !shipping_info.country) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Shipping info missing" }) };
    }

    // Build line items
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
    items.forEach(item => totalWeight += PRODUCTS[item.id].weight * item.quantity);

    // Shipping rate
    let shippingOption = SHIPPING_RATES.find(rate =>
      totalWeight <= rate.maxWeight &&
      ((shipping_info.country === "GB" && rate.country === "GB") ||
       (shipping_info.country !== "GB" && rate.country === "WW"))
    );

    if (!shippingOption) shippingOption = SHIPPING_RATES[SHIPPING_RATES.length - 1];

    // Create Checkout session with fixed shipping info
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      shipping_options: [{ shipping_rate: shippingOption.shipping_rate }],
      shipping: {
        name: shipping_info.name || "Customer",
        address: {
          line1: shipping_info.line1 || "N/A",
          city: shipping_info.city || "N/A",
          postal_code: shipping_info.postal_code || "N/A",
          country: shipping_info.country
        }
      },
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
