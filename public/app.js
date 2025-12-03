const questions = [
  {
    text: "What is the theme of this presentation?",
    choices: ["Paranoia", "Despair", "Burger", "Joy", "Fear"],
    correctIndex: 0,
    explanation: "Paranoia sits at the center of the narrative.",
  },
  {
    text: "What is the Black Veil symbolic of?",
    choices: [
      "Hiding identity",
      "The community’s perception of an individual",
      "Darkness and doom",
      "The feeling that you will never find love",
      "Puppies!",
    ],
    correctIndex: 1,
    explanation: "It reflects how the community projects meaning onto a person.",
  },
  {
    text: "Which one of these is not a symbol of yummy food?",
    choices: ["Savory", "Buttery", "Paranoia", "Garlicky", "Sweet"],
    correctIndex: 2,
    explanation: "Paranoia is not exactly appetizing.",
  },
  {
    text: "Which factor most contributes to Ichabod’s paranoia?",
    choices: ["Lack of sleep", "The town’s ghost stories", "Dad jokes", "A strange noise"],
    correctIndex: 1,
    explanation: "Local legends fuel his fear.",
  },
  {
    text: "Why is Blanche initially isolated from the beginning of the story?",
    choices: [
      "She isn’t",
      "She wears fox furs",
      "She’s a drunk",
      "She comes from a high-class lifestyle",
      "Stanley thinks she’s ugly",
    ],
    correctIndex: 3,
    explanation: "Her social status sets her apart at the outset.",
  },
];

const scares = [
  {
    img: "media/foxy.gif",
    audio: "media/foxy.mp3",
  },
];

const state = {
  current: 0,
  score: 0,
  answers: [],
  timer: null,
  timeLeft: 15,
  studentName: "",
  studentId: "",
};

const elements = {
  startScreen: document.getElementById("start-screen"),
  quizScreen: document.getElementById("quiz-screen"),
  resultScreen: document.getElementById("result-screen"),
  startForm: document.getElementById("start-form"),
  nameInput: document.getElementById("student-name"),
  idInput: document.getElementById("student-id"),
  hudName: document.getElementById("hud-name"),
  hudId: document.getElementById("hud-id"),
  questionText: document.getElementById("question-text"),
  choices: document.getElementById("choices"),
  progressCurrent: document.getElementById("progress-current"),
  progressTotal: document.getElementById("progress-total"),
  score: document.getElementById("score"),
  timer: document.getElementById("timer"),
  feedback: document.getElementById("feedback"),
  resultSummary: document.getElementById("result-summary"),
  answerReview: document.getElementById("answer-review"),
  scareOverlay: document.getElementById("scare-overlay"),
  scareImage: document.getElementById("scare-image"),
  scareAudio: document.getElementById("scare-audio"),
};

elements.progressTotal.textContent = questions.length;

elements.startForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.studentName = elements.nameInput.value.trim();
  state.studentId = elements.idInput.value.trim();
  if (!state.studentName || !state.studentId) return;
  startQuiz();
});

function startQuiz() {
  resetState();
  elements.hudName.textContent = state.studentName;
  elements.hudId.textContent = state.studentId;
  showScreen("quiz");
  renderQuestion();
}

function resetState() {
  state.current = 0;
  state.score = 0;
  state.answers = [];
  elements.score.textContent = "0";
  clearInterval(state.timer);
}

function showScreen(key) {
  elements.startScreen.classList.toggle("hidden", key !== "start");
  elements.quizScreen.classList.toggle("hidden", key !== "quiz");
  elements.resultScreen.classList.toggle("hidden", key !== "result");
}

function renderQuestion() {
  const q = questions[state.current];
  elements.progressCurrent.textContent = state.current + 1;
  elements.questionText.textContent = q.text;
  elements.choices.innerHTML = "";
  elements.timer.textContent = "15";
  state.timeLeft = 15;
  elements.feedback.textContent = "";

  q.choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = choice;
    btn.onclick = () => handleAnswer(idx);
    elements.choices.appendChild(btn);
  });

  clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.timeLeft -= 1;
    elements.timer.textContent = state.timeLeft.toString().padStart(2, "0");
    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      handleAnswer(-1, true);
    }
  }, 1000);
}

function handleAnswer(choiceIndex, timedOut = false) {
  clearInterval(state.timer);
  const q = questions[state.current];
  const correct = choiceIndex === q.correctIndex;
  if (correct) {
    state.score += 1;
    elements.score.textContent = state.score;
    elements.feedback.textContent = "Correct.";
  } else {
    triggerScare();
    const selectedText = timedOut ? "Timed out" : q.choices[choiceIndex] || "No answer";
    elements.feedback.textContent = `Wrong. You picked "${selectedText}". Truth: "${q.choices[q.correctIndex]}".`;
  }

  state.answers.push({
    question: q.text,
    selected: timedOut ? "Timed out" : q.choices[choiceIndex] || "No answer",
    correctAnswer: q.choices[q.correctIndex],
    correct,
    explanation: q.explanation,
  });

  [...elements.choices.children].forEach((child, idx) => {
    child.disabled = true;
    if (idx === q.correctIndex) child.classList.add("correct");
    if (idx === choiceIndex && !correct) child.classList.add("incorrect");
  });

  setTimeout(() => {
    state.current += 1;
    if (state.current >= questions.length) {
      endQuiz();
    } else {
      renderQuestion();
    }
  }, 1000);
}

function triggerScare() {
  const pick = scares[Math.floor(Math.random() * scares.length)];
  elements.scareImage.src = pick.img;
  elements.scareOverlay.classList.remove("hidden");
  elements.scareAudio.src = pick.audio;
  elements.scareAudio.volume = 0.8;
  elements.scareAudio.play().catch(() => {});
  setTimeout(() => {
    elements.scareOverlay.classList.add("hidden");
    elements.scareAudio.pause();
  }, 1200);
}

function endQuiz() {
  showScreen("result");
  const total = questions.length;
  elements.resultSummary.textContent = `${state.studentName} scored ${state.score} out of ${total}.`;
  elements.answerReview.innerHTML = "";
  state.answers.forEach((a, idx) => {
    const div = document.createElement("div");
    div.className = "review-item";
    div.innerHTML = `
      <div><strong>Q${idx + 1}:</strong> ${a.question}</div>
      <div class="status ${a.correct ? "correct" : "wrong"}">${a.correct ? "Correct" : "Wrong"}</div>
      <div>Answered: ${a.selected}</div>
      <div>Truth: ${a.correctAnswer}</div>
      <div class="hint">${a.explanation}</div>
    `;
    elements.answerReview.appendChild(div);
  });

  sendResults({
    studentName: state.studentName,
    studentId: state.studentId,
    score: state.score,
    totalQuestions: total,
    answers: state.answers,
  });
}

async function sendResults(payload) {
  try {
    await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Failed to save results", err);
  }
}
