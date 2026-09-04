"""Unit tests for the email transport, templates and notification catalog."""

from __future__ import annotations

import email.message
import io
import json
import urllib.error
import urllib.request

import pytest
from conftest import ExplodingTransport, RecordingTransport, settings

from app.services import email_templates, notifications
from app.services.email import (
    ConsoleTransport,
    EmailDeliveryError,
    EmailMessage,
    NullTransport,
    ResendTransport,
    transport_from_env,
)

RESET_CONTEXT = {
    "email": "wasawat@siamsteel.co.th",
    "code": "482913",
    "expires_in_minutes": 15,
}

REMINDER_CONTEXT = {
    "supplier_name": "Xingda Steel Cord (Thailand)",
    "exporter_name": "Siam Steel",
    "period_label": "March 2026",
    "due_date": "10 April 2026",
    "days_left": 3,
    "link_url": "https://app.certrace.co/s/tok_9f2a",
}

TRIAL_CONTEXT = {
    "org_name": "Siam Steel",
    "trial_days": 30,
    "ends_on": "3 September 2026",
    "days_left": 5,
    "billing_url": "https://app.certrace.co/billing",
}


# ── Templates ─────────────────────────────────────────────────


def test_reset_code_appears_in_both_html_and_text() -> None:
    """The plain-text part is not decoration -- some clients show only it."""

    rendered = email_templates.render("password_reset", "en", RESET_CONTEXT)

    assert "482913" in rendered.html
    assert "482913" in rendered.text
    assert "wasawat@siamsteel.co.th" in rendered.text
    assert "15" in rendered.text


def test_thai_locale_renders_thai_copy() -> None:
    english = email_templates.render("password_reset", "en", RESET_CONTEXT)
    thai = email_templates.render("password_reset", "th", RESET_CONTEXT)

    assert thai.subject != english.subject
    assert "รหัสยืนยัน" in thai.text
    assert "482913" in thai.text
    assert 'lang="th"' in thai.html


def test_regional_and_unknown_locales_resolve_sensibly() -> None:
    """A client may send "th-TH", "TH" or something we have never heard of."""

    assert email_templates.normalize_locale("th-TH") == "th"
    assert email_templates.normalize_locale("TH") == "th"
    assert email_templates.normalize_locale("en-GB") == "en"
    assert email_templates.normalize_locale("de") == "en"
    assert email_templates.normalize_locale(None) == "en"


def test_context_values_are_escaped_in_html() -> None:
    """An address is attacker-supplied: /forgot-password accepts any email."""

    rendered = email_templates.render(
        "password_reset",
        "en",
        {**RESET_CONTEXT, "email": "a<script>alert(1)</script>@b.co"},
    )

    assert "<script>" not in rendered.html
    assert "&lt;script&gt;" in rendered.html


def test_missing_context_value_raises_rather_than_shipping_a_placeholder() -> None:
    with pytest.raises(KeyError) as caught:
        email_templates.render("password_reset", "en", {"email": "a@b.co"})

    assert "code" in str(caught.value)


def test_unknown_template_raises() -> None:
    with pytest.raises(email_templates.TemplateNotFoundError):
        email_templates.render("no_such_notification", "en", {})


def test_logo_is_included_only_when_configured() -> None:
    without = email_templates.render("password_reset", "en", RESET_CONTEXT)
    with_logo = email_templates.render(
        "password_reset", "en", RESET_CONTEXT, logo_url="https://certrace.co/l.png"
    )

    assert "<img" not in without.html
    assert 'src="https://certrace.co/l.png"' in with_logo.html


def test_a_reminders_link_survives_into_the_plain_text_part() -> None:
    """A supplier who cannot see HTML still has to be able to reach the form.

    The button is the whole point of the message; a text part that renders the
    label and drops the URL is a reminder to do something with no way to do it.
    """

    rendered = email_templates.render(
        "supplier_submission_reminder", "en", REMINDER_CONTEXT
    )

    assert "https://app.certrace.co/s/tok_9f2a" in rendered.html
    assert "https://app.certrace.co/s/tok_9f2a" in rendered.text
    assert "March 2026" in rendered.subject


