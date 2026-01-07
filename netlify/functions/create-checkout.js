const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Three generic Stripe Price IDs for different weight tiers
// Stripe Price IDs for different weight tiers
const GENERIC_PRICE_IDS = {
  10: "price_1SltMXLp5l1JmABsZREYzvaM", // e.g., up to 10 postcards / 0.05 kg
  20: "price_1SmtmjLp5l1JmABsePebzdfJ", // e.g., up to 20 postcards / 0.10 kg
  40: "price_1Smto4Lp5l1JmABsdtaQp2Ed"  // e.g., up to 40 postcards / 0.20 kg
  10: "price_1SltMXLp5l1JmABsZREYzvaM", // up to 0.05 kg
  20: "price_1SmtmjLp5l1JmABsePebzdfJ", // up to 0.10 kg
  40: "price_1Smto4Lp5l1JmABsdtaQp2Ed"  // up to 0.20 kg
};

// Define all your products locally with their weight (kg)
// Products with weights
const PRODUCTS = {
theydidntknowwewereseeds: { name: "Seed Pack", weight: 0.05 },
pickmixbundle: { name: "Pick & Mix Bundle", weight: 0.10 },
  postcard40: { name: "Postcard Pack 40", weight: 0.20 }
  // Add more products as needed
  clawsoffgaza: { name: "clawsoffgaza", weight: 0.5 }
};

// Shipping thresholds based on total weight
// Shipping thresholds
const SHIPPING_RATES = [
{ maxWeight: 0.05, country: "GB", shipping_rate: "shr_1SmepTLp5l1JmABsJzFF773I" },
{ maxWeight: 0.10, country: "GB", shipping_rate: "shr_1Smes2Lp5l1JmABs2eSRdmI9" },
@@ -54,7 +53,7 @@ exports.handler = async function(event) {
let priceId;
if (product.weight <= 0.05) priceId = GENERIC_PRICE_IDS[10];
else if (product.weight <= 0.10) priceId = GENERIC_PRICE_IDS[20];
      else priceId = GENERIC_PRICE_IDS[30];
      else priceId = GENERIC_PRICE_IDS[40];

return {
price: priceId,
@@ -65,38 +64,19 @@ exports.handler = async function(event) {
});

// Calculate total weight
    let totalWeight = 0;
    items.forEach(item => {
    const totalWeight = items.reduce((sum, item) => {
const product = PRODUCTS[item.id];
      totalWeight += product.weight * item.quantity;
    });
      return sum + product.weight * item.quantity;
    }, 0);

    // Safely read country code, default to WW if undefined
    const countryCode = (shipping_country || "WW").toUpperCase();

    // Find correct shipping rate
    let shippingOption = SHIPPING_RATES.find(rate => 
    // Find shipping option based on country and weight
    let shippingOption = SHIPPING_RATES.find(rate =>
totalWeight <= rate.maxWeight &&
      ((shipping_country === "GB" && rate.country === "GB") ||
       (shipping_country !== "GB" && rate.country === "WW"))
      ((countryCode === "GB" && rate.country === "GB") ||
       (countryCode !== "GB" && rate.country === "WW"))
);

if (!shippingOption) {
      shippingOption = SHIPPING_RATES[SHIPPING_RATES.length - 1]; // fallback
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      shipping_options: [{ shipping_rate: shippingOption.shipping_rate }],
      shipping_address_collection: { allowed_countries: ["ZZ"] }, // add more countries
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel"
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
