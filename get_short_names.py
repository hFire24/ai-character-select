import json
import os
import sys

def trim_characters_json():
  # Find characters.json file
  characters_file = 'src/assets/data/characters.json'
  if not os.path.exists(characters_file):
    print(f"Error: {characters_file} not found")
    sys.exit(1)
  
  # Read the original file
  with open(characters_file, 'r', encoding='utf-8') as file:
    data = json.load(file)
  
  # Sort by tier before removing fields
  if isinstance(data, list):
    # Sort by tier (higher values first)
    data.sort(key=lambda x: (x.get('tier', float('inf'))))
  elif isinstance(data, dict):
    # Convert dict to sorted list of tuples, then back to dict
    sorted_items = sorted(data.items(), key=lambda x: (x[1].get('tier', float('inf'))))
    data = dict(sorted_items)
  
  # Build list of short names only
  txt_content = []
  
  def append_short_name(obj):
    short = obj.get('shortName') or obj.get('shortname') or obj.get('short_name')
    if short:
      # Split duo names (e.g., "Riri & Ruru" becomes ["Riri", "Ruru"])
      if '&' in str(short):
        names = [name.strip() for name in str(short).split('&')]
        txt_content.extend(names)
      else:
        txt_content.append(str(short))

  if isinstance(data, list):
    for character in data:
      if isinstance(character, dict):
        append_short_name(character)
  elif isinstance(data, dict):
    for _, character_data in data.items():
      if isinstance(character_data, dict):
        append_short_name(character_data)
  
  # Write to TXT file
  with open('shortnames.csv', 'w', encoding='utf-8') as file:
    file.write('\n'.join(txt_content))
  
  print("shortnames.csv created successfully")

if __name__ == "__main__":
  trim_characters_json()