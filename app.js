/**
 * Interactive Quiz Application
 * Author: Neev Rupareliya
 */

// 1. Question Bank
const QUESTION_BANK = [
  {
    category: "python",
    question: "What is the output of `type(lambda: None)` in Python 3?",
    options: ["<class 'function'>", "<class 'lambda'>", "<class 'method'>", "<class 'type'>"],
    correct: 0,
    explanation: "Lambdas in Python are anonymous function instances belonging to the function class."
  },
  {
    category: "python",
    question: "Which built-in Python module is used to calculate MD5 and SHA256 hashes?",
    options: ["crypto", "hashlib", "security", "hmac"],
    correct: 1,
    explanation: "`hashlib` is the Python standard library interface for cryptographic hashes."
  },
  {
    category: "python",
    question: "What happens when using a mutable object (like a list) as a default argument in a Python function?",
    options: [
      "A new list is created each time the function is called",
      "Python raises a SyntaxError at compile time",
      "The same list is reused across all subsequent calls",
      "The list is automatically converted to an immutable tuple"
    ],
    correct: 2,
    explanation: "Default arguments are evaluated once at definition time, causing mutable objects to retain state."
  },
  {
    category: "javascript",
    question: "What is the output of `typeof NaN` in JavaScript?",
    options: ["'undefined'", "'number'", "'NaN'", "'object'"],
    correct: 1,
    explanation: "In ECMAScript specifications, NaN (Not-a-Number) is formally a numeric data type."
  },
  {
    category: "javascript",
    question: "Which method creates a new array with all elements that pass the test implemented by the provided function?",
    options: ["map()", "filter()", "reduce()", "find()"],
    correct: 1,
    explanation: "`filter()` returns a new array with elements meeting the predicate condition."
  },
  {
    category: "javascript",
    question: "What will `console.log([] + [])` print in JavaScript?",
    options: ["undefined", "[]", "'' (empty string)", "NaN"],
    correct: 2,
    explanation: "Both arrays are converted to primitive empty strings, and concatenation results in `''`."
  },
  {
    category: "web",
    question: "Which HTML5 tag is semantically best suited to enclose self-contained independent content like a blog post or tweet?",
    options: ["<section>", "<div>", "<article>", "<main>"],
    correct: 2,
    explanation: "`<article>` represents a complete, self-contained composition intended for independent distribution."
  },
  {
    category: "web",
    question: "In CSS Flexbox, which property aligns items along the cross-axis?",
    options: ["justify-content", "align-items", "flex-direction", "align-content"],
    correct: 1,
    explanation: "`align-items` aligns flex items along the cross-axis (perpendicular to main-axis)."
  },
  {
    category: "cs",
    question: "What is the average time complexity of searching in a Balanced Binary Search Tree (e.g. AVL, Red-Black)?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correct: 1,
    explanation: "Because the tree remains height-balanced at ~log2(n), lookup executes in O(log n)."
  },
  {
    category: "cs",
    question: "Which data structure follows the Last-In, First-Out (LIFO) operational principle?",
    options: ["Queue", "Stack", "Priority Queue", "Deque"],
    correct: 1,
    explanation: "A Stack pushes and pops items from the top, adhering to LIFO order."
  },
  {
    category: "web",
    question: "What does the CSS property `box-sizing: border-box;` do?",
    options: [
      "Adds an outer 3D border around the element",
      "Includes padding and border within the element's total width and height",
      "Excludes margins from the page calculation",
      "Forces the element to be displayed as an inline-block"
    ],
    correct: 1,
    explanation: "With `border-box`, padding and border are contained within the designated width and height."
  },
  {
    category: "python",
    question: "Which data structure in Python is implemented as a hash table guaranteeing O(1) average lookup?",
    options: ["list", "tuple", "dict", "deque"],
    correct: 2,
    explanation: "Python dictionaries use optimized hash table implementations for O(1) average lookups."
  }
];

