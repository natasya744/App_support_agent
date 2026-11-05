import sys
from pathlib import Path

# Allow running from any directory, not just the project root.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from app import db  # noqa: E402  (import after sys.path fix)


def parse(path: Path) -> list[tuple[str, str, str]]:
    """Split a markdown file into (section, title, content) rows, one per ## heading."""
    entries = []
    text = path.read_text(encoding="utf-8")
    # Normalise: split on any '## ' that follows a newline (strip leading blank lines first)
    for block in text.strip().split("\n## ")[1:]:
        title, _, content = block.partition("\n")
        if title.strip():
            entries.append((path.stem, title.strip(), content.strip()))
    return entries


KB_DIR = PROJECT_ROOT / "knowledge_base"

if not KB_DIR.is_dir():
    print(f"[ERROR] knowledge_base folder not found at: {KB_DIR}")
    sys.exit(1)

total = 0
with db.connect() as conn:
    for path in sorted(KB_DIR.glob("*.md")):
        rows = parse(path)
        if not rows:
            print(f"[WARN] {path.name}: 0 entries parsed — check ## headings")
            continue
        for section, title, content in rows:
            conn.execute(
                """
                insert into knowledge_base (section, title, content) values (%s, %s, %s)
                on conflict (section, title) do update
                  set content = excluded.content, updated_at = now()
                """,
                (section, title, content),
            )
        total += len(rows)
        print(f"[OK] {path.stem}: {len(rows)} entries")

print(f"\nDone — {total} total rows upserted into knowledge_base.")
