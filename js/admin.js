let questions = [];
let currentQuestionIndex = -1;

const questionsList = document.getElementById('questions-list');
const editorPanel = document.getElementById('editor-panel');
const previewPanel = document.getElementById('preview-panel');
const questionForm = document.getElementById('question-form');
const editorTitle = document.getElementById('editor-title');
const addNewBtn = document.getElementById('add-new-btn');
const cancelBtn = document.getElementById('cancel-btn');
const previewImg = document.getElementById('preview-img');

// Inputs
const questionTextInput = document.getElementById('edit-question-text');
const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const yearInput = document.getElementById('year');
const fieldInput = document.getElementById('field');
const styleInput = document.getElementById('style');
const imageInput = document.getElementById('image');
const optionInputs = [
    document.getElementById('edit-option-0'),
    document.getElementById('edit-option-1'),
    document.getElementById('edit-option-2'),
    document.getElementById('edit-option-3')
];
const correctOptionRadios = document.getElementsByName('correct-option');

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
    previewPanel.style.display = 'flex';

    // Fill form
    questionTextInput.value = q.questionText || "Kdo je autorem tohoto díla?";
    titleInput.value = q.title;
    authorInput.value = q.author;
    yearInput.value = q.year;
    fieldInput.value = q.field;
    styleInput.value = q.style.join(', ');
    imageInput.value = q.image;
    previewImg.src = q.image;

    // Options
    if (q.options && q.options.length >= 4) {
        optionInputs.forEach((input, i) => {
            input.value = q.options[i];
        });
    }

    // Determine correct answer
    const correctAnswer = q.correctAnswer || q.author;
    let found = false;
    optionInputs.forEach((input, i) => {
        if (input.value === correctAnswer) {
            correctOptionRadios[i].checked = true;
            found = true;
        }
    });

    // If not found (e.g. data mismatch), default to first
    if (!found) {
        correctOptionRadios[0].checked = true;
    }
}

addNewBtn.addEventListener('click', () => {
    currentQuestionIndex = -1;
    editorTitle.textContent = 'Nová otázka';
    editorPanel.style.display = 'block';
    previewPanel.style.display = 'flex';
    questionForm.reset();
    previewImg.src = '';
    questionTextInput.value = "Kdo je autorem tohoto díla?";
    correctOptionRadios[0].checked = true;
});

cancelBtn.addEventListener('click', () => {
    editorPanel.style.display = 'none';
    previewPanel.style.display = 'none';
});

imageInput.addEventListener('input', () => {
    previewImg.src = imageInput.value;
});

questionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get selected correct option index
    let correctIndex = 0;
    for (let i = 0; i < correctOptionRadios.length; i++) {
        if (correctOptionRadios[i].checked) {
            correctIndex = i;
            break;
        }
    }

    const options = optionInputs.map(input => input.value);
    const correctAnswer = options[correctIndex];

    const newQuestion = {
        questionText: questionTextInput.value,
        image: imageInput.value,
        title: titleInput.value,
        author: authorInput.value,
        year: yearInput.value,
        field: fieldInput.value,
        style: styleInput.value.split(',').map(s => s.trim()),
        options: options,
        correctAnswer: correctAnswer
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
                previewPanel.style.display = 'none';
            }
        })
        .catch(err => {
            console.error(err);
            alert('Chyba při ukládání.');
        });
}
