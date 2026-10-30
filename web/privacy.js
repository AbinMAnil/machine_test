import { DeliveryMethod } from "@shopify/shopify-api";
import { Shop } from "./models/shop.model.js";

/**
 * @type {{[key: string]: import("@shopify/shopify-api").WebhookHandler}}
 */
export default {
  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (_topic, shop, _body, _webhookId) => {
      try {
        console.log(`[Webhook] App uninstalled for shop: ${shop}`);
        await Shop.findOneAndUpdate(
          { shop },
          {
            $set: {
              status: "uninstalled",
              uninstalledAt: new Date(),
            },
          },
          { upsert: true }
        );
      } catch (err) {
        console.error(`Error handling APP_UNINSTALLED for ${shop}:`, err.message);
      }
    },
  },

  CUSTOMERS_DATA_REQUEST: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (_topic, shop, _body, _webhookId) => {
      // Countdown Timer + Analytics does not collect or store any customer personal data
      console.log(`[Webhook] Customers data request received for ${shop}`);
    },
  },

  CUSTOMERS_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (_topic, shop, _body, _webhookId) => {
      // Countdown Timer + Analytics does not store customer personal records
      console.log(`[Webhook] Customers redact request received for ${shop}`);
    },
  },

  SHOP_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (_topic, shop, _body, _webhookId) => {
      try {
        console.log(`[Webhook] Shop redact request received for ${shop}`);
        await Shop.findOneAndUpdate(
          { shop },
          {
            $set: {
              status: "uninstalled",
              uninstalledAt: new Date(),
            },
          }
        );
      } catch (err) {
        console.error(`Error handling SHOP_REDACT for ${shop}:`, err.message);
      }
    },
  },
};
