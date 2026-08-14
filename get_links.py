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
  
  # Build one "Name: link" entry per character name
  txt_content = []
  
  def append_name_and_link(obj):
    short = obj.get('shortName') or obj.get('shortname') or obj.get('short_name')
    link = obj.get('link')
    status = str(obj.get('status', '')).lower()
    if not short or not link or 'side' in status:
      return

    txt_content.append(f"{short}: {link}")

  if isinstance(data, list):
    for character in data:
      if isinstance(character, dict):
        append_name_and_link(character)
  elif isinstance(data, dict):
    for _, character_data in data.items():
      if isinstance(character_data, dict):
        append_name_and_link(character_data)
  
  # Write to TXT file
  with open('links.txt', 'w', encoding='utf-8') as file:
    file.write('\n'.join(txt_content))
  
  print("links.txt created successfully")

if __name__ == "__main__":
  trim_characters_json()
