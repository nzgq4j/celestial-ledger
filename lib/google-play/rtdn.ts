import { z } from "zod";

/** Pub/Sub push envelope carrying a Google Play DeveloperNotification. */
export const pubSubPushSchema = z.object({
  message: z.object({
    data: z.string().max(16_384),
    messageId: z.string().max(256).optional(),
    message_id: z.string().max(256).optional(),
    publishTime: z.string().max(64).optional(),
    attributes: z.record(z.string()).optional(),
  }),
  subscription: z.string().max(512).optional(),
  deliveryAttempt: z.number().optional(),
});

const purchaseToken = z.string().min(10).max(4096);

export const developerNotificationSchema = z.object({
  version: z.string().optional(),
  packageName: z.string().min(1).max(256),
  eventTimeMillis: z.union([z.string(), z.number()]).optional(),
  subscriptionNotification: z
    .object({
      version: z.string().optional(),
      notificationType: z.number().int(),
      purchaseToken,
      subscriptionId: z.string().max(256).optional(),
    })
    .optional(),
  voidedPurchaseNotification: z
    .object({
      purchaseToken,
      orderId: z.string().max(256).optional(),
      /** 1 = subscription, 2 = one-time product. */
      productType: z.number().int().optional(),
      refundType: z.number().int().optional(),
    })
    .optional(),
  oneTimeProductNotification: z.object({}).passthrough().optional(),
  testNotification: z.object({}).passthrough().optional(),
});

export type DeveloperNotification = z.infer<typeof developerNotificationSchema>;

export function decodeDeveloperNotification(
  base64Data: string,
): DeveloperNotification | null {
  try {
    const json = JSON.parse(Buffer.from(base64Data, "base64").toString("utf8"));
    const parsed = developerNotificationSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** The subscription purchase token a notification refers to, if any. */
export function subscriptionTokenFrom(notification: DeveloperNotification) {
  if (notification.subscriptionNotification)
    return notification.subscriptionNotification.purchaseToken;
  if (
    notification.voidedPurchaseNotification &&
    notification.voidedPurchaseNotification.productType !== 2
  )
    return notification.voidedPurchaseNotification.purchaseToken;
  return null;
}
