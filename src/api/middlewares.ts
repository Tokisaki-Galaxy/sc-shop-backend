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

const EMAIL_VERIFIED_KEY = "email_verified"

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

  const isVerified = customer.metadata?.[EMAIL_VERIFIED_KEY] === true
  if (!isVerified) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "请先完成邮箱验证后再登录，请检查注册邮箱中的确认链接"
    )
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/auth/customer/emailpass",
      method: ["POST"],
      middlewares: [ensureCustomerEmailVerified],
    },
  ],
})
