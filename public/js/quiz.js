
const generateBtn = document.getElementById("generateQuizBtn");
const submitBtn = document.getElementById("submitQuizBtn");
const retryBtn = document.getElementById("retryBtn");

const quizArea = document.getElementById("quizArea");
const resultArea = document.getElementById("resultArea");
const quizStatus = document.getElementById("quizStatus");
const questionsContainer = document.getElementById("questionsContainer");
const reviewContainer = document.getElementById("reviewContainer");

let currentQuestions = [];

generateBtn.addEventListener("click", generateQuiz);

async function generateQuiz() {
    const subject = document.getElementById("quizSubject").value;
    const topic = document.getElementById("quizTopic").value.trim();
    const count = Number(document.getElementById("questionCount").value);
    const difficulty = document.getElementById("difficulty").value;

    if (!topic) {
        quizStatus.textContent = "Please enter a topic first.";
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    quizStatus.textContent = "AI is preparing your questions. Please wait.";

    quizArea.classList.add("hidden");
    resultArea.classList.add("hidden");

    try {
        const response = await fetch("/api/quiz", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                subject,
                topic,
                count,
                difficulty
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to generate quiz.");
        }

        if (!Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error("The AI returned an invalid quiz. Please try again.");
        }

        currentQuestions = data.questions;

        currentQuestions.forEach((q, index) => {
            if (
                typeof q.question !== "string" ||
                !Array.isArray(q.options) ||
                q.options.length !== 4 ||
                !Number.isInteger(q.answer) ||
                q.answer < 0 ||
                q.answer > 3
            ) {
                throw new Error(`Question ${index + 1} has invalid data.`);
            }
        });

        displayQuestions();

        quizStatus.textContent = "";
        quizArea.classList.remove("hidden");

    } catch (error) {
        quizStatus.textContent = error.message;
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate Quiz";
    }
}

function displayQuestions() {
    questionsContainer.innerHTML = "";

    const subject = document.getElementById("quizSubject").value;
    const topic = document.getElementById("quizTopic").value;

    document.getElementById("quizTitle").textContent =
        `${subject} - ${topic}`;

    currentQuestions.forEach((q, index) => {
        const card = document.createElement("div");
        card.className = "question-card";

        const heading = document.createElement("h3");
        heading.textContent = `${index + 1}. ${q.question}`;
        card.appendChild(heading);

        q.options.forEach((option, optionIndex) => {
            const label = document.createElement("label");
            label.className = "option";

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = `question-${index}`;
            radio.value = optionIndex;

            const optionText = document.createElement("span");
            optionText.textContent = option;

            label.appendChild(radio);
            label.appendChild(optionText);
            card.appendChild(label);
        });

        questionsContainer.appendChild(card);
    });
}

submitBtn.addEventListener("click", submitQuiz);

function submitQuiz() {
    let score = 0;

    const unanswered = currentQuestions.filter((q, index) => {
        return !document.querySelector(
            `input[name="question-${index}"]:checked`
        );
    });

    if (unanswered.length > 0) {
        quizStatus.textContent =
            `Please answer all ${currentQuestions.length} questions before submitting.`;
        return;
    }

    quizStatus.textContent = "";

    currentQuestions.forEach((q, index) => {
        const selected = document.querySelector(
            `input[name="question-${index}"]:checked`
        );

        if (Number(selected.value) === q.answer) {
            score++;
        }
    });

    document.getElementById("scoreText").textContent =
        `Your Score: ${score} / ${currentQuestions.length}`;

    showReview();

    quizArea.classList.add("hidden");
    resultArea.classList.remove("hidden");
}

function showReview() {
    reviewContainer.innerHTML = "";

    currentQuestions.forEach((q, index) => {
        const selected = document.querySelector(
            `input[name="question-${index}"]:checked`
        );

        const selectedAnswer = Number(selected.value);
        const isCorrect = selectedAnswer === q.answer;

        const card = document.createElement("div");
        card.className = "question-card";

        const heading = document.createElement("h3");
        heading.textContent = `${index + 1}. ${q.question}`;
        card.appendChild(heading);

        const yourAnswer = document.createElement("p");
        yourAnswer.textContent =
            `Your answer: ${q.options[selectedAnswer]}`;
        card.appendChild(yourAnswer);

        const correctAnswer = document.createElement("p");
        correctAnswer.textContent =
            `Correct answer: ${q.options[q.answer]}`;
        card.appendChild(correctAnswer);

        const feedback = document.createElement("p");
        feedback.className = "feedback";
        feedback.textContent = isCorrect
            ? "Correct!"
            : "Incorrect.";
        card.appendChild(feedback);

        if (q.explanation) {
            const explanation = document.createElement("p");
            explanation.className = "feedback";
            explanation.textContent = `Explanation: ${q.explanation}`;
            card.appendChild(explanation);
        }

        reviewContainer.appendChild(card);
    });
}

retryBtn.addEventListener("click", () => {
    resultArea.classList.add("hidden");
    quizArea.classList.add("hidden");
    quizStatus.textContent = "";
    questionsContainer.innerHTML = "";
    reviewContainer.innerHTML = "";
    currentQuestions = [];
});
