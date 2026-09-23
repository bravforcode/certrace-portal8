"""The migration history has to stay one straight line.

Two PRs written in parallel each added a revision "013" on top of "012", and
both merged. Nothing failed in CI: each branch's tests ran against its own
chain. On main, Alembic kept one file under that id, warned, and reported two
heads -- so ``alembic upgrade head`` refused to run, ``users.google_sub`` was
never created, and every sign-in query in production failed on a missing
column. These checks are the cheapest place to catch that before a merge.
"""

from __future__ import annotations

import ast
from collections import Counter
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory

BACKEND = Path(__file__).resolve().parents[1]
VERSIONS = BACKEND / "migrations" / "versions"


def _declared_revisions() -> list[str]:
    """Read ``revision = "..."`` straight from each file.

    Alembic's own map cannot be trusted for this: when two files share an id
    it keeps one and only warns, so the duplicate never shows up in it.
    """

    found = []
    for path in sorted(VERSIONS.glob("*.py")):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in tree.body:
            if (
                isinstance(node, ast.Assign)
                and any(isinstance(t, ast.Name) and t.id == "revision" for t in node.targets)
                and isinstance(node.value, ast.Constant)
            ):
                found.append(str(node.value.value))
    return found


def test_no_two_migrations_share_a_revision_id() -> None:
    duplicates = {rev: n for rev, n in Counter(_declared_revisions()).items() if n > 1}
    assert duplicates == {}, (
        f"revision ids used more than once: {duplicates} -- renumber the newer "
        "migration onto the current head"
    )


def test_the_history_has_exactly_one_head() -> None:
    config = Config(str(BACKEND / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND / "migrations"))
    heads = ScriptDirectory.from_config(config).get_heads()
    assert len(heads) == 1, f"alembic upgrade head needs one head, found {heads}"
