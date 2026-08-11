from __future__ import annotations

import pytest

from app.config import load_bool, load_nonnegative_int, load_positive_int


@pytest.mark.parametrize("value", ["1", "true", "YES", "on"])
def test_load_bool_accepts_true_values(monkeypatch, value: str) -> None:
    monkeypatch.setenv("SETTING", value)
    assert load_bool("SETTING", False) is True


@pytest.mark.parametrize("value", ["0", "false", "NO", "off"])
def test_load_bool_accepts_false_values(monkeypatch, value: str) -> None:
    monkeypatch.setenv("SETTING", value)
    assert load_bool("SETTING", True) is False


def test_load_bool_rejects_ambiguous_values(monkeypatch) -> None:
    monkeypatch.setenv("SETTING", "enabled")
    with pytest.raises(ValueError, match="must be a boolean"):
        load_bool("SETTING", False)


def test_database_pool_bounds(monkeypatch) -> None:
    monkeypatch.setenv("POOL_SIZE", "0")
    monkeypatch.setenv("MAX_OVERFLOW", "-1")

    with pytest.raises(ValueError, match="greater than zero"):
        load_positive_int("POOL_SIZE", 2)
    with pytest.raises(ValueError, match="zero or greater"):
        load_nonnegative_int("MAX_OVERFLOW", 0)
