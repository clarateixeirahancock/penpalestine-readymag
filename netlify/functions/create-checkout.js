// Build line items (unchanged)
const line_items = items.map(item => {
  const product = PRODUCTS[item.id];
  if (!product) throw new Error(`Unknown product ID: ${item.id}`);

  let priceId;
  if (product.weight <= 0.05) priceId = GENERIC_PRICE_IDS[10];
  else if (product.weight <= 0.10) priceId = GENERIC_PRICE_IDS[20];
  else priceId = GENERIC_PRICE_IDS[40]; // <- fixed, was 30

  return {
    price: priceId,
    quantity: item.quantity,
    adjustable_quantity: { enabled: false },
    metadata: { product_name: product.name, product_id: item.id }
  };
});

// Find correct shipping rate
let shippingOption = SHIPPING_RATES.find(rate => 
  totalWeight <= rate.maxWeight &&
  ((shipping_country.toUpperCase() === "GB" && rate.country === "GB") ||
   (shipping_country.toUpperCase() !== "GB" && rate.country === "WW"))
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
  shipping_address_collection: { allowed_countries: ["GB"] }, // <- only UK allowed
  success_url: "https://your-site.com/success",
  cancel_url: "https://your-site.com/cancel"
});
