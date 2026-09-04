"""What each notification says, in every language we send it in.

── Why blocks instead of HTML strings ──────────────────────────
Every message here has to exist twice: as HTML for the client that renders it
and as plain text for the client, gateway or screen reader that does not. Two
hand-written copies drift -- the classic failure is a reset code that is in the
HTML and missing from the text part, which nobody notices until a customer on
a locked-down mail gateway cannot sign in.

So a message is a list of small blocks (paragraph, code box, button, note) and
the layout renders each one twice from the same source. Adding a notification
means writing copy, not markup.

── Why the copy is a table, not a translation file ─────────────
The portal translates by English source string (``lib/i18n.tsx``) because a
screen has hundreds of fragments and an untranslated one should degrade to
English. An email has five sentences and a subject line, and a half-translated
one reads worse than either language alone. So each locale gets the whole
message, written for that locale, and a missing locale falls back wholesale.

Locale codes match the portal's ``LangCode`` exactly -- "en" and "th".
"""

from __future__ import annotations

import html
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Union

DEFAULT_LOCALE = "en"
SUPPORTED_LOCALES = ("en", "th")

# Certrace mail identity: the paper-white page and black footer the outreach
# mail already uses, so a transactional message and a human one look like they
# came from the same company.
_PAGE_BACKGROUND = "#F5F4F0"
_CARD_BORDER = "#e0e0e0"
_INK = "#111111"
_BODY_INK = "#333333"
_MUTED_INK = "#6b6b6b"

# Latin faces first for the chrome, then the faces Windows and macOS actually
# ship for Thai. Without the last two, Thai body text falls back to a face with
# no proper tone-mark positioning.
_FONT_STACK = (
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, "
    "'Helvetica Neue', Arial, 'Leelawadee UI', 'Thonburi', sans-serif"
)
_MONO_STACK = "'SF Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace"


@dataclass(frozen=True)
class Paragraph:
    text: str


@dataclass(frozen=True)
class CodeBox:
    """A value the reader has to copy by hand. Big, spaced, selectable."""

    label: str
    value: str


@dataclass(frozen=True)
class Button:
    label: str
    url: str


@dataclass(frozen=True)
class Callout:
    """One short figure the reader has to act on -- a date, a countdown.

    Not a ``CodeBox``: that one is sized for a value copied digit by digit
    into another window, and a due date set in 30px monospace with a code's
    letter-spacing reads as something to retype rather than something to
    diarise. This is the quieter box -- same paper, left aligned, one line.
    """

    label: str
    value: str


@dataclass(frozen=True)
class Note:
    """The "if this wasn't you" line. Quieter, and last."""

    text: str


Block = Union[Paragraph, CodeBox, Callout, Button, Note]


@dataclass(frozen=True)
class Message:
    """One notification in one language, before interpolation."""

    subject: str
    heading: str
    blocks: tuple[Block, ...]


@dataclass(frozen=True)
class RenderedEmail:
    subject: str
    html: str
    text: str


class TemplateNotFoundError(KeyError):
    """No copy is registered for that notification key."""


# ── Copy ──────────────────────────────────────────────────────
# Keyed by notification key, then locale. Placeholders are ``{name}`` and are
# filled from the caller's context; a missing placeholder is a programming
# error and raises rather than shipping a literal "{code}" to a customer.

_PASSWORD_RESET_EN = Message(
    subject="Your Certrace password reset code",
    heading="Reset your password.",
    blocks=(
        Paragraph(
            "We received a request to reset the password for {email} on "
            "Certrace. Enter this code to continue:"
        ),
        CodeBox(label="Verification code", value="{code}"),
        Paragraph(
            "The code expires in {expires_in_minutes} minutes and can only be "
            "used once."
        ),
        Note(
            "If you did not ask for this, nothing has changed and there is "
            "nothing to do — your password is still the one you set. You can "
            "ignore this email."
        ),
    ),
)

