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
  pickmixbundle: { name: "pickmixbundle", weight: 0.10 },
  collectionbox: { name: "collectionbox", weight: 0.20 },
  clawsoffgaza: { name: "Claws Off Gaza", weight: 0.05 },
  fragile: { name: "fragile", weight: 0.05 },
fromthetilestothepixels1: { name: "fromthetilestothepixels1", weight: 0.05 },
fromthetilestothepixels2: { name: "fromthetilestothepixels2", weight: 0.05 },
ceasefirenow: { name: "ceasefirenow", weight: 0.05 },
theydidntknowwewereseeds: { name: "theydidntknowwewereseeds", weight: 0.05 },
palestineplant: { name: "palestineplant", weight: 0.05 },
doveovergaza: { name: "doveovergaza", weight: 0.05 },
flagdoves: { name: "flagdoves", weight: 0.05 },
longlivepalestine: { name: "longlivepalestine", weight: 0.05 },
soulofmysoul: { name: "soulofmysoul", weight: 0.05 },
everythingendsupworkingout: { name: "everythingendsupworkingout", weight: 0.05 },
ongod: { name: "ongod", weight: 0.05 },
ceasefirenowii: { name: "ceasefirenowii", weight: 0.05 },
gradientwatermelon: { name: "gradientwatermelon", weight: 0.05 },
apeopleunitedwillneverbedefeated: { name: "apeopleunitedwillneverbedefeated", weight: 0.05 },
palestinelives: { name: "palestinelives", weight: 0.05 },
resistboycott: { name: "resistboycott", weight: 0.05 },
youragonyisyourtriumph: { name: "youragonyisyourtriumph", weight: 0.05 },
lafamille: { name: "lafamille", weight: 0.05 },
les4artistes: { name: "les4artistes", weight: 0.05 },
keystoresistance: { name: "keystoresistance", weight: 0.05 },
nightinthedarkcity: { name: "nightinthedarkcity", weight: 0.05 },
forpeace: { name: "forpeace", weight: 0.05 },
palestinewillbloomagain: { name: "palestinewillbloomagain", weight: 0.05 },
resistanceinbloom: { name: "resistanceinbloom", weight: 0.05 },
fromtherivertothesea: { name: "fromtherivertothesea", weight: 0.05 },
vivalavida: { name: "vivalavida", weight: 0.05 },
sunbirdholdingpoppyflowers: { name: "sunbirdholdingpoppyflowers", weight: 0.05 },
olivebranch: { name: "olivebranch", weight: 0.05 },
keytoresistance: { name: "keytoresistance", weight: 0.05 },
unitedwestand: { name: "unitedwestand", weight: 0.05 },
fromtherivertotheseakiteswillflyfree: { name: "fromtherivertotheseakiteswillflyfree", weight: 0.05 },
theworldiswatching: { name: "theworldiswatching", weight: 0.05 },
strength: { name: "strength", weight: 0.05 },
palestinei: { name: "palestinei", weight: 0.05 },
palestineii: { name: "palestineii", weight: 0.05 },
palestineiii: { name: "palestineiii", weight: 0.05 },
theforbiddencolorsi: { name: "theforbiddencolorsi", weight: 0.05 },
theforbiddencolorsii: { name: "theforbiddencolorsii", weight: 0.05 },
theforbiddencolorsiii: { name: "theforbiddencolorsiii", weight: 0.05 },
tothelandofpeacei: { name: "tothelandofpeacei", weight: 0.05 },
tothelandofpeaceii: { name: "tothelandofpeaceii", weight: 0.05 },
soulofthesoul: { name: "soulofthesoul", weight: 0.05 },
inflatablewatermelon: { name: "inflatablewatermelon", weight: 0.05 },
palestineheart: { name: "palestineheart", weight: 0.05 },
palestinewatermelon: { name: "palestinewatermelon", weight: 0.05 },
olivetrees: { name: "olivetrees", weight: 0.05 },
fromtherivertotheseaii: { name: "fromtherivertotheseaii", weight: 0.05 },
palestinewillbefree: { name: "palestinewillbefree", weight: 0.05 },
beyondstormsfreedom: { name: "beyondstormsfreedom", weight: 0.05 },
messengerofpeace: { name: "messengerofpeace", weight: 0.05 },
thepoppyfloweri: { name: "thepoppyfloweri", weight: 0.05 },
thepoppyflowerii: { name: "thepoppyflowerii", weight: 0.05 },
yaffaoranges: { name: "yaffaoranges", weight: 0.05 },
poppies: { name: "poppies", weight: 0.05 },
poppieswatermelons: { name: "poppieswatermelons", weight: 0.05 },
palestineiv: { name: "palestineiv", weight: 0.05 },
hudhudi: { name: "hudhudi", weight: 0.05 },
hudhudii: { name: "hudhudii", weight: 0.05 },
heartbreakforpalestine: { name: "heartbreakforpalestine", weight: 0.05 },
watermelons: { name: "watermelons", weight: 0.05 },
longlivepalestineii: { name: "longlivepalestineii", weight: 0.05 },
palestineeverywhere: { name: "palestineeverywhere", weight: 0.05 },
sendingpeacewithanolivebranch: { name: "sendingpeacewithanolivebranch", weight: 0.05 },
nofencesforpeople: { name: "nofencesforpeople", weight: 0.05 },
hope: { name: "hope", weight: 0.05 },
heartofgaza: { name: "heartofgaza", weight: 0.05 },
theworldiswatchingii: { name: "theworldiswatchingii", weight: 0.05 },
wereoneachothersteam: { name: "wereoneachothersteam", weight: 0.05 },
free: { name: "free", weight: 0.05 },
watermelon: { name: "watermelon", weight: 0.05 },
triangle: { name: "triangle", weight: 0.05 },
"ceasefirenow!": { name: "ceasefirenow!", weight: 0.05 },
landofthefree: { name: "landofthefree", weight: 0.05 },
everychilddeservestolive: { name: "everychilddeservestolive", weight: 0.05 },
willyoubemypalestine: { name: "willyoubemypalestine", weight: 0.05 },
songsoffreedomii: { name: "songsoffreedomii", weight: 0.05 },
letgazalive: { name: "letgazalive", weight: 0.05 },
resistenciaypaz: { name: "resistenciaypaz", weight: 0.05 },
songsoffreedom: { name: "songsoffreedom", weight: 0.05 },
watermelonresistancei: { name: "watermelonresistancei", weight: 0.05 },
watermelonresistanceaid: { name: "watermelonresistanceaid", weight: 0.05 },
watermelonresistancepattern: { name: "watermelonresistancepattern", weight: 0.05 },
watermelonresistanceiii: { name: "watermelonresistanceiii", weight: 0.05 },
watermelonresistancespeakout: { name: "watermelonresistancespeakout", weight: 0.05 },
watermelonresistanceflowerslive: { name: "watermelonresistanceflowerslive", weight: 0.05 },
watermelonresistanceii: { name: "watermelonresistanceii", weight: 0.05 },
historyisnotover: { name: "historyisnotover", weight: 0.05 },
mother: { name: "mother", weight: 0.05 },
returningfortheolives: { name: "returningfortheolives", weight: 0.05 },
gazasgrief: { name: "gazasgrief", weight: 0.05 },
palestineisfree: { name: "palestineisfree", weight: 0.05 },
growing: { name: "growing", weight: 0.05 },
beyondwords: { name: "beyondwords", weight: 0.05 },
mansitting: { name: "mansitting", weight: 0.05 },
ourland: { name: "ourland", weight: 0.05 },
oursea: { name: "oursea", weight: 0.05 },
oursky: { name: "oursky", weight: 0.05 },
freedomshalltakeitsroots: { name: "freedomshalltakeitsroots", weight: 0.05 },
pulsemeanspalestine: { name: "pulsemeanspalestine", weight: 0.05 },
hereweremain: { name: "hereweremain", weight: 0.05 },
keyofresistance: { name: "keyofresistance", weight: 0.05 },
righttoreturn: { name: "righttoreturn", weight: 0.05 },
thelongingpalestinesunbird: { name: "thelongingpalestinesunbird", weight: 0.05 },
wehaveonthisearthwhatmakeslifeworthliving: { name: "wehaveonthisearthwhatmakeslifeworthliving", weight: 0.05 },
palestineisalreadyeternal: { name: "palestineisalreadyeternal", weight: 0.05 },
thewatermelon: { name: "thewatermelon", weight: 0.05 },
yaffaportal: { name: "yaffaportal", weight: 0.05 },
poppyforpeace: { name: "poppyforpeace", weight: 0.05 },
righttoresist: { name: "righttoresist", weight: 0.05 },
alleyesonpalestinei: { name: "alleyesonpalestinei", weight: 0.05 },
alleyesonpalestineii: { name: "alleyesonpalestineii", weight: 0.05 },
alleyesonpalestineiii: { name: "alleyesonpalestineiii", weight: 0.05 },
inhopeliesrevolution: { name: "inhopeliesrevolution", weight: 0.05 },
theskinofhumandignity: { name: "theskinofhumandignity", weight: 0.05 },
palestinesunbirdcinnyrisosea: { name: "palestinesunbirdcinnyrisosea", weight: 0.05 },
freepalestinei: { name: "freepalestinei", weight: 0.05 },
freepalestineii: { name: "freepalestineii", weight: 0.05 },
oneheart: { name: "oneheart", weight: 0.05 },
whereishumanity: { name: "whereishumanity", weight: 0.05 },
ourenemyiscapitalism: { name: "ourenemyiscapitalism", weight: 0.05 },
"76yearssincethenakba": { name: "76yearssincethenakba", weight: 0.05 },
freepalestineiii: { name: "freepalestineiii", weight: 0.05 },
resilience: { name: "resilience", weight: 0.05 },
palestinianjoyisresistance: { name: "palestinianjoyisresistance", weight: 0.05 },
ourheartstopalestine: { name: "ourheartstopalestine", weight: 0.05 },
songoftheunbroken: { name: "songoftheunbroken", weight: 0.05 },
underaskyfullofscars: { name: "underaskyfullofscars", weight: 0.05 },
theembraceofthehomelandi: { name: "theembraceofthehomelandi", weight: 0.05 },
theembraceofthehomelandii: { name: "theembraceofthehomelandii", weight: 0.05 },
thelingeringorangescentismyhomeland: { name: "thelingeringorangescentismyhomeland", weight: 0.05 },
cryingeyesfestival: { name: "cryingeyesfestival", weight: 0.05 },
wereresistuntilthelastbreath: { name: "wereresistuntilthelastbreath", weight: 0.05 },
keffiyehi: { name: "keffiyehi", weight: 0.05 },
keffiyehii: { name: "keffiyehii", weight: 0.05 },
longlivepalestineiii: { name: "longlivepalestineiii", weight: 0.05 },
watermelonpeace: { name: "watermelonpeace", weight: 0.05 },
fromtherivertotheseaiii: { name: "fromtherivertotheseaiii", weight: 0.05 },
anchored: { name: "anchored", weight: 0.05 },
watermelonii: { name: "watermelonii", weight: 0.05 },
dawnwillcome: { name: "dawnwillcome", weight: 0.05 },
theworldsuffersforpalestine: { name: "theworldsuffersforpalestine", weight: 0.05 },
abouissathepeasant: { name: "abouissathepeasant", weight: 0.05 },
longlivetheintifada: { name: "longlivetheintifada", weight: 0.05 },
palestineistilllifei: { name: "palestineistilllifei", weight: 0.05 },
palestineistilllifeii: { name: "palestineistilllifeii", weight: 0.05 },
cryingforgaza: { name: "cryingforgaza", weight: 0.05 },
thisismyland: { name: "thisismyland", weight: 0.05 },
vivapalestina: { name: "vivapalestina", weight: 0.05 },
freepalesineiv: { name: "freepalesineiv", weight: 0.05 },
lastautumn: { name: "lastautumn", weight: 0.05 },
freegazastrengthandtears: { name: "freegazastrengthandtears", weight: 0.05 },
seedsoffreedomi: { name: "seedsoffreedomi", weight: 0.05 },
seedsoffreedomii: { name: "seedsoffreedomii", weight: 0.05 },
therighttobechildren: { name: "therighttobechildren", weight: 0.05 },
freepalestineceasefirenow: { name: "freepalestineceasefirenow", weight: 0.05 },
holdoni: { name: "holdoni", weight: 0.05 },
holdonii: { name: "holdonii", weight: 0.05 },
hope: { name: "hope", weight: 0.05 },
flowersforfreedom: { name: "flowersforfreedom", weight: 0.05 },
myhomelandisnotasuitcaseandiamnotatraveler: { name: "myhomelandisnotasuitcaseandiamnotatraveler", weight: 0.05 },
olivedove: { name: "olivedove", weight: 0.05 },
keytopeace: { name: "keytopeace", weight: 0.05 },
watermeloniii: { name: "watermeloniii", weight: 0.05 },
gazawillregrowfromthetears: { name: "gazawillregrowfromthetears", weight: 0.05 },
payattention: { name: "payattention", weight: 0.05 },
osaviorrescuethem: { name: "osaviorrescuethem", weight: 0.05 },
sumudinternationalcourtofjustice12012024: { name: "sumudinternationalcourtofjustice12012024", weight: 0.05 },
lifefindsaway: { name: "lifefindsaway", weight: 0.05 },
iwakeupeverydaywithpalestineonmymind: { name: "iwakeupeverydaywithpalestineonmymind", weight: 0.05 },
theformsofleavingandtheformsofreturning: { name: "theformsofleavingandtheformsofreturning", weight: 0.05 },
freepalestinev: { name: "freepalestinev", weight: 0.05 },
theplacewhereolivetreesusedtogrow: { name: "theplacewhereolivetreesusedtogrow", weight: 0.05 },
molecularintifada: { name: "molecularintifada", weight: 0.05 },
  palestinesunbird: { name: "palestinesunbird", weight: 0.05 },
  freegaza2: { name: "freegaza2", weight: 0.05 },
  freegaza: { name: "freegaza", weight: 0.05 },
  tomorrowisapalestinianday: { name: "tomorrowisapalestinianday", weight: 0.05 },
  tearsforpalestine: { name: "tearsforpalestine", weight: 0.05 },
  palestinalibrei: { name: "palestinalibrei", weight: 0.05 },
  freepalestineiv: { name: " freepalestineiv", weight: 0.05 },
  flowerofpalestine: { name: "flowerofpalestine", weight: 0.05 },
  saoirseDonFalaistinii : { name: "saoirsedonfalaistinii", weight: 0.05 },
  saoirseDonFalaistini : { name: "saoirsedonfalaistini", weight: 0.05 },
  wavesofsolidarity : { name: " avesofsolidarity", weight: 0.05 },
  palestinianman : { name: "palestinianman", weight: 0.05 },
