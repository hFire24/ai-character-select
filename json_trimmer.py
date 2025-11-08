import json
import os
import sys

def trim_characters_json():
  # Find characters.json file
  characters_file = 'src/assets/characters.json'
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

  # Remove specified fields from each character (including tier)
  fields_to_remove = ['img', 'shortName', 'id', 'generation', 'serious', 'chaos', 'musicEnjoyer', 'moe', 'futuristic', 'emotion', 'link', 'alternatives', 'tier']

  if isinstance(data, list):
    for character in data:
      for field in fields_to_remove:
        character.pop(field, None)
  elif isinstance(data, dict):
    for character_key in data:
      if isinstance(data[character_key], dict):
        for field in fields_to_remove:
          data[character_key].pop(field, None)
  
  # Convert to TXT format
  txt_content = []
  
  if isinstance(data, list):
    for character in data:
      for key, value in character.items():
        if key.lower() == 'name':
          txt_content.append(f"Name: {value}")
        else:
            # Convert camelCase to Title Case with spaces
            formatted_key = ''.join([' ' + c if c.isupper() else c for c in key]).strip().title()
            txt_content.append(f"{formatted_key}: {value}")
      txt_content.append("")  # Empty line between characters
  elif isinstance(data, dict):
    for character_key, character_data in data.items():
      if isinstance(character_data, dict):
        for key, value in character_data.items():
          if key.lower() == 'name':
            txt_content.append(f"Name: {value}")
          else:
            txt_content.append(f"{key}: {value}")
        txt_content.append("")  # Empty line between characters
  
  # Write to TXT file
  with open('characters.txt', 'w', encoding='utf-8') as file:
    file.write('\n'.join(txt_content))
  
  print("characters.txt created successfully")

if __name__ == "__main__":
  trim_characters_json()