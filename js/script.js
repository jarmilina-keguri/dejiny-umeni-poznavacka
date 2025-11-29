const quizData = [
    {
        image: "assets/images/house_of_the_black_madonna.jpg",
        title: "Dům U Černé Matky Boží",
        author: "Josef Gočár",
        year: "1911–1912",
        options: ["Josef Gočár", "Pavel Janák", "Josef Chochol", "Emil Králíček"]
    },
    {
        image: "assets/images/electric_lamp_cubist.jpg",
        title: "Kubistická lampa",
        author: "Emil Králíček",
        year: "1913",
        options: ["Emil Králíček", "Josef Gočár", "Vlastislav Hofman", "Otakar Novotný"]
    },
    {
        image: "assets/images/cubist_coffee_set.jpg",
        title: "Kávový servis",
        author: "Pavel Janák",
        year: "1911",
        options: ["Pavel Janák", "Josef Gočár", "Rudolf Stockar", "Ladislav Sutnar"]
    },
    {
        image: "assets/images/cubist_painting_capek.jpg",
        title: "Piják",
        author: "Josef Čapek",
        year: "1913",
        options: ["Josef Čapek", "Emil Filla", "Bohumil Kubišta", "Antonín Procházka"]
    },
    {
        image: "assets/images/cubist_spa_gocar.jpg",
        title: "Lázeňský dům v Bohdanči",
        author: "Josef Gočár",
        year: "1913",
        options: ["Josef Gočár", "Pavel Janák", "Vlastislav Hofman", "Otakar Novotný"]
    }
];

let currentQuestion = 0;
let score = 0;
let answered = false;

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

function loadQuestion() {
    answered = false;
    const data = quizData[currentQuestion];

    // Reset UI
    feedback.textContent = '';
    feedback.className = 'feedback';
    nextBtn.style.display = 'none';
    optionsContainer.innerHTML = '';

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

    const data = quizData[currentQuestion];
    const correctAuthor = data.author;

    if (selectedOption === correctAuthor) {
        score++;
        selectedBtn.classList.add('correct');
        feedback.textContent = `Správně! ${data.title} (${data.year})`;
        feedback.style.color = 'var(--correct-color)';
    } else {
        selectedBtn.classList.add('wrong');
        feedback.textContent = `Chyba. Správná odpověď je: ${correctAuthor} - ${data.title}`;
        feedback.style.color = 'var(--wrong-color)';

        // Highlight correct answer
        const buttons = optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            if (btn.textContent === correctAuthor) {
                btn.classList.add('correct');
            }
        });
    }

    nextBtn.style.display = 'inline-block';
}

function updateProgress() {
    const progress = ((currentQuestion) / quizData.length) * 100;
    progressBar.style.width = `${progress}%`;
}

nextBtn.addEventListener('click', () => {
    currentQuestion++;
    if (currentQuestion < quizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
});

function showResults() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    scoreText.textContent = `Získal jsi ${score} z ${quizData.length} bodů.`;
}

restartBtn.addEventListener('click', () => {
    currentQuestion = 0;
    score = 0;
    quizContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    loadQuestion();
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize
loadQuestion();