def test_a_callout_figure_is_in_both_parts() -> None:
    rendered = email_templates.render("trial_ending", "en", TRIAL_CONTEXT)

    assert "Days left" in rendered.html
    assert "Days left: 5" in rendered.text


def test_supplier_reminders_name_the_exporter_in_every_locale() -> None:
    """The supplier has no relationship with us -- only with their customer.
    A subject line that leads with Certrace reads as spam to them.
    """

    for locale in email_templates.SUPPORTED_LOCALES:
        for key in (
            "supplier_data_request",
            "supplier_submission_reminder",
            "supplier_submission_overdue",
        ):
            context = {**REMINDER_CONTEXT, "days_overdue": 4}
            rendered = email_templates.render(key, locale, context)
            assert "Siam Steel" in rendered.subject, (key, locale)


def test_a_supplier_name_is_escaped_in_html() -> None:
    """Supplier names are typed by the exporter, so they are user input."""

    rendered = email_templates.render(
        "supplier_submission_reminder",
        "en",
        {**REMINDER_CONTEXT, "supplier_name": "<script>alert(1)</script>"},
    )

    assert "<script>" not in rendered.html


def test_thai_trial_copy_is_thai() -> None:
    english = email_templates.render("trial_ending", "en", TRIAL_CONTEXT)
    thai = email_templates.render("trial_ending", "th", TRIAL_CONTEXT)

    assert thai.subject != english.subject
    assert "\u0e17\u0e14\u0e25\u0e2d\u0e07\u0e43\u0e0a\u0e49" in thai.subject
    assert 'lang="th"' in thai.html


# ── Catalog ───────────────────────────────────────────────────


def test_security_notifications_ignore_preferences() -> None:
    """The Settings screen locks the security row; the server has to agree."""

    transport = RecordingTransport()

    provider_id = notifications.send(
        transport,
        notifications.PASSWORD_RESET,
        to="a@b.co",
        locale="en",
        context=RESET_CONTEXT,
        preferences={"security": False},
    )

    assert provider_id == "recorded-1"
    assert len(transport.sent) == 1


def test_a_switched_off_category_is_not_sent() -> None:
    transport = RecordingTransport()
    # Reuses the reset copy under a switchable category: what is under test
    # is the preference check, not the wording.
    optional = notifications.NotificationType(
        key="password_reset", category=notifications.Category.SUPPLIERS
    )

    assert (
        notifications.send(
            transport,
            optional,
            to="a@b.co",
            locale="en",
            context=RESET_CONTEXT,
            preferences={"suppliers": False},
        )
        is None
    )
    assert transport.sent == []


def test_unknown_preferences_mean_send() -> None:
    """Losing a password reset because we could not find a preference is worse
    than sending one the recipient did not want."""

    transport = RecordingTransport()
    optional = notifications.NotificationType(
        key="password_reset", category=notifications.Category.SUPPLIERS
    )

    notifications.send(
        transport,
        optional,
        to="a@b.co",
        locale="en",
        context=RESET_CONTEXT,
        preferences=None,
    )

    assert len(transport.sent) == 1


def test_send_quietly_swallows_a_provider_failure() -> None:
    """It runs after the response has gone; there is no one left to tell."""

    transport = ExplodingTransport(EmailDeliveryError("HTTP 403: domain not verified"))

    notifications.send_quietly(
        transport,
        notifications.PASSWORD_RESET,
        to="a@b.co",
        locale="en",
        context=RESET_CONTEXT,
    )

    assert transport.attempts == 1


def test_categories_match_the_portal_preference_keys() -> None:
    """Mirrors certrace-portal/lib/notification-prefs.ts -- drift breaks the
    server-side check the moment preferences move off localStorage."""

    assert {category.value for category in notifications.Category} == {
        "security",
        "declarations",
        "suppliers",
        "ai_review",
        "documents",
        "product",
    }


