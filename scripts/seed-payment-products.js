import client, { INDEX_NAME } from '../lib/config/opensearch.js';
import embeddingService from '../lib/services/embeddingService.js';

const paymentProducts = [
  { name: "Stripe", url: "https://stripe.com", description: "Payment processing platform for internet businesses. Accept payments online with ease.", tags: ["payments", "processing", "api", "fintech", "saas"] },
  { name: "PayPal", url: "https://paypal.com", description: "Send and receive money online securely. Online payment solution for businesses.", tags: ["payments", "wallet", "transfer", "fintech"] },
  { name: "Square", url: "https://square.com", description: "Point of sale and payment processing for businesses of all sizes.", tags: ["payments", "pos", "processing", "fintech"] },
  { name: "Paddle", url: "https://paddle.com", description: "Payment infrastructure for SaaS companies. Handle subscriptions and billing.", tags: ["payments", "saas", "subscriptions", "billing"] },
  { name: "Chargebee", url: "https://chargebee.com", description: "Subscription billing and revenue management platform.", tags: ["billing", "subscriptions", "saas", "payments"] },
  { name: "Recurly", url: "https://recurly.com", description: "Subscription management and recurring billing platform.", tags: ["subscriptions", "billing", "payments", "saas"] },
  { name: "Braintree", url: "https://braintreepayments.com", description: "Payment platform from PayPal. Accept payments in your app or website.", tags: ["payments", "processing", "api", "fintech"] },
  { name: "Adyen", url: "https://adyen.com", description: "Global payment platform for businesses. Accept payments worldwide.", tags: ["payments", "global", "processing", "fintech"] },
  { name: "Mollie", url: "https://mollie.com", description: "Effortless payments for European businesses.", tags: ["payments", "europe", "processing"] },
  { name: "GoCardless", url: "https://gocardless.com", description: "Bank debit payments and recurring billing platform.", tags: ["payments", "debit", "recurring", "billing"] },

  { name: "Lemonsqueezy", url: "https://lemonsqueezy.com", description: "Payments and subscriptions for digital products. All-in-one platform.", tags: ["payments", "digital", "subscriptions", "saas"] },
  { name: "FastSpring", url: "https://fastspring.com", description: "eCommerce and payment platform for software companies.", tags: ["ecommerce", "payments", "software", "saas"] },
  { name: "2Checkout", url: "https://2checkout.com", description: "Global payment processing solution for online businesses.", tags: ["payments", "global", "processing", "ecommerce"] },
  { name: "Authorize.net", url: "https://authorize.net", description: "Payment gateway service provider for online transactions.", tags: ["payments", "gateway", "processing"] },
  { name: "Worldpay", url: "https://worldpay.com", description: "Payment processing for businesses of all sizes worldwide.", tags: ["payments", "processing", "global", "fintech"] },
  { name: "Klarna", url: "https://klarna.com", description: "Buy now, pay later solution for online shopping.", tags: ["payments", "bnpl", "ecommerce", "fintech"] },
  { name: "Affirm", url: "https://affirm.com", description: "Flexible payment options for online purchases.", tags: ["payments", "bnpl", "financing", "fintech"] },
  { name: "Afterpay", url: "https://afterpay.com", description: "Shop now, pay later in installments.", tags: ["payments", "bnpl", "installments", "fintech"] },
  { name: "Razorpay", url: "https://razorpay.com", description: "Payment gateway for Indian businesses. Accept online payments.", tags: ["payments", "india", "gateway", "fintech"] },
  { name: "Payoneer", url: "https://payoneer.com", description: "Global payment platform for freelancers and businesses.", tags: ["payments", "global", "transfer", "fintech"] },

  { name: "Wise", url: "https://wise.com", description: "International money transfer with low fees.", tags: ["payments", "transfer", "forex", "fintech"] },
  { name: "Revolut Business", url: "https://revolut.com", description: "Business banking and payment solutions.", tags: ["payments", "banking", "fintech", "business"] },
  { name: "Plaid", url: "https://plaid.com", description: "Financial data connectivity platform for apps.", tags: ["fintech", "api", "banking", "payments"] },
  { name: "Dwolla", url: "https://dwolla.com", description: "ACH payment platform for bank transfers.", tags: ["payments", "ach", "banking", "api"] },
  { name: "WePay", url: "https://wepay.com", description: "Integrated payments for platforms and marketplaces.", tags: ["payments", "platform", "marketplace", "api"] },
  { name: "Paystack", url: "https://paystack.com", description: "Payment infrastructure for African businesses.", tags: ["payments", "africa", "gateway", "fintech"] },
  { name: "Flutterwave", url: "https://flutterwave.com", description: "Payment technology company for global merchants.", tags: ["payments", "africa", "global", "fintech"] },
  { name: "Paytm", url: "https://paytm.com", description: "Digital payment and financial services platform.", tags: ["payments", "wallet", "india", "fintech"] },
  { name: "Alipay", url: "https://alipay.com", description: "Digital payment platform from China.", tags: ["payments", "wallet", "china", "fintech"] },
  { name: "WeChat Pay", url: "https://pay.weixin.qq.com", description: "Mobile payment service from WeChat.", tags: ["payments", "mobile", "china", "fintech"] },

  { name: "Checkout.com", url: "https://checkout.com", description: "Global payment processing platform.", tags: ["payments", "processing", "global", "api"] },
  { name: "CoinPayments", url: "https://coinpayments.net", description: "Cryptocurrency payment gateway.", tags: ["payments", "crypto", "blockchain", "gateway"] },
  { name: "BitPay", url: "https://bitpay.com", description: "Bitcoin and cryptocurrency payment processor.", tags: ["payments", "crypto", "bitcoin", "blockchain"] },
  { name: "Moonpay", url: "https://moonpay.com", description: "Buy and sell cryptocurrency with fiat currency.", tags: ["crypto", "payments", "fiat", "fintech"] },
  { name: "Mercado Pago", url: "https://mercadopago.com", description: "Payment solution for Latin America.", tags: ["payments", "latam", "ecommerce", "fintech"] },
  { name: "PayU", url: "https://payu.com", description: "Online payment service provider for emerging markets.", tags: ["payments", "emerging", "global", "fintech"] },
  { name: "Skrill", url: "https://skrill.com", description: "Digital wallet for online payments and transfers.", tags: ["payments", "wallet", "transfer", "fintech"] },
  { name: "Neteller", url: "https://neteller.com", description: "Digital payment service for online transactions.", tags: ["payments", "wallet", "online", "fintech"] },
  { name: "Payline", url: "https://payline.io", description: "Payment processing for high-risk industries.", tags: ["payments", "processing", "high-risk"] },
  { name: "Fattmerchant", url: "https://fattmerchant.com", description: "Subscription-based payment processing.", tags: ["payments", "processing", "subscriptions"] },

  { name: "Helcim", url: "https://helcim.com", description: "Transparent payment processing for small businesses.", tags: ["payments", "processing", "small-business"] },
  { name: "Payment Depot", url: "https://paymentdepot.com", description: "Wholesale payment processing services.", tags: ["payments", "processing", "wholesale"] },
  { name: "Dharma", url: "https://dharma.io", description: "Socially conscious payment processing.", tags: ["payments", "processing", "ethical"] },
  { name: "PaySimple", url: "https://paysimple.com", description: "Payment and billing software for service businesses.", tags: ["payments", "billing", "service", "software"] },
  { name: "Due", url: "https://due.com", description: "Online invoicing and payment platform.", tags: ["invoicing", "payments", "billing"] },
  { name: "FreshBooks", url: "https://freshbooks.com", description: "Accounting and invoicing software with payments.", tags: ["accounting", "invoicing", "payments", "saas"] },
  { name: "Wave", url: "https://waveapps.com", description: "Free invoicing and accounting with payment processing.", tags: ["accounting", "invoicing", "payments", "free"] },
  { name: "QuickBooks Payments", url: "https://quickbooks.intuit.com", description: "Payment processing integrated with QuickBooks.", tags: ["payments", "accounting", "quickbooks"] },
  { name: "Zoho Invoice", url: "https://zoho.com/invoice", description: "Online invoicing with payment collection.", tags: ["invoicing", "payments", "saas"] },
  { name: "Invoice Ninja", url: "https://invoiceninja.com", description: "Open-source invoicing and payment platform.", tags: ["invoicing", "payments", "open-source"] },

  { name: "Bill.com", url: "https://bill.com", description: "Automated accounts payable and receivable.", tags: ["payments", "accounting", "automation", "b2b"] },
  { name: "Tipalti", url: "https://tipalti.com", description: "Global mass payments automation platform.", tags: ["payments", "automation", "global", "b2b"] },
  { name: "Veem", url: "https://veem.com", description: "Business payment platform for global transfers.", tags: ["payments", "b2b", "global", "transfer"] },
  { name: "Melio", url: "https://meliopayments.com", description: "B2B payment solution for small businesses.", tags: ["payments", "b2b", "small-business"] },
  { name: "Routable", url: "https://routable.com", description: "B2B payment automation platform.", tags: ["payments", "b2b", "automation"] },
  { name: "Plastiq", url: "https://plastiq.com", description: "Pay any bill with a credit card.", tags: ["payments", "bills", "credit-card"] },
  { name: "Divvy", url: "https://divvy.com", description: "Expense management and corporate card platform.", tags: ["payments", "expense", "corporate-card"] },
  { name: "Ramp", url: "https://ramp.com", description: "Corporate card and spend management platform.", tags: ["payments", "corporate-card", "expense", "fintech"] },
  { name: "Brex", url: "https://brex.com", description: "Corporate credit card for startups and enterprises.", tags: ["payments", "corporate-card", "fintech", "startup"] },
  { name: "Airwallex", url: "https://airwallex.com", description: "Global payment and financial platform for businesses.", tags: ["payments", "global", "fintech", "b2b"] },

  { name: "Currencycloud", url: "https://currencycloud.com", description: "Global payments infrastructure platform.", tags: ["payments", "global", "api", "b2b"] },
  { name: "Marqeta", url: "https://marqeta.com", description: "Modern card issuing and payment processing.", tags: ["payments", "card-issuing", "api", "fintech"] },
  { name: "Rapyd", url: "https://rapyd.net", description: "Fintech-as-a-Service payment platform.", tags: ["payments", "fintech", "api", "global"] },
  { name: "Sila", url: "https://silamoney.com", description: "Banking and payments API for fintech.", tags: ["payments", "banking", "api", "fintech"] },
  { name: "Synapse", url: "https://synapsefi.com", description: "Banking and payments platform for developers.", tags: ["payments", "banking", "api", "platform"] },
  { name: "Unit", url: "https://unit.co", description: "Banking-as-a-Service platform for companies.", tags: ["banking", "payments", "api", "baas"] },
  { name: "Treasury Prime", url: "https://treasuryprime.com", description: "Banking-as-a-Service API platform.", tags: ["banking", "payments", "api", "baas"] },
  { name: "Modern Treasury", url: "https://moderntreasury.com", description: "Payment operations platform for businesses.", tags: ["payments", "operations", "b2b", "api"] },
  { name: "Increase", url: "https://increase.com", description: "Banking infrastructure for developers.", tags: ["banking", "payments", "api", "infrastructure"] },
  { name: "Column", url: "https://column.com", description: "Developer-first banking infrastructure.", tags: ["banking", "payments", "api", "infrastructure"] },

  { name: "Lithic", url: "https://lithic.com", description: "Card issuing platform for innovative companies.", tags: ["payments", "card-issuing", "api", "fintech"] },
  { name: "Privacy.com", url: "https://privacy.com", description: "Virtual payment cards for online shopping.", tags: ["payments", "virtual-cards", "privacy", "fintech"] },
  { name: "Extend", url: "https://extend.com", description: "Virtual card platform for businesses.", tags: ["payments", "virtual-cards", "b2b", "fintech"] },
  { name: "Slope", url: "https://slope.so", description: "Buy now, pay later for B2B transactions.", tags: ["payments", "bnpl", "b2b", "fintech"] },
  { name: "Pipe", url: "https://pipe.com", description: "Trade recurring revenue for upfront capital.", tags: ["fintech", "revenue", "funding", "saas"] },
  { name: "Capchase", url: "https://capchase.com", description: "Financing for SaaS companies based on revenue.", tags: ["fintech", "funding", "saas", "revenue"] },
  { name: "Clearco", url: "https://clear.co", description: "Revenue-based financing for ecommerce businesses.", tags: ["fintech", "funding", "ecommerce", "revenue"] },
  { name: "Shopify Payments", url: "https://shopify.com/payments", description: "Payment processing for Shopify stores.", tags: ["payments", "ecommerce", "shopify", "processing"] },
  { name: "WooCommerce Payments", url: "https://woocommerce.com/payments", description: "Native payment solution for WooCommerce.", tags: ["payments", "ecommerce", "woocommerce", "wordpress"] },
  { name: "BigCommerce Payments", url: "https://bigcommerce.com", description: "Integrated payment processing for BigCommerce.", tags: ["payments", "ecommerce", "processing"] },

  { name: "Bolt", url: "https://bolt.com", description: "One-click checkout solution for ecommerce.", tags: ["payments", "checkout", "ecommerce", "conversion"] },
  { name: "Fast", url: "https://fast.co", description: "One-click checkout for online stores.", tags: ["payments", "checkout", "ecommerce"] },
  { name: "Primer", url: "https://primer.io", description: "Unified payment infrastructure platform.", tags: ["payments", "infrastructure", "api", "platform"] },
  { name: "Gr4vy", url: "https://gr4vy.com", description: "Cloud-native payment orchestration platform.", tags: ["payments", "orchestration", "cloud", "api"] },
  { name: "Spreedly", url: "https://spreedly.com", description: "Payment orchestration and tokenization platform.", tags: ["payments", "orchestration", "tokenization", "api"] },
  { name: "Tilled", url: "https://tilled.com", description: "PayFac-as-a-Service platform for software companies.", tags: ["payments", "payfac", "api", "saas"] },
  { name: "Finix", url: "https://finix.com", description: "Payment infrastructure for software platforms.", tags: ["payments", "infrastructure", "api", "platform"] },
  { name: "Payrix", url: "https://payrix.com", description: "Embedded payment solution for software companies.", tags: ["payments", "embedded", "api", "saas"] },
  { name: "Stripe Connect", url: "https://stripe.com/connect", description: "Payment platform for marketplaces and platforms.", tags: ["payments", "marketplace", "platform", "api"] },
  { name: "Mangopay", url: "https://mangopay.com", description: "Payment infrastructure for marketplaces and crowdfunding.", tags: ["payments", "marketplace", "crowdfunding", "api"] },

  { name: "Hyperwallet", url: "https://hyperwallet.com", description: "Global payout platform for marketplaces.", tags: ["payments", "payouts", "marketplace", "global"] },
  { name: "Trolley", url: "https://trolley.com", description: "Mass payment platform for global payouts.", tags: ["payments", "payouts", "global", "b2b"] },
  { name: "PaymentRails", url: "https://paymentrails.com", description: "Global payment network for businesses.", tags: ["payments", "global", "network", "b2b"] },
  { name: "TransferWise", url: "https://transferwise.com", description: "International money transfer with low fees.", tags: ["payments", "transfer", "international", "forex"] },
  { name: "Remitly", url: "https://remitly.com", description: "International money transfer service.", tags: ["payments", "remittance", "international", "transfer"] },
  { name: "Xoom", url: "https://xoom.com", description: "Send money internationally from PayPal.", tags: ["payments", "remittance", "international", "paypal"] },
  { name: "Western Union", url: "https://westernunion.com", description: "Global money transfer and payment services.", tags: ["payments", "transfer", "global", "remittance"] },
  { name: "MoneyGram", url: "https://moneygram.com", description: "International money transfer services.", tags: ["payments", "transfer", "international", "remittance"] },
  { name: "Ria", url: "https://riamoneytransfer.com", description: "Money transfer service worldwide.", tags: ["payments", "transfer", "remittance", "global"] },
  { name: "PaySend", url: "https://paysend.com", description: "Global money transfer to bank accounts and cards.", tags: ["payments", "transfer", "global", "cards"] }
];

async function seedProducts() {
  console.log('Starting to seed payment products...\n');
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < paymentProducts.length; i++) {
    const product = paymentProducts[i];
    try {
      console.log(`[${i + 1}/${paymentProducts.length}] Indexing: ${product.name}`);

      // Generate embedding for the product
      const embeddingText = `${product.name} ${product.description}`;
      const embedding = await embeddingService.generateEmbedding(embeddingText);

      // Index the product
      await client.index({
        index: INDEX_NAME,
        body: {
          name: product.name,
          url: product.url,
          description: product.description,
          tags: product.tags,
          embedding: embedding,
          hasPricing: true,
          pricingInfo: 'Contact for pricing'
        }
      });

      successCount++;
      console.log(`✓ Success: ${product.name}\n`);
    } catch (error) {
      errorCount++;
      console.error(`✗ Error indexing ${product.name}:`, error.message, '\n');
    }
  }

  console.log('\n=== Seeding Complete ===');
  console.log(`Successfully indexed: ${successCount} products`);
  console.log(`Errors: ${errorCount} products`);
  console.log(`Total: ${paymentProducts.length} products`);
}

// Run the seeding
seedProducts()
  .then(() => {
    console.log('\nAll done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