// 2. Application State
let activeQuestions = [];
let currentQuestionIndex = 0;
let userScore = 0;
let answeredCount = 0;
let timerInterval = null;
let timeLeft = 15;
let userAnswers = []; // Records user responses for review
let soundEnabled = true;

// DOM Elements
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const categorySelect = document.getElementById("category-select");
const countSelect = document.getElementById("count-select");
const startBtn = document.getElementById("start-btn");
const soundToggle = document.getElementById("sound-toggle");
const bestScoreEl = document.getElementById("best-score");

const questionIndicator = document.getElementById("question-indicator");
const currentCategory = document.getElementById("current-category");
const timeLeftEl = document.getElementById("time-left");
const timerBox = document.getElementById("timer-box");
const currentScoreEl = document.getElementById("current-score");
const progressBar = document.getElementById("progress-bar");
const questionText = document.getElementById("question-text");
const optionsGrid = document.getElementById("options-grid");
const feedbackToast = document.getElementById("feedback-toast");
const nextBtn = document.getElementById("next-btn");

const resultTitle = document.getElementById("result-title");
const scorePercentage = document.getElementById("score-percentage");
const scoreFraction = document.getElementById("score-fraction");
const statCorrect = document.getElementById("stat-correct");
const statWrong = document.getElementById("stat-wrong");
const statAccuracy = document.getElementById("stat-accuracy");
const restartBtn = document.getElementById("restart-btn");
const reviewBtn = document.getElementById("review-btn");
const reviewSection = document.getElementById("review-section");
const reviewList = document.getElementById("review-list");

// Audio Synthesizer (Web Audio API)
function playTone(freq, duration, type = "sine") {
  if (!soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function initHighScore() {
  const saved = localStorage.getItem("quizmaster_highscore") || 0;
  bestScoreEl.textContent = saved;
}

function switchScreen(from, to) {
  from.classList.remove("active");
  to.classList.add("active");
}

// Start Quiz Flow
function startQuiz() {
  const selectedCategory = categorySelect.value;
  const count = parseInt(countSelect.value, 10);

  let pool = [...QUESTION_BANK];
  if (selectedCategory !== "all") {
    pool = pool.filter(q => q.category === selectedCategory);
  }

  // Shuffle pool
  pool.sort(() => Math.random() - 0.5);
  activeQuestions = pool.slice(0, Math.min(count, pool.length));

  if (activeQuestions.length === 0) {
    alert("No questions available for this category.");
    return;
  }

  currentQuestionIndex = 0;
  userScore = 0;
  answeredCount = 0;
  userAnswers = [];
  currentScoreEl.textContent = "0";

  switchScreen(startScreen, quizScreen);
  loadQuestion();
}

function loadQuestion() {
  clearInterval(timerInterval);
  feedbackToast.textContent = "";
  feedbackToast.className = "feedback-toast";
  nextBtn.classList.add("hidden");

  const q = activeQuestions[currentQuestionIndex];
  questionIndicator.textContent = `Question ${currentQuestionIndex + 1} / ${activeQuestions.length}`;
  currentCategory.textContent = q.category.toUpperCase();
  questionText.textContent = q.question;

  // Progress Bar
  const pct = ((currentQuestionIndex) / activeQuestions.length) * 100;
  progressBar.style.width = `${pct}%`;

  // Render Options
  optionsGrid.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerHTML = `<span><strong>${String.fromCharCode(65 + idx)}.</strong> ${opt}</span>`;
    btn.onclick = () => selectOption(idx);
    optionsGrid.appendChild(btn);
  });

  // Start Timer
  startTimer();
}

