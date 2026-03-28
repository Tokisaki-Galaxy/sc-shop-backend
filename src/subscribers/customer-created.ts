import crypto from "node:crypto"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import {
  EMAIL_VERIFIED_KEY,
  EMAIL_VERIFICATION_TOKEN_EXPIRES_AT_KEY,
  EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_MS,
  EMAIL_VERIFICATION_TOKEN_KEY,
} from "../lib/email-verification"

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const customerModuleService = container.resolve(Modules.CUSTOMER)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const config = container.resolve("configModule")

  const customer = await customerModuleService.retrieveCustomer(data.id)
  if (!customer.has_account) {
    return
  }

  const verificationToken = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(
    Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_MS
  ).toISOString()

  await customerModuleService.updateCustomers(customer.id, {
    metadata: {
      ...(customer.metadata ?? {}),
      [EMAIL_VERIFIED_KEY]: false,
      [EMAIL_VERIFICATION_TOKEN_KEY]: verificationToken,
      [EMAIL_VERIFICATION_TOKEN_EXPIRES_AT_KEY]: expiresAt,
    },
  })

  const backendUrl =
    config.admin.backendUrl !== "/" ? config.admin.backendUrl : "http://localhost:9000"
  const verificationUrl = `${backendUrl}/store/customers/verify-email?token=${verificationToken}&email=${encodeURIComponent(customer.email)}`

  await notificationModuleService.createNotifications({
    to: customer.email,
    channel: "email",
    template: "customer-email-verification",
    data: {
      verification_url: verificationUrl,
      email: customer.email,
    },
  })
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
