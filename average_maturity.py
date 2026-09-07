"""Report overall and grouped averages of maturity and moe in characters.json."""

import json
from pathlib import Path
from statistics import mean


def main():
    print("1. Average maturity by moe level")
    print("2. Average moe by maturity level")
    choice = input("Choose an option (1 or 2): ").strip()
    while choice not in ("1", "2"):
        choice = input("Invalid option. Enter 1 or 2: ").strip()
    print()

    data_path = Path(__file__).resolve().parent / "src/assets/data/characters.json"
    with data_path.open(encoding="utf-8") as file:
        characters = json.load(file)

    maturities = []
    moe_scores = []
    by_moe = {level: [] for level in range(1, 11)}
    by_maturity = {level: [] for level in range(1, 11)}
    for character in characters:
        if not isinstance(character, dict):
            continue
        maturity = character.get("mature")
        moe = character.get("moe")
        if type(moe) in (int, float):
            moe_scores.append(moe)
            if type(maturity) in (int, float) and maturity in by_maturity:
                by_maturity[maturity].append(moe)
        if type(maturity) not in (int, float):
            continue
        maturities.append(maturity)
        if type(moe) in (int, float) and moe in by_moe:
            by_moe[moe].append(maturity)

    def report(label, values):
        average = f"{mean(values):.2f}" if values else "N/A"
        print(f"{label}: {average} ({len(values)} characters)")

    if choice == "1":
        report("Overall average maturity", maturities)
        print("\nAverage maturity by moe level:")
        for level, values in by_moe.items():
            report(f"Moe {level:2}", values)
    else:
        report("Overall average moe", moe_scores)
        print("\nAverage moe by maturity level:")
        for level, values in by_maturity.items():
            report(f"Maturity {level:2}", values)


if __name__ == "__main__":
    main()
