import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  EMAIL_VERIFIED_KEY,
  EMAIL_VERIFICATION_TOKEN_EXPIRES_AT_KEY,
  EMAIL_VERIFICATION_TOKEN_KEY,
} from "../../../../lib/email-verification"

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

  if (typeof expiresAt !== "string") {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "邮箱验证链接无效"
    )
  }

  const expiresAtTimestamp = Date.parse(expiresAt)
  if (Number.isNaN(expiresAtTimestamp)) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "邮箱验证链接无效"
    )
  }

  if (Date.now() > expiresAtTimestamp) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "邮箱验证链接已过期，请重新注册或联系支持"
    )
  }

  const nextMetadata = { ...metadata }
  delete nextMetadata[EMAIL_VERIFICATION_TOKEN_KEY]
  delete nextMetadata[EMAIL_VERIFICATION_TOKEN_EXPIRES_AT_KEY]

  await customerModuleService.updateCustomers(customer.id, {
    metadata: {
      ...nextMetadata,
      [EMAIL_VERIFIED_KEY]: true,
    },
  })

  res.status(200).json({
    success: true,
    message: "邮箱验证成功，现在可以登录了",
  })
}

export const GET = verifyCustomerEmail
export const POST = verifyCustomerEmail
