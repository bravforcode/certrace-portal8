"""Domain errors surfaced as structured API responses."""


class CalculationError(ValueError):
    """Raised when calculation inputs are incomplete or inconsistent."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
