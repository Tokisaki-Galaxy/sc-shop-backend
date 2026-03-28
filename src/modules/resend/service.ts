import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import {
  Resend,
  CreateEmailOptions,
} from "resend"

// 注意：这里导入了订单邮件的模板。
// 必须确保你已经按照文档教程在同级目录下创建了 emails/order-placed.tsx
import { orderPlacedEmail } from "./emails/order-placed"

// 定义传递给这个模块的配置项类型
type ResendOptions = {
  api_key: string
  from: string
  html_templates?: Record<string, {
    subject?: string
    content: string
  }>
}

// 依赖注入类型（获取 Medusa 内置的日志记录器）
type InjectedDependencies = {
  logger: Logger
}

// 定义支持的邮件模板类型
enum Templates {
  ORDER_PLACED = "order-placed",
}

// 匹配模板名称和对应的 React 组件
const templates: { [key in Templates]?: (props: any) => React.ReactNode } = {
  [Templates.ORDER_PLACED]: orderPlacedEmail,
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"
  private resendClient: Resend
  private options: ResendOptions
  private logger: Logger

  // 1. 构造函数：初始化 Resend 客户端
  constructor(
    { logger }: InjectedDependencies,
    options: ResendOptions
  ) {
    super()
    this.resendClient = new Resend(options.api_key)
    this.options = options
    this.logger = logger
  }

  // 2. 验证配置：确保环境变量里填了 API Key 和发件人邮箱
  static validateOptions(options: Record<any, any>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `api_key` is required in the provider's options."
      )
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from` is required in the provider's options."
      )
    }
  }

  // 3. 获取模板：根据传入的模板名称，返回对应的 React 组件或 HTML 字符串
  getTemplate(template: Templates) {
    if (this.options.html_templates?.[template]) {
      return this.options.html_templates[template].content
    }
    const allowedTemplates = Object.keys(templates)

    if (!allowedTemplates.includes(template)) {
      return null
    }

    return templates[template]
  }

  // 4. 获取邮件标题：例如“订单确认”
  getTemplateSubject(template: Templates) {
    if (this.options.html_templates?.[template]?.subject) {
      return this.options.html_templates[template].subject
    }
    switch (template) {
      case Templates.ORDER_PLACED:
        return "Order Confirmation" // 如果你想改成中文，可以改成 "订单确认"
      default:
        return "New Email"
    }
  }

  // 5. 核心发送方法：Medusa 触发邮件时会调用这里
  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const template = this.getTemplate(notification.template as Templates)

    if (!template) {
      this.logger.error(`Couldn't find an email template for ${notification.template}. The valid options are ${Object.values(Templates)}`)
      return {}
    }

    const commonOptions = {
      from: this.options.from,
      to: [notification.to],
      subject: this.getTemplateSubject(notification.template as Templates),
    }

    let emailOptions: CreateEmailOptions
    if (typeof template === "string") {
      emailOptions = {
        ...commonOptions,
        html: template,
      }
    } else {
      emailOptions = {
        ...commonOptions,
        react: template(notification.data),
      }
    }

    // 调用 Resend API 发送邮件
    const { data, error } = await this.resendClient.emails.send(emailOptions)

    if (error || !data) {
      if (error) {
        this.logger.error("Failed to send email", error)
      } else {
        this.logger.error("Failed to send email: unknown error")
      }
      return {}
    }

    return { id: data.id }
  }
}

export default ResendNotificationProviderService
