// create-checkout.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Define your products, including weight (in kg)
const PRODUCTS = {
  theydidntknowwewereseeds: { 
    price: "shr_1SmepTLp5l1JmABsJzFF773I", // Stripe price ID
    weight: 0.1 // kg
  },
  another_product: {
    price: "price_1SltMX…", 
    weight: 0.5
  }
};

// Define your shipping rates by weight
const SHIPPING_RATES = [
  { maxWeight: 0.5, shipping_rate: "shr_STANDARD_ID" },  // <= 0.5kg
  { maxWeight: 1, shipping_rate: "shr_EXPRESS_ID" },     // <= 1kg
  { maxWeight: 10, shipping_rate: "shr_HEAVY_ID" }       // <=10kg
];

exports.handler = async function(event, context) {
  try {
    const { items } = JSON.parse(event.body);

    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "No items sent" }) };
    }

    // Create line items for Stripe
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

    // Pick shipping rate based on total weight
    let shippingOption = SHIPPING_RATES.find(rate => totalWeight <= rate.maxWeight);
    if (!shippingOption) {
      shippingOption = SHIPPING_RATES[SHIPPING_RATES.length - 1]; // fallback to heaviest rate
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      shipping_options: [
        { shipping_rate: shippingOption.shipping_rate }
      ],
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
    
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};



