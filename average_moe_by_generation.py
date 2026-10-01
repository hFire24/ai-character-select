"""Report the average moe score for each character generation."""

import argparse
import json
from collections import defaultdict
from pathlib import Path
from statistics import mean


DATA_PATH = Path(__file__).resolve().parent / "src/assets/data/characters.json"


def load_characters(path=DATA_PATH):
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def moe_scores_by_generation(characters, include_generation_zero=False):
    """Return valid moe scores grouped by their positive integer generation."""
    scores = defaultdict(list)

    for character in characters:
        if not isinstance(character, dict):
            continue

        generation = character.get("generation")
        moe = character.get("moe")
        if type(generation) is not int or type(moe) not in (int, float):
            continue
        if generation < 0 or (generation == 0 and not include_generation_zero):
            continue

        scores[generation].append(moe)

    return dict(sorted(scores.items()))


def main():
    parser = argparse.ArgumentParser(
        description="Calculate the average moe score for each generation."
    )
    parser.add_argument(
        "--include-generation-zero",
        action="store_true",
        help="Include generation 0 in the report.",
    )
    args = parser.parse_args()

    scores = moe_scores_by_generation(
        load_characters(),
        include_generation_zero=args.include_generation_zero,
    )

    print("Average moe score by generation:")
    if not scores:
        print("No valid generation and moe data found.")
        return

    for generation, values in scores.items():
        character_label = "character" if len(values) == 1 else "characters"
        print(
            f"Generation {generation:2}: {mean(values):.2f} "
            f"({len(values)} {character_label})"
        )


if __name__ == "__main__":
    main()