def test_an_exporters_preferences_cannot_silence_their_own_supplier_chasing() -> None:
    """The "suppliers" row governs what the EXPORTER is told about suppliers.

    Reading it as consent to write to the supplier would mean an exporter who
    mutes their own digest stops collecting data and is never told why.
    """

    transport = RecordingTransport()

    provider_id = notifications.send(
        transport,
        notifications.SUPPLIER_SUBMISSION_REMINDER,
        to="plant@xingdathai.com",
        locale="th",
        context=REMINDER_CONTEXT,
        preferences={"suppliers": False},
    )

    assert provider_id == "recorded-1"
    assert len(transport.sent) == 1


def test_trial_expiry_ignores_the_product_preference() -> None:
    """Nothing in the product says the trial ended -- portal lib/plan.ts locks
    the account silently on purpose. Muting "product updates" must not be a way
    to lose an account without notice."""

    transport = RecordingTransport()

    for notification in (notifications.TRIAL_ENDING, notifications.TRIAL_ENDED):
        notifications.send(
            transport,
            notification,
            to="a@b.co",
            locale="en",
            context=TRIAL_CONTEXT,
            preferences={"product": False},
        )

    assert len(transport.sent) == 2


def test_every_catalog_entry_has_copy_in_every_locale() -> None:
    for key in notifications.CATALOG:
        for locale in email_templates.SUPPORTED_LOCALES:
            assert email_templates.TEMPLATES[key][locale].subject


# ── Resend transport ──────────────────────────────────────────


def _message() -> EmailMessage:
    return EmailMessage(
        to="a@b.co",
        subject="Subject",
        html="<p>Body</p>",
        text="Body",
        tags={"notification": "password-reset"},
    )


def _http_error(status: int, body: bytes = b"{}") -> urllib.error.HTTPError:
    return urllib.error.HTTPError(
        "https://api.resend.com/emails",
        status,
        "error",
        email.message.Message(),
        io.BytesIO(body),
    )


def test_resend_posts_the_expected_payload() -> None:
    captured: list[urllib.request.Request] = []

    def opener(request: urllib.request.Request, timeout: float) -> bytes:
        captured.append(request)
        return b'{"id": "3f1e-provider-id"}'

    transport = ResendTransport(
        "re_test_key",
        "Certrace <contact@certrace.co>",
        reply_to="contact@certrace.co",
        opener=opener,
    )

    assert transport.send(_message()) == "3f1e-provider-id"

    request = captured[0]
    assert request.full_url == "https://api.resend.com/emails"
    assert request.get_header("Authorization") == "Bearer re_test_key"
    payload = json.loads(request.data.decode("utf-8"))
    assert payload["from"] == "Certrace <contact@certrace.co>"
    assert payload["to"] == ["a@b.co"]
    assert payload["reply_to"] == "contact@certrace.co"
    assert payload["text"] == "Body"
    assert payload["tags"] == [{"name": "notification", "value": "password-reset"}]


def test_resend_retries_a_rate_limit_and_then_succeeds() -> None:
    responses = [_http_error(429), b'{"id": "second-try"}']

    def opener(request: urllib.request.Request, timeout: float) -> bytes:
        item = responses.pop(0)
        if isinstance(item, Exception):
            raise item
        return item

    transport = ResendTransport(
        "k", "s@certrace.co", opener=opener, sleep=lambda _: None
    )

    assert transport.send(_message()) == "second-try"
    assert responses == []


def test_resend_does_not_retry_a_rejected_message() -> None:
    """A 422 is the same answer every time; three tries only cost latency."""

    attempts = {"count": 0}

    def opener(request: urllib.request.Request, timeout: float) -> bytes:
        attempts["count"] += 1
        raise _http_error(422, b'{"message": "from is not a verified domain"}')

    transport = ResendTransport(
        "k", "s@certrace.co", opener=opener, sleep=lambda _: None
    )

    with pytest.raises(EmailDeliveryError) as caught:
        transport.send(_message())

    assert attempts["count"] == 1
    assert "verified domain" in str(caught.value)


