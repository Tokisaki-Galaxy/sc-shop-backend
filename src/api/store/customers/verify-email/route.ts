import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

const EMAIL_VERIFIED_KEY = "email_verified"
const EMAIL_VERIFICATION_TOKEN_KEY = "email_verification_token"
const EMAIL_VERIFICATION_TOKEN_EXPIRES_AT_KEY = "email_verification_token_expires_at"

type VerifyEmailBody = {
  token?: string
  email?: string
}

async function verifyCustomerEmail(
  req: MedusaRequest<VerifyEmailBody>,
  res: MedusaResponse
) {
  const token = req.body?.token ?? (req.query?.token as string | undefined)
  const email = req.body?.email ?? (req.query?.email as string | undefined)

  if (!token || !email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "缺少邮箱验证参数"
    )
  }

  const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
  const [customer] = await customerModuleService.listCustomers({ email })

  if (!customer) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "用户不存在")
  }

  const metadata = customer.metadata ?? {}
  const storedToken = metadata[EMAIL_VERIFICATION_TOKEN_KEY]
  const expiresAt = metadata[EMAIL_VERIFICATION_TOKEN_EXPIRES_AT_KEY]

  if (typeof storedToken !== "string" || storedToken !== token) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "邮箱验证链接无效"
    )
  }

  if (typeof expiresAt !== "string" || Number.isNaN(Date.parse(expiresAt))) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "邮箱验证链接无效"
    )
  }

  if (Date.now() > Date.parse(expiresAt)) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "邮箱验证链接已过期，请重新注册或联系支持"
    )
  }

  await customerModuleService.updateCustomers(customer.id, {
    metadata: {
      ...metadata,
      [EMAIL_VERIFIED_KEY]: true,
      [EMAIL_VERIFICATION_TOKEN_KEY]: null,
      [EMAIL_VERIFICATION_TOKEN_EXPIRES_AT_KEY]: null,
    },
  })

  res.status(200).json({
    success: true,
    message: "邮箱验证成功，现在可以登录了",
  })
}

export const GET = verifyCustomerEmail
export const POST = verifyCustomerEmail
