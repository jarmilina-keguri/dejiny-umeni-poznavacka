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
            updateDatalists();
        })
        .catch(err => {
            console.error(err);
            alert("Chyba při načítání dat. Běží server?");
        });
}

function updateDatalists() {
    const fieldList = document.getElementById('field-list');
    const styleList = document.getElementById('style-list');

    // Extract unique fields
    const fields = [...new Set(questions.map(q => q.field).filter(f => f))].sort();

    // Extract unique styles (flatten array)
    const styles = [...new Set(questions.flatMap(q => q.style).filter(s => s))].sort();

    // Populate field datalist
    fieldList.innerHTML = fields.map(f => `<option value="${f}">`).join('');

    // Populate style datalist
    styleList.innerHTML = styles.map(s => `<option value="${s}">`).join('');
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

const suggestAnswersBtn = document.getElementById('suggest-answers-btn');
suggestAnswersBtn.addEventListener('click', suggestAnswers);

function suggestAnswers() {
    const qText = questionTextInput.value.toLowerCase();
    let targetType = 'author'; // Default

    // 1. Detect Question Type
    if (qText.includes('název') || qText.includes('jmenuje') || qText.includes('dílo')) {
        targetType = 'title';
    } else if (qText.includes('rok') || qText.includes('roce') || qText.includes('kdy')) {
        targetType = 'year';
    } else if (qText.includes('styl') || qText.includes('směr') || qText.includes('období')) {
        targetType = 'style';
    } else if (qText.includes('autor') || qText.includes('vytvořil') || qText.includes('namaloval')) {
        targetType = 'author';
    }

    // 2. Get Correct Answer & Context
    let correctAnswer = '';
    let currentStyle = styleInput.value.split(',').map(s => s.trim().toLowerCase());

    if (targetType === 'author') correctAnswer = authorInput.value;
    else if (targetType === 'title') correctAnswer = titleInput.value;
    else if (targetType === 'year') correctAnswer = yearInput.value;
    else if (targetType === 'style') correctAnswer = styleInput.value; // Might need handling for multiple styles

    if (!correctAnswer) {
        alert("Prosím vyplňte nejprve správnou odpověď pro daný typ otázky (Autor, Název, Rok, atd.).");
        return;
    }

    // 3. Generate Distractors
    let distractors = [];

    if (targetType === 'year') {
        // Special handling for years - generate close numbers
        const correctYearInt = parseInt(correctAnswer.replace(/[^0-9]/g, ''));
        if (!isNaN(correctYearInt)) {
            while (distractors.length < 3) {
                // Generate random offset between +/- 10 and 60 years
                const offset = (Math.floor(Math.random() * 50) + 10) * (Math.random() < 0.5 ? 1 : -1);
                const distractor = (correctYearInt + offset).toString();
                if (distractor !== correctAnswer && !distractors.includes(distractor)) {
                    distractors.push(distractor);
                }
            }
        } else {
            // Fallback if year is text (e.g. "c. 1890") - pick random years from DB
            const allYears = [...new Set(questions.map(q => q.year))];
            distractors = getRandomDistractors(allYears, correctAnswer, 3);
        }
    } else {
        // Standard handling for Text fields (Author, Title, Style)
        let candidates = [];

        if (targetType === 'author') {
            // Context: Same style
            candidates = questions
                .filter(q => q.style.some(s => currentStyle.includes(s.toLowerCase())))
                .map(q => q.author);

            // If not enough, add all authors
            if (candidates.length < 3) {
                candidates = [...candidates, ...questions.map(q => q.author)];
            }
        } else if (targetType === 'title') {
            // Context: Same style
            candidates = questions
                .filter(q => q.style.some(s => currentStyle.includes(s.toLowerCase())))
                .map(q => q.title);

            // If not enough, add all titles
            if (candidates.length < 10) {
                candidates = [...candidates, ...questions.map(q => q.title)];
            }
        } else if (targetType === 'style') {
            // Flatten all styles
            candidates = questions.flatMap(q => q.style);
        }

        // Unique and filter correct
        candidates = [...new Set(candidates)];
        distractors = getRandomDistractors(candidates, correctAnswer, 3);
    }

    // 4. Populate UI
    const allOptions = [correctAnswer, ...distractors];
    shuffleArray(allOptions);

    optionInputs.forEach((input, i) => {
        if (allOptions[i]) {
            input.value = allOptions[i];
            if (allOptions[i] === correctAnswer) {
                correctOptionRadios[i].checked = true;
            }
        } else {
            input.value = ""; // Should not happen if we have data
        }
    });
}

function getRandomDistractors(pool, correct, count) {
    const validPool = pool.filter(item => item !== correct && item); // Filter correct and empty
    const shuffled = [...validPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

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
