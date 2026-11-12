import { config } from "./config";

export const EMAIL_KINDS = [
  "application_received",
  "admin_new_signup",
  "account_approved",
  "account_rejected",
  "trial_ending_7",
  "trial_ending_1",
  "trial_ended",
  "password_changed",
  "legal_updated",
] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number];
type Copy = { subject: string; text: string; label?: string; path?: string };

const T: Record<EmailKind, Record<"en" | "th", Copy>> = {
  application_received: {
    en: {
      subject: "We received your Certrace application",
      text: "Hi {name},\n\nThanks for registering {company}. Our team reviews every new account. We will email you as soon as your account is approved, and your 30-day free trial starts then.",
    },
    th: {
      subject: "Certrace ได้รับใบสมัครของคุณแล้ว",
      text: "สวัสดีคุณ {name}\n\nขอบคุณที่ลงทะเบียน {company} ทีมงานจะตรวจสอบบัญชีใหม่ทุกบัญชี เราจะส่งอีเมลแจ้งทันทีเมื่อบัญชีได้รับการอนุมัติ และช่วงทดลองใช้ฟรี 30 วันจะเริ่มนับจากวันนั้น",
    },
  },
  admin_new_signup: {
    en: {
      subject: "New Certrace sign-up waiting for approval",
      text: "{name} ({email}) from {company} finished onboarding and is waiting for approval.",
      label: "Open admin",
      path: "/admin",
    },
    th: {
      subject: "มีผู้สมัคร Certrace ใหม่รออนุมัติ",
      text: "{name} ({email}) จาก {company} กรอกข้อมูลครบแล้วและกำลังรออนุมัติ",
      label: "เปิดหน้าแอดมิน",
      path: "/admin",
    },
  },
  account_approved: {
    en: {
      subject: "Your Certrace account is approved",
      text: "Hi {name},\n\nYour account is approved. Your 30-day free trial starts today.",
      label: "Sign in",
      path: "/login",
    },
    th: {
      subject: "บัญชี Certrace ของคุณได้รับการอนุมัติแล้ว",
      text: "สวัสดีคุณ {name}\n\nบัญชีของคุณได้รับการอนุมัติแล้ว ช่วงทดลองใช้ฟรี 30 วันเริ่มวันนี้",
      label: "เข้าสู่ระบบ",
      path: "/login",
    },
  },
  account_rejected: {
    en: {
      subject: "About your Certrace application",
      text: "Hi {name},\n\nWe could not approve your account. Reason: {reason}\n\nReply to this email if you think this is a mistake.",
    },
    th: {
      subject: "เกี่ยวกับใบสมัคร Certrace ของคุณ",
      text: "สวัสดีคุณ {name}\n\nเราไม่สามารถอนุมัติบัญชีของคุณได้ เหตุผล: {reason}\n\nหากคิดว่าเกิดข้อผิดพลาด ตอบกลับอีเมลนี้ได้เลย",
    },
  },
  trial_ending_7: {
    en: {
      subject: "Your Certrace trial ends in {days} days",
      text: "Hi {name},\n\nYour free trial ends in {days} days. Choose a plan to keep editing your workspaces.",
      label: "Choose a plan",
      path: "/billing",
    },
    th: {
      subject: "ช่วงทดลองใช้ Certrace เหลืออีก {days} วัน",
      text: "สวัสดีคุณ {name}\n\nช่วงทดลองใช้ฟรีจะหมดในอีก {days} วัน เลือกแพ็กเกจเพื่อแก้ไขข้อมูลต่อได้",
      label: "เลือกแพ็กเกจ",
      path: "/billing",
    },
  },
  trial_ending_1: {
    en: {
      subject: "Your Certrace trial ends tomorrow",
      text: "Hi {name},\n\nYour free trial ends tomorrow. Your data stays safe; editing pauses until you choose a plan.",
      label: "Choose a plan",
      path: "/billing",
    },
    th: {
      subject: "ช่วงทดลองใช้ Certrace หมดพรุ่งนี้",
      text: "สวัสดีคุณ {name}\n\nช่วงทดลองใช้ฟรีหมดพรุ่งนี้ ข้อมูลของคุณยังอยู่ครบ แต่จะแก้ไขไม่ได้จนกว่าจะเลือกแพ็กเกจ",
      label: "เลือกแพ็กเกจ",
      path: "/billing",
    },
  },
  trial_ended: {
    en: {
      subject: "Your Certrace trial has ended",
      text: "Hi {name},\n\nYour free trial has ended. You can still sign in and read your data. Choose a plan to edit again.",
      label: "Choose a plan",
      path: "/billing",
    },
    th: {
      subject: "ช่วงทดลองใช้ Certrace สิ้นสุดแล้ว",
      text: "สวัสดีคุณ {name}\n\nช่วงทดลองใช้ฟรีสิ้นสุดแล้ว คุณยังเข้าสู่ระบบและดูข้อมูลได้ เลือกแพ็กเกจเพื่อแก้ไขต่อ",
      label: "เลือกแพ็กเกจ",
      path: "/billing",
    },
  },
  password_changed: {
    en: {
      subject: "Your Certrace password was changed",
      text: "Hi {name},\n\nThe password for {email} was just changed. If this was not you, reset it now and contact support.",
      label: "Reset password",
      path: "/forgot-password",
    },
    th: {
      subject: "รหัสผ่าน Certrace ของคุณถูกเปลี่ยน",
      text: "สวัสดีคุณ {name}\n\nรหัสผ่านของ {email} เพิ่งถูกเปลี่ยน หากไม่ใช่คุณ ให้รีเซ็ตรหัสผ่านทันทีและติดต่อฝ่ายสนับสนุน",
      label: "รีเซ็ตรหัสผ่าน",
      path: "/forgot-password",
    },
  },
  legal_updated: {
    en: {
      subject: "We updated the Certrace Terms and Privacy Policy",
      text: "Hi {name},\n\nWe updated our Terms of Service and Privacy Policy. You will be asked to accept them the next time you sign in.",
      label: "Read the Terms",
      path: "/legal/terms",
    },
    th: {
      subject: "Certrace ปรับปรุงข้อกำหนดและนโยบายความเป็นส่วนตัว",
      text: "สวัสดีคุณ {name}\n\nเราปรับปรุงข้อกำหนดการใช้บริการและนโยบายความเป็นส่วนตัว ระบบจะให้คุณยอมรับเมื่อเข้าสู่ระบบครั้งถัดไป",
      label: "อ่านข้อกำหนด",
      path: "/legal/terms",
    },
  },
};

const fill = (s: string, vars: Record<string, string>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

export function renderEmail(
  kind: EmailKind,
  locale: "th" | "en",
  vars: Record<string, string>,
) {
  const c = T[kind][locale];
  return {
    // A line break in a substituted value must not start a new mail header.
    subject: fill(c.subject, vars).replace(/[\r\n]+/g, " "),
    text: fill(c.text, vars),
    ...(c.label && c.path
      ? {
          action: {
            label: c.label,
            url: config.appUrl.replace(/\/$/, "") + c.path,
          },
        }
      : {}),
  };
}