_PASSWORD_RESET_TH = Message(
    subject="รหัสสำหรับตั้งรหัสผ่าน Certrace ใหม่",
    heading="ตั้งรหัสผ่านใหม่",
    blocks=(
        Paragraph(
            "มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชี {email} บน Certrace กรอกรหัสด้านล่างเพื่อดำเนินการต่อ"
        ),
        CodeBox(label="รหัสยืนยัน", value="{code}"),
        Paragraph("รหัสนี้ใช้ได้ภายใน {expires_in_minutes} นาที และใช้ได้เพียงครั้งเดียว"),
        Note(
            "หากคุณไม่ได้เป็นผู้ขอ ไม่ต้องดำเนินการใด ๆ "
            "รหัสผ่านของคุณยังไม่ถูกเปลี่ยน และข้ามอีเมลฉบับนี้ได้เลย"
        ),
    ),
)

_PASSWORD_CHANGED_EN = Message(
    subject="Your Certrace password was changed",
    heading="Your password was changed.",
    blocks=(
        Paragraph(
            "The password for {email} was changed on {changed_at}. If that was "
            "you, this email is just your receipt — no action is needed."
        ),
        Note(
            "If it was not you, reset your password immediately and email "
            "{support_email}. Someone else may have access to your account."
        ),
    ),
)

_PASSWORD_CHANGED_TH = Message(
    subject="รหัสผ่าน Certrace ของคุณถูกเปลี่ยนแล้ว",
    heading="รหัสผ่านของคุณถูกเปลี่ยนแล้ว",
    blocks=(
        Paragraph(
            "รหัสผ่านของบัญชี {email} ถูกเปลี่ยนเมื่อ {changed_at} "
            "หากเป็นการดำเนินการของคุณเอง อีเมลฉบับนี้เป็นเพียงการยืนยัน ไม่ต้องทำอะไรเพิ่ม"
        ),
        Note(
            "หากไม่ใช่คุณ กรุณาตั้งรหัสผ่านใหม่ทันที และติดต่อ {support_email} "
            "เพราะอาจมีผู้อื่นเข้าถึงบัญชีของคุณได้"
        ),
    ),
)

# ── Supplier data collection ──────────────────────
# These three go to someone who does not have a Certrace account and did not
# ask to hear from us -- a supplier's plant manager, chased on behalf of their
# customer. So each of them names that customer in the subject line, says what
# the data is for, and offers a way out that is not silence. A chase sequence
# that only ever repeats itself is how a supplier stops opening the mail.
#
# The link is per supplier and per period (``lib/monthly-requests.ts``), which
# is why the note asks them not to forward it rather than trusting them not to.

_SUPPLIER_DATA_REQUEST_EN = Message(
    subject="{exporter_name} needs your {period_label} production data",
    heading="A data request from {exporter_name}.",
    blocks=(
        Paragraph(
            "{exporter_name} is preparing an EU CBAM declaration covering goods "
            "they bought from {supplier_name}, and needs the production and "
            "emissions figures behind your {period_label} deliveries."
        ),
        Callout(label="Due", value="{due_date}"),
        Button(label="Open the form", url="{link_url}"),
        Paragraph(
            "The form asks only for what the declaration needs and saves as you "
            "go, so you can stop partway and come back. What you enter goes to "
            "{exporter_name} and to nobody else."
        ),
        Note(
            "This link is specific to {supplier_name} and to {period_label}, so "
            "please do not forward it. If a colleague is the right person to "
            "fill it in, reply to this email and we will send it to them."
        ),
    ),
)

