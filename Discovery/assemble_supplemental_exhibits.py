#!/usr/bin/env python3
"""
Shim for supplemental discovery exhibit assembly.

Canonical implementation: packages/p31-office → p31_office.discovery.assembler
Install once:  python3 -m pip install -e ./packages/p31-office
Or run without install: this script prepends the package src directory to PYTHONPATH.
"""
from __future__ import annotations

import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parents[1]
_SRC = _REPO / "packages" / "p31-office" / "src"
if _SRC.is_dir():
    sp = str(_SRC)
    if sp not in sys.path:
        sys.path.insert(0, sp)

from p31_office.discovery import assembler  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(assembler.main())
