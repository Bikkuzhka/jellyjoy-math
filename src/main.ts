type Operator = "+";

interface Equation {
  a: number;
  b: number;
  operator: Operator;
  answer: number;
}

interface GameState {
  score: number;
  round: number;
  timeLeft: number;
  timerId: number | null;
  isLocked: boolean;
}

const OPTION_COUNT = 4;
const TIME_PER_ROUND_SECONDS = 20;

let state: GameState;
let currentEquation: Equation | null = null;

// DOM-элементы
let equationTextEl: HTMLElement;
let feedbackEl: HTMLElement;
let scoreEl: HTMLElement;
let roundEl: HTMLElement;
let timerEl: HTMLElement;
let jellyContainerEl: HTMLElement;

document.addEventListener("DOMContentLoaded", () => {
  const equation = document.getElementById("equation-text");
  const feedback = document.getElementById("feedback");
  const score = document.getElementById("score-value");
  const round = document.getElementById("task-count");
  const timer = document.getElementById("timer-value");
  const jellyContainer = document.getElementById("jellyfish-container");

  if (!equation || !feedback || !score || !round || !timer || !jellyContainer) {
    throw new Error("Отсутствуют необходимые элементы разметки.");
  }

  equationTextEl = equation;
  feedbackEl = feedback;
  scoreEl = score;
  roundEl = round;
  timerEl = timer;
  jellyContainerEl = jellyContainer;

  state = {
    score: 0,
    round: 0,
    timeLeft: TIME_PER_ROUND_SECONDS,
    timerId: null,
    isLocked: false,
  };

  startNewRound();
});

function getRandomInt(min: number, max: number): number {
  const minCeil = Math.ceil(min);
  const maxFloor = Math.floor(max);
  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}

function generateEquation(): Equation {
  // простое сложение с суммой в пределах 2–20
  const a = getRandomInt(1, 10);
  const maxB = Math.min(10, 20 - a);
  const b = getRandomInt(1, maxB);
  const answer = a + b;
  return { a, b, operator: "+", answer };
}

function generateOptions(equation: Equation, count: number): number[] {
  const values = new Set<number>();
  values.add(equation.answer);

  while (values.size < count) {
    const offset = getRandomInt(-10, 10);
    if (offset === 0) {
      continue;
    }
    const candidate = equation.answer + offset;
    if (candidate <= 0) {
      continue;
    }
    values.add(candidate);
  }

  const result = Array.from(values);
  shuffleInPlace(result);
  return result;
}

function shuffleInPlace(arr: number[]): void {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));

    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
}
function startNewRound(): void {
  clearTimer();

  state.round += 1;
  state.timeLeft = TIME_PER_ROUND_SECONDS;
  state.isLocked = false;
  currentEquation = generateEquation();

  clearFeedback();
  updateStats();
  updateTimerUI();
  renderEquation();
  renderOptions();
  startTimer();
}

function renderEquation(): void {
  if (!currentEquation) {
    return;
  }
  const eq = currentEquation;
  equationTextEl.textContent = `${eq.a} + ${eq.b} = ?`;
}

function renderOptions(): void {
  if (!currentEquation) {
    return;
  }

  const options = generateOptions(currentEquation, OPTION_COUNT);
  jellyContainerEl.innerHTML = "";

  options.forEach((value) => {
    const jelly = document.createElement("button");
    jelly.className = "jellyfish";
    jelly.type = "button";
    const label = document.createElement("span");
label.className = "jellyfish-label";
label.textContent = value.toString();

jelly.appendChild(label);
jelly.dataset.value = value.toString();


    jelly.addEventListener("click", () => {
      handleJellyClick(value, jelly);
    });

    jellyContainerEl.appendChild(jelly);
  });
}

function handleJellyClick(value: number, element: HTMLButtonElement): void {
  if (state.isLocked || !currentEquation) {
    return;
  }

  const isCorrect = value === currentEquation.answer;

  if (isCorrect) {
    state.isLocked = true;
    state.score += 10;
    updateStats();
    showFeedback("Верно! 🎉", "feedback--success");
    clearTimer();

    const others = jellyContainerEl.querySelectorAll<HTMLButtonElement>(".jellyfish");
    others.forEach((btn) => {
      btn.disabled = true;
    });

    element.classList.remove("jellyfish--wrong");
    element.classList.add("jellyfish--correct");

    const onAnimationEnd = () => {
      element.removeEventListener("animationend", onAnimationEnd);
      startNewRound();
    };

    element.addEventListener("animationend", onAnimationEnd);
  } else {
    state.score = Math.max(0, state.score - 2);
    updateStats();
    showFeedback("Не совсем, попробуй ещё 🪼", "feedback--error");

    element.classList.remove("jellyfish--wrong");
    element.offsetWidth; 
    element.classList.add("jellyfish--wrong");
  }
}

function startTimer(): void {
  updateTimerUI();

  const id = window.setInterval(() => {
    state.timeLeft -= 1;
    updateTimerUI();

    if (state.timeLeft <= 0) {
      clearTimer();
      handleTimeOver();
    }
  }, 1000);

  state.timerId = id;
}

function clearTimer(): void {
  if (state.timerId !== null) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function handleTimeOver(): void {
  if (state.isLocked) {
    return;
  }

  state.isLocked = true;
  showFeedback("Время вышло! Новая задачка ⏰", "feedback--error");

  const buttons = jellyContainerEl.querySelectorAll<HTMLButtonElement>(".jellyfish");
  buttons.forEach((btn) => {
    btn.disabled = true;
  });

  window.setTimeout(() => {
    startNewRound();
  }, 1000);
}

function updateStats(): void {
  scoreEl.textContent = state.score.toString();
  roundEl.textContent = state.round.toString();
}

function updateTimerUI(): void {
  timerEl.textContent = state.timeLeft.toString();
}

function clearFeedback(): void {
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
}

function showFeedback(message: string, extraClass: string): void {
  feedbackEl.textContent = message;
  feedbackEl.className = `feedback ${extraClass}`;
}
