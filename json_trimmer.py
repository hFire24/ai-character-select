import json
import os

def trim_characters_json():
  # Find characters.json file
  characters_file = 'src/assets/characters.json'
  if not os.path.exists(characters_file):
    print(f"Error: {characters_file} not found")
    return
  
  # Read the original file
  with open(characters_file, 'r', encoding='utf-8') as file:
    data = json.load(file)
  
  # Remove specified fields from each character
  fields_to_remove = ['img', 'shortName', 'generation', 'serious', 'chaos', 'musicEnjoyer', 'moe', 'emotion', 'link', 'alternatives']
  
  if isinstance(data, list):
    for character in data:
      for field in fields_to_remove:
        character.pop(field, None)
  elif isinstance(data, dict):
    for character_key in data:
      if isinstance(data[character_key], dict):
        for field in fields_to_remove:
          data[character_key].pop(field, None)
  
  # Write to new file
  with open('characters.json', 'w', encoding='utf-8') as file:
    json.dump(data, file, indent=2, ensure_ascii=False)
  
  print("characters.json created successfully")

if __name__ == "__main__":
  trim_characters_json()