_SUPPLIER_DATA_REQUEST_TH = Message(
    subject="{exporter_name} ขอข้อมูลการผลิตประจำ{period_label}",
    heading="คำขอข้อมูลจาก {exporter_name}",
    blocks=(
        Paragraph(
            "{exporter_name} กำลังจัดทำรายงาน CBAM ของสหภาพยุโรป "
            "สำหรับสินค้าที่รับซื้อจาก {supplier_name} "
            "จึงขอข้อมูลปริมาณการผลิตและการปล่อยคาร์บอนของรอบ{period_label}"
        ),
        Callout(label="กำหนดส่ง", value="{due_date}"),
        Button(label="เปิดแบบฟอร์ม", url="{link_url}"),
        Paragraph(
            "แบบฟอร์มถามเฉพาะข้อมูลที่รายงานต้องใช้ และบันทึกให้อัตโนมัติระหว่างกรอก "
            "หยุดกลางคันแล้วกลับมากรอกต่อได้ ข้อมูลที่กรอกจะส่งถึง {exporter_name} เท่านั้น "
            "ไม่ถูกเปิดเผยกับผู้อื่น"
        ),
        Note(
            "ลิงก์นี้ใช้ได้เฉพาะ {supplier_name} และเฉพาะรอบ{period_label} "
            "กรุณาอย่าส่งต่อ หากมีเพื่อนร่วมงานที่เหมาะจะเป็นผู้กรอกมากกว่า "
            "กรุณาตอบกลับอีเมลนี้ แล้วเราจะส่งลิงก์ให้ผู้นั้นโดยตรง"
        ),
    ),
)

_SUPPLIER_REMINDER_EN = Message(
    subject="Reminder: {period_label} data for {exporter_name} is due {due_date}",
    heading="Your {period_label} data is still open.",
    blocks=(
        Paragraph(
            "{exporter_name} is still waiting on the production and emissions "
            "figures for your {period_label} deliveries. Nothing has come "
            "through yet."
        ),
        Callout(label="Days left", value="{days_left}"),
        Button(label="Finish the form", url="{link_url}"),
        Paragraph(
            "If you have already started, your answers are still saved — the "
            "link opens where you left off."
        ),
        Note(
            "Already sent these figures another way, or this is not yours to "
            "fill in? Reply to this email and we will stop asking about "
            "{period_label}."
        ),
    ),
)

_SUPPLIER_REMINDER_TH = Message(
    subject="แจ้งเตือน: ข้อมูลรอบ{period_label} สำหรับ {exporter_name} ครบกำหนด {due_date}",
    heading="ข้อมูลรอบ{period_label} ยังไม่ได้ส่ง",
    blocks=(
        Paragraph(
            "{exporter_name} ยังรอข้อมูลปริมาณการผลิตและการปล่อยคาร์บอน "
            "ของรอบ{period_label} อยู่ ขณะนี้ยังไม่ได้รับข้อมูลใด ๆ"
        ),
        Callout(label="เหลืออีก (วัน)", value="{days_left}"),
        Button(label="กรอกแบบฟอร์มต่อ", url="{link_url}"),
        Paragraph(
            "หากเริ่มกรอกไว้แล้ว ข้อมูลยังถูกบันทึกอยู่ "
            "เปิดลิงก์แล้วจะกลับไปยังจุดที่ค้างไว้"
        ),
        Note(
            "หากส่งข้อมูลชุดนี้ให้ทางช่องทางอื่นไปแล้ว "
            "หรือท่านไม่ใช่ผู้รับผิดชอบในการกรอก กรุณาตอบกลับอีเมลนี้ "
            "แล้วเราจะหยุดติดตามรอบ{period_label}"
        ),
    ),
)

# The overdue mail is the one that has to offer a real alternative. Under CBAM
# an exporter with no supplier figure may fall back to the EU default value --
# worse for the supplier's own numbers and dearer for the exporter, but the
# filing proceeds. Saying so turns "chase again" into a decision the supplier
# can actually close, which is the only thing that ends a chase sequence.
_SUPPLIER_OVERDUE_EN = Message(
    subject="Overdue: {period_label} data for {exporter_name}",
    heading="Your {period_label} data is past its date.",
    blocks=(
        Paragraph(
            "The {period_label} figures {exporter_name} asked for were due on "
            "{due_date} and have not arrived. Their CBAM declaration cannot be "
            "completed without them."
        ),
        Callout(label="Days overdue", value="{days_overdue}"),
        Button(label="Open the form", url="{link_url}"),
        Paragraph(
            "If these figures are not going to come, telling us is more useful "
            "than silence. {exporter_name} can fall back to the EU default "
            "values for your goods — that costs them more and reports your "
            "plant as dirtier than it is, but it lets the filing go ahead."
        ),
        Note(
            "Reply to this email to say the data is coming, or that it is not. "
            "Either answer stops the reminders."
        ),
    ),
)

