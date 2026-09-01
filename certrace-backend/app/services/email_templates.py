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
class Note:
    """The "if this wasn't you" line. Quieter, and last."""

    text: str


Block = Union[Paragraph, CodeBox, Button, Note]


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

TEMPLATES: dict[str, dict[str, Message]] = {
    "password_reset": {"en": _PASSWORD_RESET_EN, "th": _PASSWORD_RESET_TH},
    "password_changed": {"en": _PASSWORD_CHANGED_EN, "th": _PASSWORD_CHANGED_TH},
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
        elif isinstance(block, Button):
            lines.extend([f"{block.label}: {block.url}", ""])
        else:
            lines.extend(["--", block.text, ""])
    lines.append("Certrace Carbon Compliance (c) 2026")
    return "\n".join(lines)
