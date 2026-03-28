import {
  Text,
  Container,
  Heading,
  Html,
  Section,
  Tailwind,
  Head,
  Preview,
  Body,
  Link,
  Button,
} from "@react-email/components"

export type CustomerEmailVerificationEmailProps = {
  verification_url: string
  email?: string
}

function CustomerEmailVerificationEmailComponent({
  verification_url,
  email,
}: CustomerEmailVerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>请确认你的邮箱地址</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                验证你的邮箱
              </Heading>
            </Section>

            <Section className="my-[32px]">
              <Text className="text-black text-[14px] leading-[24px]">
                你好{email ? ` ${email}` : ""}，
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                请点击下方按钮确认你的邮箱地址，确认后才能登录账号。
              </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={verification_url}
              >
                确认邮箱
              </Button>
            </Section>

            <Section className="my-[32px]">
              <Text className="text-black text-[14px] leading-[24px]">
                如果按钮无法点击，请复制下面链接到浏览器打开：
              </Text>
              <Link
                href={verification_url}
                className="text-blue-600 no-underline text-[14px] leading-[24px] break-all"
              >
                {verification_url}
              </Link>
            </Section>

            <Section className="mt-[32px]">
              <Text className="text-[#666666] text-[12px] leading-[24px]">
                如果这不是你的操作，可以忽略此邮件。
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const customerEmailVerificationEmail = (
  props: CustomerEmailVerificationEmailProps
) => <CustomerEmailVerificationEmailComponent {...props} />

const mockVerification: CustomerEmailVerificationEmailProps = {
  verification_url: "https://your-app.com/store/customers/verify-email?token=sample-token&email=user%40example.com",
  email: "user@example.com",
}

export default () => <CustomerEmailVerificationEmailComponent {...mockVerification} />