def test_resend_gives_up_after_the_attempt_limit() -> None:
    attempts = {"count": 0}

    def opener(request: urllib.request.Request, timeout: float) -> bytes:
        attempts["count"] += 1
        raise _http_error(500, b'{"message": "internal"}')

    transport = ResendTransport(
        "k", "s@certrace.co", opener=opener, sleep=lambda _: None, max_attempts=3
    )

    with pytest.raises(EmailDeliveryError):
        transport.send(_message())

    assert attempts["count"] == 3


def test_resend_reports_a_network_failure_as_a_delivery_error() -> None:
    def opener(request: urllib.request.Request, timeout: float) -> bytes:
        raise urllib.error.URLError("name resolution failed")

    transport = ResendTransport(
        "k", "s@certrace.co", opener=opener, sleep=lambda _: None, max_attempts=2
    )

    with pytest.raises(EmailDeliveryError) as caught:
        transport.send(_message())

    assert "name resolution failed" in str(caught.value)


def test_a_send_never_echoes_the_api_key() -> None:
    def opener(request: urllib.request.Request, timeout: float) -> bytes:
        raise _http_error(403, b'{"message": "forbidden"}')

    transport = ResendTransport(
        "re_super_secret", "s@certrace.co", opener=opener, sleep=lambda _: None
    )

    with pytest.raises(EmailDeliveryError) as caught:
        transport.send(_message())

    assert "re_super_secret" not in str(caught.value)


def test_a_successful_send_with_an_unexpected_body_still_counts() -> None:
    def opener(request: urllib.request.Request, timeout: float) -> bytes:
        return b"<html>not json</html>"

    transport = ResendTransport("k", "s@certrace.co", opener=opener)

    assert transport.send(_message()) == "accepted"


# ── Configuration ─────────────────────────────────────────────


def test_delivery_defaults_to_off_when_nothing_is_configured() -> None:
    assert isinstance(transport_from_env(settings()), NullTransport)


def test_delivery_defaults_to_resend_once_a_key_and_sender_exist() -> None:
    transport = transport_from_env(
        settings(RESEND_API_KEY="re_k", CERTRACE_EMAIL_SENDER="s@certrace.co")
    )

    assert isinstance(transport, ResendTransport)


def test_console_delivery_must_be_asked_for_by_name() -> None:
    transport = transport_from_env(
        settings(
            CERTRACE_EMAIL_DELIVERY="console",
            RESEND_API_KEY="re_k",
            CERTRACE_EMAIL_SENDER="s@certrace.co",
        )
    )

    assert isinstance(transport, ConsoleTransport)


def test_asking_for_resend_without_a_key_is_an_error() -> None:
    """Silently degrading to "off" here is how a deploy stops sending mail
    for a week without anyone noticing."""

    with pytest.raises(ValueError) as caught:
        transport_from_env(settings(CERTRACE_EMAIL_DELIVERY="resend"))

    assert "RESEND_API_KEY" in str(caught.value)


def test_an_unrecognised_delivery_mode_is_an_error() -> None:
    with pytest.raises(ValueError):
        transport_from_env(settings(CERTRACE_EMAIL_DELIVERY="smtp"))


def test_null_transport_accepts_and_discards() -> None:
    assert NullTransport().send(_message()) == "discarded"


def test_console_transport_prints_the_body_where_it_will_be_seen() -> None:
    """It must not go through `logging`: under uvicorn the root logger has no
    handler, and the one output a developer needs would vanish."""

    stream = io.StringIO()

    ConsoleTransport(stream).send(_message())

    printed = stream.getvalue()
    assert "a@b.co" in printed
    assert "Subject" in printed
    assert "Body" in printed
