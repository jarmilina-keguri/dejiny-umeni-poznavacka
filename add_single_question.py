import json

file_path = 'c:/Users/jarmi/.gemini/antigravity/scratch/dejiny-umeni-poznavacka/db.json'

new_question = {
    "questionText": "Co je to?",
    "image": "assets/images/Venuse_z_Hlubokych_Masuvek.jpg",
    "title": "Venuše z Hlubokých Mašůvek",
    "author": "Kultura s moravskou malovanou keramikou",
    "year": "neolit",
    "field": "sochařství",
    "style": ["neolit"],
    "options": [
        "Venuše z Hlubokých Mašůvek",
        "Střelická venuše",
        "Věstonická venuše",
        "Venuše z Modřic"
    ],
    "correctAnswer": "Venuše z Hlubokých Mašůvek"
}

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Check if image already exists to avoid duplicates
    existing_images = [q['image'] for q in data['questions']]
    if new_question['image'] in existing_images:
        print(f"Question for {new_question['image']} already exists.")
    else:
        data['questions'].append(new_question)
        
        # Update styles if needed
        all_styles = set(data.get('styles', []))
        for s in new_question['style']:
            all_styles.add(s)
        data['styles'] = sorted(list(all_styles))

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

        print(f"Successfully added question: {new_question['title']}")

except Exception as e:
    print(f"Error: {e}")
