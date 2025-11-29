import json

def migrate():
    with open('db.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    for q in data['questions']:
        # Add questionText if missing
        if 'questionText' not in q:
            q['questionText'] = "Kdo je autorem tohoto díla?"
        
        # Add correctAnswer if missing (default to author)
        if 'correctAnswer' not in q:
            q['correctAnswer'] = q['author']

    with open('db.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print("Migration complete.")

if __name__ == "__main__":
    migrate()
