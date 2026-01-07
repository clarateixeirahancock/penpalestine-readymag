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
  postcard40: { name: "Postcard Pack 40", weight: 0.20 }
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
    "Access-Control-Allow-Origin": "*", // allow any origin; replace with your domain if needed
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  // Handle CORS preflight
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

    // Build line items
    const line_items = items.map(item => {
      const product = PRODUCTS[item.id];
      if (!product) throw new Error(`Unknown product ID: ${item.id}`);

      let priceId;
      if (product.weight <= 0.05) priceId = GENERIC_PRICE_IDS[10];
      else if (product.weight <= 0.10) priceId = GENERIC_PRIC_
