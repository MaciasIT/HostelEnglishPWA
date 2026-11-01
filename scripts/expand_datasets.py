# -*- coding: utf-8 -*-
"""
FD-02 — Expansión de datasets JSON.

Añade al corpus existente:
  1. 132 frases nuevas (scripts/fd02_phrases.py) con campo `ipa` curado.
  2. 10 conversaciones nuevas (scripts/fd02_conversations.py) con `ipa` por turno.
  3. Mapa de variantes UK/US/AUS (scripts/fd02_variants.py) en public/data/variants.json.

Es idempotente: si las frases nuevas ya están presentes (source == "FD-02"), no
las duplica. El backfill de IPA de las frases heredadas se hace aparte con
`jiti scripts/generate_ipa.ts` (usa el G2P real de la app, sin duplicar lógica).

Uso:
    python3 scripts/expand_datasets.py
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "public", "data")

sys.path.insert(0, HERE)
from fd02_phrases import NEW_PHRASES          # noqa: E402
from fd02_conversations import NEW_CONVERSATIONS  # noqa: E402
from fd02_variants import VARIANTS            # noqa: E402

PHRASES_PATH = os.path.join(DATA, "hostelenglish_dataset_clean.json")
CONVOS_PATH = os.path.join(DATA, "conversations_extended_v4.json")
VARIANTS_PATH = os.path.join(DATA, "variants.json")


def load(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def dump(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def merge_phrases():
    data = load(PHRASES_PATH)
    phrases = data["phrases"]
    existing_sources = {p.get("source") for p in phrases}
    if "FD-02" in existing_sources:
        n = sum(1 for p in phrases if p.get("source") == "FD-02")
        print(f"[phrases] ya contiene {n} frases FD-02; no se duplican.")
        return

    next_id = max((p["id"] for p in phrases if isinstance(p["id"], int)), default=-1) + 1
    added = 0
    for p in NEW_PHRASES:
        phrases.append({
            "id": next_id,
            "es": p["es"],
            "en": p["en"],
            "eu": p["eu"],
            "ipa": p["ipa"],
            "source": "FD-02",
            "categoria": p["categoria"],
        })
        next_id += 1
        added += 1

    dump(PHRASES_PATH, {"phrases": phrases})
    print(f"[phrases] añadidas {added} frases nuevas (total {len(phrases)}).")


def merge_conversations():
    data = load(CONVOS_PATH)
    convos = data["conversations"]
    existing_ids = {c["id"] for c in convos}
    new_ids = {c["id"] for c in NEW_CONVERSATIONS}
    if new_ids & existing_ids:
        print("[conversations] ya contienen los ids FD-02; no se duplican.")
        return

    for c in NEW_CONVERSATIONS:
        convos.append(c)
    dump(CONVOS_PATH, {"conversations": convos})
    print(f"[conversations] añadidas {len(NEW_CONVERSATIONS)} conversaciones nuevas (total {len(convos)}).")


def write_variants():
    dump(VARIANTS_PATH, {"variants": VARIANTS})
    print(f"[variants] escritas {len(VARIANTS)} variantes en {VARIANTS_PATH}.")


def main():
    merge_phrases()
    merge_conversations()
    write_variants()


if __name__ == "__main__":
    main()