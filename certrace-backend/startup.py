from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

BACKEND = Path(__file__).resolve().parent
BACKEND_PORT = "8000"
READY_URL = f"http://127.0.0.1:{BACKEND_PORT}/readyz"


def backend_python() -> Path | str:
    windows_python = BACKEND / ".venv" / "Scripts" / "python.exe"
    posix_python = BACKEND / ".venv" / "bin" / "python"
    if windows_python.exists():
        return windows_python
    if posix_python.exists():
        return posix_python
    return sys.executable


def run_backend() -> int:
    return subprocess.call(
        [
            str(backend_python()),
            "-m",
            "uvicorn",
            "main:app",
            "--reload",
            "--port",
            BACKEND_PORT,
        ],
        cwd=BACKEND,
    )


def run_migration() -> int:
    return subprocess.call([str(backend_python()), "-m", "alembic", "upgrade", "head"], cwd=BACKEND)


def run_downgrade() -> int:
    return subprocess.call([str(backend_python()), "-m", "alembic", "downgrade", "-1"], cwd=BACKEND)


def check_readiness() -> int:
    try:
        with urllib.request.urlopen(READY_URL, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
            print(json.dumps(payload, indent=2, sort_keys=True))
            return 0
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        try:
            print(json.dumps(json.loads(body), indent=2, sort_keys=True))
        except json.JSONDecodeError:
            print(body)
        return 1
    except urllib.error.URLError as exc:
        print(f"Backend is not reachable at {READY_URL}: {exc.reason}")
        return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Certrace backend developer commands.")
    parser.add_argument(
        "command",
        nargs="?",
        default="backend",
        choices=("backend", "migrate", "downgrade", "ready"),
        help="Command to run. Defaults to backend.",
    )
    args = parser.parse_args()

    if args.command == "backend":
        return run_backend()
    if args.command == "migrate":
        return run_migration()
    if args.command == "downgrade":
        return run_downgrade()
    if args.command == "ready":
        return check_readiness()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
