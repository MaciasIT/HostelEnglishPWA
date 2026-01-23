import json
import env

def translate_dataset(input_file, output_file, mapping):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Phrases dataset structure: {"phrases": [...]}
    if 'phrases' in data:
        for item in data['phrases']:
            es_text = item.get('es', '')
            if es_text in mapping:
                item['eu'] = mapping[es_text]
            else:
                item['eu'] = item.get('eu', '') # Keep existing if any
    
    # Conversations dataset structure: {"conversations": [...]}
    if 'conversations' in data:
        for conv in data['conversations']:
            # Translate title and scenario if mapping exists
            if conv.get('title') in mapping:
                conv['title_eu'] = mapping[conv['title']]
            if conv.get('scenario') in mapping:
                conv['scenario_eu'] = mapping[conv['scenario']]
                
            for turn in conv.get('dialogue', []):
                es_text = turn.get('es', '')
                if es_text in mapping:
                    turn['eu'] = mapping[es_text]
                else:
                    turn['eu'] = turn.get('eu', '')

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    # Example mapping provided in chunks
    sample_mapping = {
        "Algo más": "Besterik?",
        "Están todos bien": "Ondo zaudete denak?",
        # ... (I will populate this in the actual task)
    }
    # Usage: translate_dataset('input.json', 'output.json', sample_mapping)
