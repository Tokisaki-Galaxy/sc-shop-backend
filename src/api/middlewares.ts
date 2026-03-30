import {
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { EMAIL_VERIFIED_KEY } from "../lib/email-verification"
import { verifyTurnstileToken, isTurnstileConfigured } from "../lib/turnstile"

async function ensureCustomerEmailVerified(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const email = (req.body as { email?: string } | undefined)?.email

  if (!email || typeof email !== "string") {
    next()
    return
  }

  const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
  const [customer] = await customerModuleService.listCustomers({ email })

  if (!customer) {
    next()
    return
  }

  const emailVerifiedMeta = customer.metadata?.[EMAIL_VERIFIED_KEY]
  if (typeof emailVerifiedMeta !== "boolean") {
    next()
    return
  }

  if (emailVerifiedMeta !== true) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "请先完成邮箱验证后再登录，请检查注册邮箱中的确认链接"
    )
  }

  next()
}

async function verifyTurnstile(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Skip if Turnstile is not configured
  if (!isTurnstileConfigured()) {
    next()
    return
  }

  const body = req.body as { turnstile_token?: string } | undefined
  const turnstileToken = body?.turnstile_token

  if (!turnstileToken) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "验证码验证失败，请刷新页面重试"
    )
  }

  // Get client IP from common headers
  const clientIp =
    (req.headers["cf-connecting-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.ip

  const result = await verifyTurnstileToken(turnstileToken, clientIp)

  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "验证码验证失败，请刷新页面重试"
    )
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/auth/customer/emailpass",
      method: ["POST"],
      middlewares: [verifyTurnstile, ensureCustomerEmailVerified],
    },
    {
      matcher: "/auth/customer/emailpass/register",
      method: ["POST"],
      middlewares: [verifyTurnstile],
    },
  ],
})
