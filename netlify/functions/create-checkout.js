const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Define your products, including weight (in kg)
const PRODUCTS = {
  theydidntknowwewereseeds: { 
    price: "price_1SltMXLp5l1JmABsZREYzvaM", // Stripe price ID
    weight: 0.05 // kg
  },
  another_product: {
    price: "price_1SltMX…", 
    weight: 0.5
  }
};

// Shipping thresholds based on total weight and destination
const SHIPPING_RATES = [
  { maxWeight: 0.05, country: "GB", shipping_rate: "shr_1SmepTLp5l1JmABsJzFF773I" },    // 10 postcards UK
  { maxWeight: 0.10, country: "GB", shipping_rate: "shr_uk_20" },    // 20 postcards UK
  { maxWeight: 0.20, country: "GB", shipping_rate: "shr_uk_40" },    // 40 postcards UK
  { maxWeight: 0.05, country: "WW", shipping_rate: "shr_1Smeq6Lp5l1JmABsxxy2qNRv" }, // 10 postcards worldwide
  { maxWeight: 0.10, country: "WW", shipping_rate: "shr_world_20" }, // 20 postcards worldwide
  { maxWeight: 0.20, country: "WW", shipping_rate: "shr_world_40" }  // 40 postcards worldwide
];

exports.handler = async function(event, context) {
  try {
    const { items, shipping_country } = JSON.parse(event.body); 
    // shipping_country = "GB" or "WW" sent from frontend

    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "No items sent" }) };
    }

    // Build line items
    const line_items = items.map(item => {
      const product = PRODUCTS[item.id];
      if (!product) throw new Error(`Unknown product ID: ${item.id}`);
      return {
        price: product.price,
        quantity: item.quantity
      };
    });

    // Calculate total weight
    let totalWeight = 0;
    items.forEach(item => {
      const product = PRODUCTS[item.id];
      totalWeight += product.weight * item.quantity;
    });

    // Find the correct shipping rate
    let shippingOption = SHIPPING_RATES.find(rate => 
      totalWeight <= rate.maxWeight && 
      ((shipping_country === "GB" && rate.country === "GB") ||
       (shipping_country !== "GB" && rate.country === "WW"))
    );

    if (!shippingOption) {
      shippingOption = SHIPPING_RATES[SHIPPING_RATES.length - 1]; // fallback
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      shipping_options: [{ shipping_rate: shippingOption.shipping_rate }],
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

