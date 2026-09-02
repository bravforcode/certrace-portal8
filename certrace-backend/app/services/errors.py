"""Domain errors surfaced as structured API responses."""


class CalculationError(ValueError):
    """Raised when calculation inputs are incomplete or inconsistent."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class AccountStoreUnavailable(RuntimeError):
    """Raised when a database is configured but the account tables are not readable.

    This is deliberately loud. The alternative -- carrying on against an
    in-process dictionary -- turns a database outage into an authentication
    system that accepts credentials it never stored, and reports success for
    password changes that no longer exist after the next restart.
    """

    code = "ACCOUNT_STORE_UNAVAILABLE"
    message = "The account store is temporarily unavailable. Please try again."
