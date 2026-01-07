const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PRODUCTS = {
  theydidntknowwewereseeds: {
    name: "They Didn’t Know We Were Seeds",
    price: "price_1SltMXLp5l1JmABsZREYzvaM",
    weight: 0.05
  }
};

// Shipping rates (already working for you)
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

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    const { items } = JSON.parse(event.body || "{}");

    if (!items || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No items sent" })
      };
    }

    // Build line items
    const line_items = items.map(item => {
      const product = PRODUCTS[item.id];
      if (!product) throw new Error(`Unknown product: ${item.id}`);

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

    // Default to worldwide; Stripe will collect the address
    const country = "GB"; // initial assumption
    const rates = SHIPPING_RATES[country] || SHIPPING_RATES.WW;

    const selected = rates.find(r => totalWeight <= r.maxWeight) || rates[rates.length - 1];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,

      shipping_address_collection: {
        allowed_countries: ["ZZ"]
      },

      shipping_options: [
        { shipping_rate: selected.rate }
      ],

      // 🔑 THIS IS THE IMPORTANT PART
      metadata: {
        items: JSON.stringify(
          items.map(item => ({
            id: item.id,
            name: PRODUCTS[item.id].name,
            quantity: item.quantity
          }))
        )
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
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
