

let currentQuestion = 0;
let score = 0;
let answered = false;
let currentQuizData = [];
let quizData = [];

const quizImage = document.getElementById('quiz-image');
const optionsContainer = document.getElementById('options');
const nextBtn = document.getElementById('next-btn');
const feedback = document.getElementById('feedback');
const progressBar = document.getElementById('progress');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const scoreText = document.getElementById('score-text');
const restartBtn = document.getElementById('restart-btn');
const loadingSpinner = document.getElementById('loading');

const setupContainer = document.getElementById('setup-container');
const fieldsContainer = document.getElementById('fields-container');
const stylesContainer = document.getElementById('styles-container');
const questionCountInput = document.getElementById('question-count');
const startBtn = document.getElementById('start-btn');
const maxQuestionsHint = document.getElementById('max-questions-hint');

const questionText = document.getElementById('question-text');

function loadQuestion() {
    answered = false;
    const data = currentQuizData[currentQuestion];

    // Reset UI
    feedback.textContent = '';
    feedback.className = 'feedback';
    nextBtn.style.display = 'none';
    optionsContainer.innerHTML = '';

    // Set question text
    questionText.textContent = data.questionText || "Kdo je autorem tohoto díla?";

    // Load image
    quizImage.style.display = 'none';
    loadingSpinner.style.display = 'block';
    quizImage.src = data.image;

    quizImage.onload = () => {
        loadingSpinner.style.display = 'none';
        quizImage.style.display = 'block';
    };

    quizImage.onerror = () => {
        loadingSpinner.style.display = 'none';
        // Handle error if image missing (e.g. placeholder)
        quizImage.alt = "Obrázek se nepodařilo načíst: " + data.title;
        quizImage.style.display = 'block';
    }

    // Create options
    const shuffledOptions = [...data.options];
    shuffleArray(shuffledOptions);
    shuffledOptions.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('option-btn');
        button.textContent = option;
        button.addEventListener('click', () => selectOption(button, option));
        optionsContainer.appendChild(button);
    });

    updateProgress();
}

function selectOption(selectedBtn, selectedOption) {
    if (answered) return;
    answered = true;

    const data = currentQuizData[currentQuestion];
    const correctAnswer = data.correctAnswer || data.author; // Fallback for safety

    if (selectedOption === correctAnswer) {
        score++;
        selectedBtn.classList.add('correct');
        feedback.textContent = `Správně! ${data.title} (${data.year})`;
        feedback.style.color = 'var(--correct-color)';
    } else {
        selectedBtn.classList.add('wrong');
        feedback.textContent = `Chyba. Správná odpověď je: ${correctAnswer} - ${data.title}`;
        feedback.style.color = 'var(--wrong-color)';

        // Highlight correct answer
        const buttons = optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            }
        });
    }

    nextBtn.style.display = 'inline-block';
}

function updateProgress() {
    const progress = ((currentQuestion) / currentQuizData.length) * 100;
    progressBar.style.width = `${progress}%`;
}

nextBtn.addEventListener('click', () => {
    currentQuestion++;
    if (currentQuestion < currentQuizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
});

function showResults() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    scoreText.textContent = `Získal jsi ${score} z ${currentQuizData.length} bodů.`;
}

restartBtn.addEventListener('click', () => {
    currentQuestion = 0;
    score = 0;
    setupContainer.style.display = 'block';
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'none';
    initSetup();
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/questions')
        .then(res => res.json())
        .then(data => {
            quizData = data;
            initSetup();
        })
        .catch(err => {
            console.error("Failed to load questions:", err);
            alert("Nepodařilo se načíst otázky. Ujistěte se, že běží server (python server.py).");
        });
});

function initSetup() {
    // Extract unique fields and styles
    const allFields = new Set();
    const allStyles = new Set();

    quizData.forEach(item => {
        if (item.field) allFields.add(item.field);
        if (item.style) item.style.forEach(s => allStyles.add(s));
    });

    // Populate Fields
    fieldsContainer.innerHTML = '';
    allFields.forEach(field => {
        createCheckbox(field, fieldsContainer);
    });

    // Populate Styles
    stylesContainer.innerHTML = '';
    allStyles.forEach(style => {
        createCheckbox(style, stylesContainer);
    });

    updateMaxQuestions();
}

function createCheckbox(value, container) {
    const label = document.createElement('label');
    label.className = 'tag-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = value;
    checkbox.checked = true; // Default checked
    checkbox.addEventListener('change', updateMaxQuestions);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${value}`));
    container.appendChild(label);
}

function updateMaxQuestions() {
    const selectedFields = Array.from(fieldsContainer.querySelectorAll('input:checked')).map(cb => cb.value);
    const selectedStyles = Array.from(stylesContainer.querySelectorAll('input:checked')).map(cb => cb.value);

    const filteredCount = quizData.filter(item => {
        const fieldMatch = selectedFields.length === 0 || selectedFields.includes(item.field);
        const styleMatch = selectedStyles.length === 0 || (item.style && item.style.some(s => selectedStyles.includes(s)));

        // Only count if user selected AT LEAST one from each category (if we want strict enforcement)
        // Or, if we want to allow "any field" if none selected? 
        // User said: "při zadávání parametrů kvízu si vždy vybírám kromě počtu otázek z množiny oborů a z množiny stylů"
        // This implies they MUST select something.

        const hasFieldSelection = selectedFields.length > 0;
        const hasStyleSelection = selectedStyles.length > 0;

        if (!hasFieldSelection || !hasStyleSelection) return false;

        return fieldMatch && styleMatch;
    }).length;

    questionCountInput.max = filteredCount;
    questionCountInput.value = Math.min(questionCountInput.value, filteredCount);
    maxQuestionsHint.textContent = `(Dostupných: ${filteredCount})`;

    if (filteredCount === 0) {
        startBtn.disabled = true;
    } else {
        startBtn.disabled = false;
    }
}

startBtn.addEventListener('click', () => {
    const selectedFields = Array.from(fieldsContainer.querySelectorAll('input:checked')).map(cb => cb.value);
    const selectedStyles = Array.from(stylesContainer.querySelectorAll('input:checked')).map(cb => cb.value);
    const requestedCount = parseInt(questionCountInput.value);

    // Filter data
    let filteredData = quizData.filter(item => {
        const fieldMatch = selectedFields.includes(item.field);
        const styleMatch = item.style && item.style.some(s => selectedStyles.includes(s));
        return fieldMatch && styleMatch;
    });

    // Shuffle filtered data
    shuffleArray(filteredData);

    // Slice to requested count
    currentQuizData = filteredData.slice(0, requestedCount);

    if (currentQuizData.length === 0) {
        alert("Žádné otázky neodpovídají výběru.");
        return;
    }

    // Start quiz
    currentQuestion = 0;
    score = 0;
    setupContainer.style.display = 'none';
    quizContainer.style.display = 'block';
    loadQuestion();
});