keffiyehiii : { name: "keffiyehiii", weight: 0.05 },
  birdchirping : { name: "birdchirping", weight: 0.05 },
  fatheri : { name: "fatheri", weight: 0.05 },
  landofsadoranges : { name: "landofsadoranges", weight: 0.05 },
  lastautumn : { name: "lastautumn", weight: 0.05 },
  longlivetheresistance : { name: "longlivetheresistance", weight: 0.05 },
  threadsofliberty : { name: "threadsofliberty", weight: 0.05 },
  palestinalibreii : { name: "palestinalibreii", weight: 0.05 },
  keffiyehxlefkaralace : { name: "keffiyehxlefkaralace", weight: 0.05 },
 palestinei : { name: "palestinei", weight: 0.05 },
   keffiyehi : { name: "keffiyehi", weight: 0.05 },
   palestinewillriseagain : { name: "palestinewillriseagain", weight: 0.05 },
  freepalestinevi : { name: "freepalestinevi", weight: 0.05 },
  theytriedtoburyus : { name: "theytriedtoburyus", weight: 0.05 },
    palestinewillflyfreeagain : { name: "palestinewillflyfreeagain", weight: 0.05 },
  saoirsedonfalaistinii: { name: "saoirsedonfalaistinii", weight: 0.05 },
  poppyforpeace: { name: "poppyforpeace", weight: 0.05 },
  

  
  








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
    const { items, shipping_country, cancel_url } = JSON.parse(event.body || "{}");

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
  cancel_url: cancel_url || "https://my.readymag.com/edit/5931573/preview/clawsoffgaza/",
  payment_intent_data: { 
    metadata: {
      items: JSON.stringify(items.map(item => ({
        id: item.id,
        name: PRODUCTS[item.id].name,
        weight: PRODUCTS[item.id].weight,
        quantity: item.quantity
      })))
    }
  }
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
