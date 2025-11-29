let questions = [];
let currentQuestionIndex = -1;

const questionsList = document.getElementById('questions-list');
const editorPanel = document.getElementById('editor-panel');
const questionForm = document.getElementById('question-form');
const editorTitle = document.getElementById('editor-title');
const addNewBtn = document.getElementById('add-new-btn');
const cancelBtn = document.getElementById('cancel-btn');
const previewImg = document.getElementById('preview-img');

// Inputs
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const yearInput = document.getElementById('year');
const fieldInput = document.getElementById('field');
const styleInput = document.getElementById('style');
const imageInput = document.getElementById('image');
const option1Input = document.getElementById('option1');
const option2Input = document.getElementById('option2');
const option3Input = document.getElementById('option3');
const option4Input = document.getElementById('option4');

document.addEventListener('DOMContentLoaded', loadQuestions);

function loadQuestions() {
    fetch('/api/questions')
        .then(res => res.json())
        .then(data => {
            questions = data;
            renderList();
        })
        .catch(err => {
            console.error(err);
            alert("Chyba při načítání dat. Běží server?");
        });
}

function renderList() {
    questionsList.innerHTML = '';
    questions.forEach((q, index) => {
        const li = document.createElement('li');
        li.className = 'question-item';
        li.innerHTML = `
            <img src="${q.image}" alt="${q.title}" class="thumbnail">
            <div class="info">
                <strong>${q.author}</strong> - ${q.title}
            </div>
        `;
        li.addEventListener('click', () => openEditor(index));
        questionsList.appendChild(li);
    });
}

function openEditor(index) {
    currentQuestionIndex = index;
    const q = questions[index];

    editorTitle.textContent = 'Editace otázky';
    editorPanel.style.display = 'block';

    // Fill form
    titleInput.value = q.title;
    authorInput.value = q.author;
    yearInput.value = q.year;
    fieldInput.value = q.field;
    styleInput.value = q.style.join(', ');
    imageInput.value = q.image;
    previewImg.src = q.image;

    // Options
    // We assume the first option in the stored array matches the author (or we just take the array as is)
    // Actually, in the data, options are shuffled or fixed? In questions.js they were fixed with correct one usually being in the set.
    // But my logic in script.js checks `if (selectedOption === correctAuthor)`.
    // So the options array MUST contain the correct author.
    // For editing simplicity, let's just show them.
    // BUT, the form UI I designed assumes Option 1 is Author.
    // Let's just fill them 1-4.

    // Find author in options to put it first? Or just list them?
    // Let's just list them as they are in the array.
    if (q.options && q.options.length >= 4) {
        option1Input.value = q.options[0];
        option2Input.value = q.options[1];
        option3Input.value = q.options[2];
        option4Input.value = q.options[3];
    }

    // Update option 1 when author changes
    // authorInput.addEventListener('input', () => { option1Input.value = authorInput.value; });
}

addNewBtn.addEventListener('click', () => {
    currentQuestionIndex = -1;
    editorTitle.textContent = 'Nová otázka';
    editorPanel.style.display = 'block';
    questionForm.reset();
    previewImg.src = '';
});

cancelBtn.addEventListener('click', () => {
    editorPanel.style.display = 'none';
});

imageInput.addEventListener('input', () => {
    previewImg.src = imageInput.value;
});

questionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newQuestion = {
        image: imageInput.value,
        title: titleInput.value,
        author: authorInput.value,
        year: yearInput.value,
        field: fieldInput.value,
        style: styleInput.value.split(',').map(s => s.trim()),
        options: [
            option1Input.value,
            option2Input.value,
            option3Input.value,
            option4Input.value
        ]
    };

    if (currentQuestionIndex >= 0) {
        // Update existing
        questions[currentQuestionIndex] = newQuestion;
    } else {
        // Add new
        questions.push(newQuestion);
    }

    saveQuestions();
});

function saveQuestions() {
    fetch('/api/questions', {
        method: 'PUT', // We are replacing the whole list for simplicity as per server.py
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(questions)
    })
        .then(res => res.json())
        .then(data => {
            alert('Uloženo!');
            renderList();
            if (currentQuestionIndex === -1) {
                // If it was new, maybe close or clear?
                editorPanel.style.display = 'none';
            }
        })
        .catch(err => {
            console.error(err);
            alert('Chyba při ukládání.');
        });
}