function startTimer() {
  timeLeft = 15;
  timeLeftEl.textContent = timeLeft;
  timerBox.classList.remove("warning");

  timerInterval = setInterval(() => {
    timeLeft--;
    timeLeftEl.textContent = timeLeft;

    if (timeLeft <= 5) {
      timerBox.classList.add("warning");
      playTone(440, 0.05);
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function selectOption(selectedIndex) {
  clearInterval(timerInterval);
  const q = activeQuestions[currentQuestionIndex];
  const buttons = optionsGrid.querySelectorAll(".option-btn");
  buttons.forEach(b => (b.disabled = true));

  const isCorrect = selectedIndex === q.correct;
  userAnswers.push({
    question: q.question,
    userSelected: q.options[selectedIndex],
    correctAnswer: q.options[q.correct],
    explanation: q.explanation,
    isCorrect: isCorrect
  });

  if (isCorrect) {
    buttons[selectedIndex].classList.add("correct");
    const points = 10 + Math.max(0, timeLeft);
    userScore += points;
    currentScoreEl.textContent = userScore;
    feedbackToast.textContent = `✓ Correct! +${points} pts`;
    feedbackToast.style.color = "#34d399";
    playTone(660, 0.15, "triangle");
  } else {
    buttons[selectedIndex].classList.add("incorrect");
    buttons[q.correct].classList.add("correct");
    feedbackToast.textContent = `✗ Incorrect!`;
    feedbackToast.style.color = "#f87171";
    playTone(220, 0.25, "sawtooth");
  }

  nextBtn.classList.remove("hidden");
}

function handleTimeout() {
  const q = activeQuestions[currentQuestionIndex];
  const buttons = optionsGrid.querySelectorAll(".option-btn");
  buttons.forEach(b => (b.disabled = true));
  buttons[q.correct].classList.add("correct");

  userAnswers.push({
    question: q.question,
    userSelected: "Timed Out",
    correctAnswer: q.options[q.correct],
    explanation: q.explanation,
    isCorrect: false
  });

  feedbackToast.textContent = "⏱️ Time's up!";
  feedbackToast.style.color = "#f87171";
  playTone(180, 0.3, "sawtooth");
  nextBtn.classList.remove("hidden");
}

function handleNextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < activeQuestions.length) {
    loadQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  clearInterval(timerInterval);
  progressBar.style.width = "100%";

  const total = activeQuestions.length;
  const correct = userAnswers.filter(a => a.isCorrect).length;
  const wrong = total - correct;
  const accuracy = Math.round((correct / total) * 100);

  scorePercentage.textContent = `${accuracy}%`;
  scoreFraction.textContent = `${correct} / ${total} Correct`;
  statCorrect.textContent = correct;
  statWrong.textContent = wrong;
  statAccuracy.textContent = `${accuracy}%`;

  document.querySelector(".score-summary-circle").style.setProperty("--score-pct", accuracy);

  // Save High Score
  const currentBest = parseInt(localStorage.getItem("quizmaster_highscore") || 0, 10);
  if (userScore > currentBest) {
    localStorage.setItem("quizmaster_highscore", userScore);
    bestScoreEl.textContent = userScore;
  }

  // Populate Review List
  reviewList.innerHTML = "";
  userAnswers.forEach((ans, i) => {
    const item = document.createElement("div");
    item.className = "review-item";
    item.innerHTML = `
      <div class="review-q">Q${i + 1}: ${ans.question}</div>
      <div class="${ans.isCorrect ? 'review-answer-correct' : 'review-answer-user'}">
        Your Answer: ${ans.userSelected} ${ans.isCorrect ? '✓' : '✗'}
      </div>
      ${!ans.isCorrect ? `<div class="review-answer-correct">Correct Answer: ${ans.correctAnswer}</div>` : ''}
      <div class="review-explanation"><strong>Explanation:</strong> ${ans.explanation}</div>
    `;
    reviewList.appendChild(item);
  });

  switchScreen(quizScreen, resultScreen);
  playTone(880, 0.3, "sine");
}

// Event Listeners
startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", handleNextQuestion);
restartBtn.addEventListener("click", () => {
  reviewSection.classList.add("hidden");
  switchScreen(resultScreen, startScreen);
});

reviewBtn.addEventListener("click", () => {
  reviewSection.classList.toggle("hidden");
  if (!reviewSection.classList.contains("hidden")) {
    reviewSection.scrollIntoView({ behavior: "smooth" });
  }
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? "🔊" : "🔇";
});

// Initialize on page load
initHighScore();
