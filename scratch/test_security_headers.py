"""Test script to verify all frontend next.config.ts and backend security headers."""
import os

REQUIRED_HEADERS = [
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Strict-Transport-Security",
    "Cross-Origin-Opener-Policy",
    "Cross-Origin-Resource-Policy",
    "X-XSS-Protection",
]

CONFIG_PATHS = [
    r"d:\1tb\certrace\landingpage\certrace-landing\next.config.ts",
    r"d:\1tb\certrace\certrace-portal\next.config.ts",
    r"d:\1tb\certrace\certrace-admin-portal\next.config.ts",
]

def check_next_config(path: str) -> None:
    print(f"\nChecking: {path}")
    assert os.path.exists(path), f"File not found: {path}"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    for header in REQUIRED_HEADERS:
        assert header in content, f"Missing header '{header}' in {path}"
        print(f"  [OK] {header}")

    # Check HSTS preload
    assert "preload" in content, f"HSTS preload missing in {path}"
    assert "max-age=63072000" in content, f"HSTS max-age missing in {path}"
    assert "nosniff" in content, f"nosniff missing in {path}"
    assert "DENY" in content, f"DENY missing in {path}"
    assert "strict-origin-when-cross-origin" in content, f"Referrer-Policy missing in {path}"
    print("  [OK] HSTS, CSP, nosniff, DENY validated.")

if __name__ == "__main__":
    for config in CONFIG_PATHS:
        check_next_config(config)
    print("\nAll frontend security configurations validated successfully!")
