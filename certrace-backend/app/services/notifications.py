"""The notification catalog: what we send, and whether we are allowed to.

Every outbound message is registered here against one of the six categories
the portal already shows in Settings > Notifications
(``certrace-portal/lib/notification-prefs.ts``). The names match on purpose:
the day preferences move off ``localStorage`` and onto the account, the
server-side check is already written and only its input changes.

Two categories of thing are deliberately *not* here:

* **Delivery.** ``email`` owns the provider.
* **Copy.** ``email_templates`` owns the words.

What is here is the decision -- who gets told about what, and when we stay
quiet. That is the part with the security consequences, so it is the part
worth being able to read on one screen.
"""

from __future__ import annotations

import logging
from collections.abc import Mapping
from dataclasses import dataclass
from enum import Enum

from app.services import email_templates
from app.services.email import EmailDeliveryError, EmailMessage, EmailTransport

_LOGGER = logging.getLogger(__name__)


class Category(str, Enum):
    """Mirrors ``PrefKey`` in the portal. Do not rename without renaming both."""

    SECURITY = "security"
    DECLARATIONS = "declarations"
    SUPPLIERS = "suppliers"
    AI_REVIEW = "ai_review"
    DOCUMENTS = "documents"
    PRODUCT = "product"


@dataclass(frozen=True)
class NotificationType:
    key: str
    category: Category
    # An account-safety message the recipient cannot switch off. The Settings
    # screen already renders the security row as locked; this is the same rule
    # on the server, where it is the one that actually holds.
    always_on: bool = False
    # The recipient is not the account holder -- a supplier being asked for
    # figures on their customer's behalf. Account preferences are the wrong
    # question for these: the "suppliers" row in Settings governs what the
    # EXPORTER is told about their suppliers, and reading it as permission to
    # write to the supplier means an exporter who mutes their own digest
    # silently stops their own data collection. Recipients outside the account
    # opt out by replying, which every one of these emails invites.
    to_third_party: bool = False


PASSWORD_RESET = NotificationType(
    key="password_reset",
    category=Category.SECURITY,
    always_on=True,
)

PASSWORD_CHANGED = NotificationType(
    key="password_changed",
    category=Category.SECURITY,
    always_on=True,
)

# ── Supplier data collection ──────────────────────
# All three go out to the supplier, not to the exporter -- see
# ``to_third_party``. Which one to send is a question about the request's age,
# and it belongs to whatever schedules the chase, not here.

SUPPLIER_DATA_REQUEST = NotificationType(
    key="supplier_data_request",
    category=Category.SUPPLIERS,
    to_third_party=True,
)

SUPPLIER_SUBMISSION_REMINDER = NotificationType(
    key="supplier_submission_reminder",
    category=Category.SUPPLIERS,
    to_third_party=True,
)

SUPPLIER_SUBMISSION_OVERDUE = NotificationType(
    key="supplier_submission_overdue",
    category=Category.SUPPLIERS,
    to_third_party=True,
)


# ── Trial expiry ──────────────────────────────────
# Filed under PRODUCT because it is the closest of the six the portal offers,
# and pinned always-on because the category is the wrong lever: "product
# updates" is a row people turn off to hear less from us, and the cost of
# turning it off must not be an account that goes read-only without warning.
# The product itself is silent about the lock by design (portal lib/plan.ts),
# so these two emails are the whole of the notice.
#
# If a `billing` row ever lands in the portal's PrefKey union, these move to it
# and the always-on flag stays: an expiry notice is account-safety in the same
# sense a password change is.

TRIAL_ENDING = NotificationType(
    key="trial_ending",
    category=Category.PRODUCT,
    always_on=True,
)

TRIAL_ENDED = NotificationType(
    key="trial_ended",
    category=Category.PRODUCT,
    always_on=True,
)


CATALOG: dict[str, NotificationType] = {
    notification.key: notification
    for notification in (
        PASSWORD_RESET,
        PASSWORD_CHANGED,
        SUPPLIER_DATA_REQUEST,
        SUPPLIER_SUBMISSION_REMINDER,
        SUPPLIER_SUBMISSION_OVERDUE,
        TRIAL_ENDING,
        TRIAL_ENDED,
    )
}


def is_muted(
    notification: NotificationType,
    preferences: Mapping[str, bool] | None,
) -> bool:
    """Has the recipient turned this category off?

    ``None`` means we have no preferences for this person -- which is the
    normal case today, because they live in the browser. Unknown means send:
    silently dropping a password reset because we could not find a preference
    is a worse failure than one unwanted email.

    A ``to_third_party`` message is never muted here even when preferences are
    supplied, because the preferences on hand belong to the account, and the
    recipient is not in it.
    """

    if notification.always_on or notification.to_third_party or preferences is None:
        return False
    return preferences.get(notification.category.value, True) is False


def send(
    transport: EmailTransport,
    notification: NotificationType,
    *,
    to: str,
    locale: str | None,
    context: Mapping[str, object],
    preferences: Mapping[str, bool] | None = None,
    logo_url: str | None = None,
) -> str | None:
    """Render and deliver one notification.

    Returns the provider's id, or ``None`` if the recipient has this category
    switched off. Raises ``EmailDeliveryError`` if the provider refused it --
    callers that cannot act on a failure should use :func:`send_quietly`.
    """

    if is_muted(notification, preferences):
        _LOGGER.info(
            "Skipped %s for %s: category %s is off.",
            notification.key,
            redact_address(to),
            notification.category.value,
        )
        return None

    rendered = email_templates.render(
        notification.key, locale, context, logo_url=logo_url
    )
    message = EmailMessage(
        to=to,
        subject=rendered.subject,
        html=rendered.html,
        text=rendered.text,
        tags={"notification": notification.key.replace("_", "-")},
    )
    provider_id = transport.send(message)
    _LOGGER.info(
        "Sent %s to %s (provider id %s).",
        notification.key,
        redact_address(to),
        provider_id,
    )
    return provider_id


def send_quietly(
    transport: EmailTransport,
    notification: NotificationType,
    *,
    to: str,
    locale: str | None,
    context: Mapping[str, object],
    preferences: Mapping[str, bool] | None = None,
    logo_url: str | None = None,
) -> None:
    """:func:`send`, with delivery failures logged instead of raised.

    This is what a background task calls. By the time it runs, the HTTP
    response has already gone out; an exception here would land in the server
    log as an unhandled error with no request to attach it to, which reads
    like a crash rather than the delivery problem it is.
    """

    try:
        send(
            transport,
            notification,
            to=to,
            locale=locale,
            context=context,
            preferences=preferences,
            logo_url=logo_url,
        )
    except EmailDeliveryError as error:
        _LOGGER.error(
            "Could not send %s to %s: %s", notification.key, redact_address(to), error
        )
    except Exception:
        _LOGGER.exception(
            "Unexpected failure sending %s to %s", notification.key, redact_address(to)
        )


def redact_address(address: str) -> str:
    """Enough of an address to trace a support ticket, not enough to leak a list."""

    local, separator, domain = address.partition("@")
    if not separator:
        return "***"
    visible = local[:2] if len(local) > 3 else local[:1]
    return f"{visible}***@{domain}"