_SUPPLIER_OVERDUE_TH = Message(
    subject="เกินกำหนด: ข้อมูลรอบ{period_label} สำหรับ {exporter_name}",
    heading="ข้อมูลรอบ{period_label} เกินกำหนดแล้ว",
    blocks=(
        Paragraph(
            "ข้อมูลรอบ{period_label} ที่ {exporter_name} ขอไว้ "
            "ครบกำหนดเมื่อ {due_date} และยังไม่ได้รับ "
            "ทำให้รายงาน CBAM ของบริษัทดังกล่าวยังจัดทำไม่เสร็จ"
        ),
        Callout(label="เกินกำหนดมาแล้ว (วัน)", value="{days_overdue}"),
        Button(label="เปิดแบบฟอร์ม", url="{link_url}"),
        Paragraph(
            "หากข้อมูลชุดนี้ส่งให้ไม่ได้ การแจ้งกลับมามีประโยชน์กว่าการเงียบ "
            "เพราะ {exporter_name} สามารถใช้ค่าเริ่มต้น (default value) "
            "ของสหภาพยุโรปแทนได้ ซึ่งทำให้ต้นทุนของผู้ซื้อสูงขึ้น "
            "และทำให้โรงงานของท่านถูกรายงานว่าปล่อยคาร์บอนสูงกว่าความเป็นจริง "
            "แต่อย่างน้อยการยื่นรายงานก็เดินหน้าต่อได้"
        ),
        Note(
            "กรุณาตอบกลับอีเมลนี้เพื่อแจ้งว่าจะส่งข้อมูลให้ หรือส่งให้ไม่ได้ "
            "ไม่ว่าคำตอบใด ระบบจะหยุดส่งการแจ้งเตือน"
        ),
    ),
)


# ── Trial expiry ──────────────────────────────
# WHY THESE TWO CANNOT BE MUTED. When the trial runs out the product says
# nothing: ``certrace-portal/lib/plan.ts`` locks the account into a reading
# room on purpose, with no banner and no dialog, because a "your trial ended"
# ribbon repeated on forty screens is forty things to translate. That decision
# is only defensible if the warning arrives somewhere, and the only somewhere
# left is here. ``notifications.py`` carries the always-on flag that holds it.
#
# Why the ending mail names supplier chasing in particular: the lock also stops
# outbound supplier reminders, so a period still sitting with a supplier
# quietly stops being chased on the day the trial ends. That is the one
# consequence an exporter cannot see coming from inside the product.

_TRIAL_ENDING_EN = Message(
    subject="Your Certrace trial ends in {days_left} days",
    heading="Your trial ends on {ends_on}.",
    blocks=(
        Paragraph(
            "The {trial_days}-day Certrace trial for {org_name} ends on "
            "{ends_on}. Nothing you have built goes anywhere — every workspace, "
            "supplier answer and draft declaration stays exactly as it is."
        ),
        Callout(label="Days left", value="{days_left}"),
        Paragraph(
            "What changes is that the account becomes read-only. You can still "
            "open and read all of it; adding, editing, sending and downloading "
            "stop. Supplier chasing stops with it — so any period still out "
            "with a supplier is worth closing before {ends_on}."
        ),
        Button(label="Choose a plan", url="{billing_url}"),
        Note(
            "Pricing is quoted per account rather than sold at a checkout, so "
            "picking a tier is a short conversation. Reply here and we will "
            "sort it out."
        ),
    ),
)

