import glob, os

src_base = "src"

tsx_files = glob.glob(src_base + "/**/*.tsx", recursive=True)

replacements = [
    # Primary dark/light (specific first)
    ("bg-primary-dark/95", "bg-background/95"),
    ("bg-primary-dark/80", "bg-background/80"),
    ("bg-primary-dark", "bg-surface"),
    # Light mode backgrounds
    ("bg-primary-light", "bg-surface"),
    # Black
    ("bg-black", "bg-background"),
    # White (specific opacity first, then plain)
    ("bg-white/20", "bg-surface/20"),
    ("bg-white", "bg-surface"),
    # Borders
    ("border-white/10", "border-border/10"),
    ("border-white/5", "border-border/5"),
    ("border-white/40", "border-border/40"),
    ("border-white/30", "border-border/30"),
    # Text white
    ("text-white", "text-primary"),
    # Blue/red/green -> info/error/success
    ("bg-blue-500/20", "bg-info/20"),
    ("bg-blue-500", "bg-info"),
    ("bg-red-500", "bg-error"),
    ("bg-green-500", "bg-success"),
    # Text grey -> secondary/tertiary
    ("text-gray-300", "text-secondary"),
    ("text-gray-400", "text-tertiary"),
    ("text-gray-600", "text-secondary"),
    ("text-gray-800", "text-secondary"),
    # Dark primary text -> bright primary
    ("text-primary-dark", "text-primary"),
    ("border-white/20", "border-border/20"),
]

changed = 0
for fpath in tsx_files:
    with open(fpath, encoding="utf-8") as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)
        changed += 1
        print(f"CHANGED: {fpath}")

print(f"\nTotal files changed: {changed}")
