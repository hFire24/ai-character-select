import json
import sys

def check_duplicate_ids():
  try:
    with open('src/assets/data/characters.json', 'r', encoding='utf-8') as file:
      characters = json.load(file)
    
    # Extract IDs, ignoring objects with null values
    ids = []
    for char in characters:
      if char is not None and all(value is not None for value in char.values()):
        if 'id' in char and char['id'] is not None:
          ids.append(char['id'])
    
    # Check for duplicates
    seen_ids = set()
    duplicates = set()
    
    for char_id in ids:
      if char_id in seen_ids:
        duplicates.add(char_id)
      else:
        seen_ids.add(char_id)
    
    if duplicates:
      print(f"Duplicate IDs found: {', '.join(map(str, duplicates))}")
      sys.exit(1)
    else:
      print("Success: No duplicate IDs found.")
      print(f"Max ID used: {max(ids) if ids else 'N/A'}")
      
  except FileNotFoundError:
    print("Error: characters.json file not found.")
    sys.exit(1)
  except json.JSONDecodeError:
    print("Error: Invalid JSON format in characters.json.")
    sys.exit(1)

if __name__ == "__main__":
  check_duplicate_ids()