_TRIAL_ENDING_TH = Message(
    subject="ทดลองใช้ Certrace จะหมดอายุในอีก {days_left} วัน",
    heading="ช่วงทดลองใช้จะสิ้นสุดวันที่ {ends_on}",
    blocks=(
        Paragraph(
            "ช่วงทดลองใช้ Certrace {trial_days} วัน ของ {org_name} "
            "จะสิ้นสุดในวันที่ {ends_on} ข้อมูลที่ทำไว้ทั้งหมดยังอยู่ครบ "
            "ทั้ง workspace คำตอบจากซัพพลายเออร์ และร่างรายงาน"
        ),
        Callout(label="เหลืออีก (วัน)", value="{days_left}"),
        Paragraph(
            "สิ่งที่เปลี่ยนไปคือบัญชีจะกลายเป็นโหมดอ่านอย่างเดียว "
            "ยังเปิดดูข้อมูลทั้งหมดได้ แต่จะเพิ่ม แก้ไข ส่ง และดาวน์โหลดไม่ได้ "
            "รวมถึงระบบจะหยุดติดตามซัพพลายเออร์ด้วย "
            "ดังนั้นรอบไหนที่ยังค้างอยู่กับซัพพลายเออร์ ควรเร่งปิดให้เสร็จก่อนวันที่ {ends_on}"
        ),
        Button(label="เลือกแพ็กเกจ", url="{billing_url}"),
        Note(
            "ราคาเสนอเป็นรายบัญชี ไม่ได้ขายผ่านหน้าชำระเงิน "
            "การเลือกแพ็กเกจจึงเป็นการพูดคุยสั้น ๆ ตอบกลับอีเมลนี้ได้เลย"
        ),
    ),
)

_TRIAL_ENDED_EN = Message(
    subject="Your Certrace trial has ended",
    heading="Your account is now read-only.",
    blocks=(
        Paragraph(
            "The {trial_days}-day trial for {org_name} ended on {ends_on}. "
            "Nothing has been deleted. Every workspace, supplier answer and "
            "draft declaration is still there, and you can still open and read "
            "all of it."
        ),
        Paragraph(
            "What no longer works: adding or editing data, sending supplier "
            "requests, and downloading declarations. Any supplier link still "
            "outstanding has stopped chasing, so a period left open will stay "
            "open until the account is on a plan."
        ),
        Button(label="Choose a plan", url="{billing_url}"),
        Note(
            "Picking a tier puts it all back the way it was — there is no "
            "migration and nothing to restore. Reply here or talk to sales."
        ),
    ),
)

_TRIAL_ENDED_TH = Message(
    subject="ช่วงทดลองใช้ Certrace สิ้นสุดแล้ว",
    heading="บัญชีของคุณอยู่ในโหมดอ่านอย่างเดียวแล้ว",
    blocks=(
        Paragraph(
            "ช่วงทดลองใช้ {trial_days} วัน ของ {org_name} "
            "สิ้นสุดเมื่อวันที่ {ends_on} ไม่มีข้อมูลใดถูกลบ "
            "ทั้ง workspace คำตอบจากซัพพลายเออร์ และร่างรายงาน "
            "ยังอยู่ครบ และยังเปิดอ่านได้ทั้งหมด"
        ),
        Paragraph(
            "สิ่งที่ทำไม่ได้แล้วคือ การเพิ่มหรือแก้ไขข้อมูล "
            "การส่งคำขอไปยังซัพพลายเออร์ และการดาวน์โหลดรายงาน "
            "ลิงก์ที่ยังค้างอยู่กับซัพพลายเออร์จะหยุดติดตาม "
            "รอบที่เปิดค้างไว้จึงจะค้างอยู่อย่างนั้นจนกว่าบัญชีจะเปลี่ยนไปใช้แพ็กเกจ"
        ),
        Button(label="เลือกแพ็กเกจ", url="{billing_url}"),
        Note(
            "เมื่อเลือกแพ็กเกจแล้ว ทุกอย่างจะกลับมาใช้งานได้เหมือนเดิมทันที "
            "ไม่ต้องย้ายข้อมูลและไม่ต้องกู้คืนอะไร "
            "ตอบกลับอีเมลนี้หรือติดต่อฝ่ายขายได้เลย"
        ),
    ),
)


