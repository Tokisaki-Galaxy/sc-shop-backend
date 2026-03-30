import { MedusaError } from "@medusajs/framework/utils"

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

interface TurnstileVerifyResponse {
  success: boolean
  "error-codes"?: string[]
  challenge_ts?: string
  hostname?: string
  action?: string
  cdata?: string
}

export interface TurnstileVerifyResult {
  success: boolean
  errorCodes?: string[]
  challengeTimestamp?: string
  hostname?: string
  status?: number
}

/**
 * Verify a Turnstile token with Cloudflare's siteverify API.
 * 
 * @param token - The turnstile response token from the client
 * @param remoteIp - Optional client IP address
 * @returns Verification result
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  if (!secretKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Turnstile secret key not configured"
    )
  }

  if (!token || typeof token !== "string") {
    return {
      success: false,
      errorCodes: ["invalid-input-response"],
    }
  }

  // Token length sanity check
  if (token.length > 2048) {
    return {
      success: false,
      errorCodes: ["invalid-input-response"],
    }
  }

  try {
    const formData = new URLSearchParams()
    formData.append("secret", secretKey)
    formData.append("response", token)
    
    if (remoteIp) {
      formData.append("remoteip", remoteIp)
    }

    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      throw new Error(`Siteverify responded with ${response.status}`)
    }

    const result: TurnstileVerifyResponse = await response.json()

    return {
      success: result.success,
      errorCodes: result["error-codes"],
      challengeTimestamp: result.challenge_ts,
      hostname: result.hostname,
      status: response.status,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[turnstile] verification request failed", {
      error: errorMessage,
      hasRemoteIp: Boolean(remoteIp),
    })
    return {
      success: false,
      errorCodes: ["internal-error"],
    }
  }
}

/**
 * Check if Turnstile is configured (has secret key).
 */
export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY)
}
