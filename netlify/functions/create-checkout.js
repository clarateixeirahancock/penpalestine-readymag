// Shipping thresholds based on total weight
const SHIPPING_RATES = [
  { maxWeight: 0.05, country: "GB", shipping_rate: "shr_1SmepTLp5l1JmABsJzFF773I" },
  { maxWeight: 0.10, country: "GB", shipping_rate: "shr_1Smes2Lp5l1JmABs2eSRdmI9" },
@@ -34,19 +28,17 @@ exports.handler = async function(event) {
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers };

  try {
    const { items, shipping_country } = JSON.parse(event.body || "{}");
    const { items, shipping_info } = JSON.parse(event.body || "{}");

    if (!items || items.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No items sent" }) };
    }

    if (!shipping_country) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No shipping country provided" }) };
    if (!shipping_info || !shipping_info.country) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Shipping info missing" }) };
    }

    // Build line items
@@ -67,29 +59,42 @@ exports.handler = async function(event) {
      };
    });

    // Calculate total weight
    // Total weight
    let totalWeight = 0;
    items.forEach(item => {
      const product = PRODUCTS[item.id];
      totalWeight += product.weight * item.quantity;
    });
    items.forEach(item => totalWeight += PRODUCTS[item.id].weight * item.quantity);

    // Select shipping rate based on country and weight
    let shippingOption = SHIPPING_RATES.find(rate => 
    // Shipping rate
    let shippingOption = SHIPPING_RATES.find(rate =>
      totalWeight <= rate.maxWeight &&
      ((shipping_country === "GB" && rate.country === "GB") ||
       (shipping_country !== "GB" && rate.country === "WW"))
      ((shipping_info.country === "GB" && rate.country === "GB") ||
       (shipping_info.country !== "GB" && rate.country === "WW"))
    );

    if (!shippingOption) {
      shippingOption = SHIPPING_RATES[SHIPPING_RATES.length - 1]; // fallback
    }
    if (!shippingOption) shippingOption = SHIPPING_RATES[SHIPPING_RATES.length - 1];

    // Create Stripe Checkout session
    // Create Checkout session with fixed shipping info
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      shipping_options: [{ shipping_rate: shippingOption.shipping_rate }],
      // Remove shipping_address_collection so country is fixed
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