TEMPLATES: dict[str, dict[str, Message]] = {
    "password_reset": {"en": _PASSWORD_RESET_EN, "th": _PASSWORD_RESET_TH},
    "password_changed": {"en": _PASSWORD_CHANGED_EN, "th": _PASSWORD_CHANGED_TH},
    "supplier_data_request": {
        "en": _SUPPLIER_DATA_REQUEST_EN,
        "th": _SUPPLIER_DATA_REQUEST_TH,
    },
    "supplier_submission_reminder": {
        "en": _SUPPLIER_REMINDER_EN,
        "th": _SUPPLIER_REMINDER_TH,
    },
    "supplier_submission_overdue": {
        "en": _SUPPLIER_OVERDUE_EN,
        "th": _SUPPLIER_OVERDUE_TH,
    },
    "trial_ending": {"en": _TRIAL_ENDING_EN, "th": _TRIAL_ENDING_TH},
    "trial_ended": {"en": _TRIAL_ENDED_EN, "th": _TRIAL_ENDED_TH},
}


def normalize_locale(locale: str | None) -> str:
    """Map anything the client sends onto a locale we actually have copy for.

    Accepts ``th-TH`` and ``TH`` as well as ``th`` -- browsers and mobile
    clients all disagree about the shape, and an unfamiliar tag should mean
    English, not a crash.
    """

    if not locale:
        return DEFAULT_LOCALE
    base = locale.strip().lower().replace("_", "-").split("-", 1)[0]
    return base if base in SUPPORTED_LOCALES else DEFAULT_LOCALE


def render(
    notification_key: str,
    locale: str | None,
    context: Mapping[str, object],
    *,
    logo_url: str | None = None,
) -> RenderedEmail:
    """Render one notification into subject, HTML and plain text."""

    by_locale = TEMPLATES.get(notification_key)
    if by_locale is None:
        raise TemplateNotFoundError(notification_key)

    resolved = normalize_locale(locale)
    message = by_locale.get(resolved) or by_locale[DEFAULT_LOCALE]

    subject = _fill(message.subject, context, notification_key)
    heading = _fill(message.heading, context, notification_key)
    blocks = tuple(
        _fill_block(block, context, notification_key) for block in message.blocks
    )

    return RenderedEmail(
        subject=subject,
        html=_to_html(heading, blocks, resolved, logo_url),
        text=_to_text(heading, blocks),
    )


def _fill(template: str, context: Mapping[str, object], key: str) -> str:
    try:
        return template.format(**context)
    except KeyError as error:
        missing = error.args[0] if error.args else "?"
        raise KeyError(f"Template '{key}' needs context value '{missing}'.") from error


def _fill_block(block: Block, context: Mapping[str, object], key: str) -> Block:
    if isinstance(block, Paragraph):
        return Paragraph(_fill(block.text, context, key))
    if isinstance(block, Note):
        return Note(_fill(block.text, context, key))
    if isinstance(block, CodeBox):
        return CodeBox(
            _fill(block.label, context, key), _fill(block.value, context, key)
        )
    if isinstance(block, Callout):
        return Callout(
            _fill(block.label, context, key), _fill(block.value, context, key)
        )
    return Button(_fill(block.label, context, key), _fill(block.url, context, key))


# ── HTML ──────────────────────────────────────────────────────
# Tables and inline styles, because Outlook still does not do flexbox and a
# <style> block is stripped by roughly half of the clients that matter.


def _to_html(
    heading: str,
    blocks: Sequence[Block],
    locale: str,
    logo_url: str | None,
) -> str:
    logo = ""
    if logo_url:
        logo = (
            f'<img src="{html.escape(logo_url, quote=True)}" alt="Certrace" '
            'width="132" style="display:block;border:0;margin-bottom:28px;" />'
        )

    body = "".join(_block_html(block) for block in blocks)

    return f"""<!DOCTYPE html>
<html lang="{html.escape(locale, quote=True)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{html.escape(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:{_PAGE_BACKGROUND};font-family:{_FONT_STACK};">
<table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border:1px solid {_CARD_BORDER};margin:24px auto;border-radius:4px;overflow:hidden;">
<tr><td style="padding:40px 32px;">
{logo}<h1 style="margin:0 0 20px;font-size:22px;font-weight:400;line-height:1.3;color:{_INK};">{html.escape(heading)}</h1>
{body}</td></tr>
<tr><td style="background-color:{_INK};padding:20px;text-align:center;color:#ffffff;font-size:12px;font-family:{_MONO_STACK};">Certrace Carbon Compliance &copy; 2026</td></tr>
</table>
</body>
</html>"""


def _block_html(block: Block) -> str:
    if isinstance(block, Paragraph):
        return (
            f'<p style="margin:0 0 16px;font-size:15px;line-height:1.65;'
            f'color:{_BODY_INK};">{html.escape(block.text)}</p>'
        )
    if isinstance(block, CodeBox):
        return (
            f'<table role="presentation" border="0" cellpadding="0" cellspacing="0" '
            f'width="100%" style="margin:0 0 20px;"><tr><td style="background-color:'
            f"{_PAGE_BACKGROUND};border:1px solid {_CARD_BORDER};border-radius:4px;"
            f'padding:18px 20px;text-align:center;">'
            f'<div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;'
            f'color:{_MUTED_INK};">{html.escape(block.label)}</div>'
            f'<div style="margin-top:8px;font-family:{_MONO_STACK};font-size:30px;'
            f'letter-spacing:0.22em;color:{_INK};">{html.escape(block.value)}</div>'
            f"</td></tr></table>"
        )
    if isinstance(block, Callout):
        return (
            f'<table role="presentation" border="0" cellpadding="0" cellspacing="0" '
            f'style="margin:0 0 20px;"><tr><td style="background-color:'
            f"{_PAGE_BACKGROUND};border:1px solid {_CARD_BORDER};border-radius:4px;"
            f'padding:12px 18px;">'
            f'<span style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;'
            f'color:{_MUTED_INK};">{html.escape(block.label)}</span>'
            f'<span style="color:{_MUTED_INK};"> &nbsp;</span>'
            f'<span style="font-size:16px;font-weight:600;color:{_INK};">'
            f"{html.escape(block.value)}</span>"
            f"</td></tr></table>"
        )
    if isinstance(block, Button):
        return (
            f'<p style="margin:0 0 20px;"><a href="{html.escape(block.url, quote=True)}" '
            f'style="display:inline-block;background-color:{_INK};color:#ffffff;'
            f'text-decoration:none;font-size:14px;padding:12px 22px;border-radius:4px;">'
            f"{html.escape(block.label)}</a></p>"
        )
    return (
        f'<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid {_CARD_BORDER};'
        f'font-size:13px;line-height:1.6;color:{_MUTED_INK};">'
        f"{html.escape(block.text)}</p>"
    )


# ── Plain text ────────────────────────────────────────────────


def _to_text(heading: str, blocks: Sequence[Block]) -> str:
    lines = [heading, ""]
    for block in blocks:
        if isinstance(block, Paragraph):
            lines.extend([block.text, ""])
        elif isinstance(block, CodeBox):
            lines.extend([f"{block.label}: {block.value}", ""])
        elif isinstance(block, Callout):
            lines.extend([f"{block.label}: {block.value}", ""])
        elif isinstance(block, Button):
            lines.extend([f"{block.label}: {block.url}", ""])
        else:
            lines.extend(["--", block.text, ""])
    lines.append("Certrace Carbon Compliance (c) 2026")
    return "\n".join(lines)
