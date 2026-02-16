const TARGET_SCORE = 3;
const DIRECTIONS = ["head", "body", "legs"];

const state = {
  scores: {
    player: 0,
    ai: 0,
  },
  attacker: Math.random() < 0.5 ? "player" : "ai",
  pendingSelection: null,
  pendingAiAttack: null,
  awaitingNext: false,
  gameOver: false,
  winner: null,
  hitDefender: null,
  scoreFlash: null,
  effectToken: 0,
  lastRound: "",
};

const elements = {
  playerScore: document.getElementById("player-score"),
  aiScore: document.getElementById("ai-score"),
  playerScoreItem: document.getElementById("player-score-item"),
  aiScoreItem: document.getElementById("ai-score-item"),
  attackerName: document.getElementById("attacker-name"),
  selectionMode: document.getElementById("selection-mode"),
  playerPanel: document.getElementById("player-panel"),
  aiPanel: document.getElementById("ai-panel"),
  confirmBtn: document.getElementById("confirm-btn"),
  nextBtn: document.getElementById("next-btn"),
  logBox: document.getElementById("battle-log"),
  directionButtons: Array.from(document.querySelectorAll("[data-direction]")),
  gameOverOverlay: document.getElementById("game-over-overlay"),
  winnerText: document.getElementById("winner-text"),
  restartBtn: document.getElementById("restart-btn"),
};

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function randomDirection() {
  return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
}

function attackerLabel() {
  return state.attacker === "player" ? "Player" : "AI";
}

function defenderLabel() {
  return state.attacker === "player" ? "AI" : "Player";
}

function prepareTurn() {
  if (state.attacker === "ai") {
    state.pendingAiAttack = randomDirection();
  } else {
    state.pendingAiAttack = null;
  }
}

function startTurnMessage() {
  if (state.attacker === "player") {
    return "Player turn: Select attack direction.";
  }

  return "AI turn: Select block direction.";
}

function render() {
  elements.playerScore.textContent = String(state.scores.player);
  elements.aiScore.textContent = String(state.scores.ai);
  elements.attackerName.textContent = attackerLabel();

  if (state.gameOver) {
    elements.selectionMode.textContent = "Game Over";
  } else if (state.awaitingNext) {
    elements.selectionMode.textContent = "Round Complete";
  } else {
    elements.selectionMode.textContent = state.attacker === "player" ? "Select Attack" : "Select Block";
  }

  elements.playerPanel.classList.toggle("is-attacker", state.attacker === "player" && !state.gameOver);
  elements.aiPanel.classList.toggle("is-attacker", state.attacker === "ai" && !state.gameOver);
  elements.playerPanel.classList.toggle("is-hit", state.hitDefender === "player");
  elements.aiPanel.classList.toggle("is-hit", state.hitDefender === "ai");

  elements.playerScoreItem.classList.toggle("is-flash", state.scoreFlash === "player");
  elements.aiScoreItem.classList.toggle("is-flash", state.scoreFlash === "ai");

  const controlsLocked = state.awaitingNext || state.gameOver;
  elements.directionButtons.forEach((button) => {
    const isSelected = button.dataset.direction === state.pendingSelection;
    button.classList.toggle("is-selected", isSelected);
    button.disabled = controlsLocked;
  });

  elements.confirmBtn.disabled = !state.pendingSelection || controlsLocked;
  elements.nextBtn.hidden = !state.awaitingNext || state.gameOver;
  elements.logBox.innerHTML = `<p>${state.lastRound}</p>`;

  elements.gameOverOverlay.classList.toggle("is-open", state.gameOver);
  if (state.gameOver && state.winner) {
    elements.winnerText.textContent = `Winner: ${state.winner === "player" ? "Player" : "AI"}`;
  } else {
    elements.winnerText.textContent = "Winner: -";
  }
}

function triggerHitEffects(attackerSide, defenderSide) {
  state.hitDefender = defenderSide;
  state.scoreFlash = attackerSide;
  state.effectToken += 1;
  const token = state.effectToken;
  render();

  setTimeout(() => {
    if (token !== state.effectToken) {
      return;
    }

    state.hitDefender = null;
    state.scoreFlash = null;
    render();
  }, 560);
}

function resolveRound() {
  const attacker = attackerLabel();
  const defender = defenderLabel();

  let attackDir;
  let blockDir;

  if (state.attacker === "player") {
    attackDir = state.pendingSelection;
    blockDir = randomDirection();
  } else {
    attackDir = state.pendingAiAttack;
    blockDir = state.pendingSelection;
  }

  if (attackDir !== blockDir) {
    state.scores[state.attacker] += 1;
    const defenderSide = state.attacker === "player" ? "ai" : "player";
    triggerHitEffects(state.attacker, defenderSide);
    state.lastRound =
      `${attacker} attack: ${capitalize(attackDir)}. ` +
      `${defender} block: ${capitalize(blockDir)}. ` +
      `${attacker} scores!`;
  } else {
    state.hitDefender = null;
    state.scoreFlash = null;
    state.lastRound =
      `${attacker} attack: ${capitalize(attackDir)}. ` +
      `${defender} block: ${capitalize(blockDir)}. ` +
      `No score.`;
  }

  if (state.scores[state.attacker] >= TARGET_SCORE) {
    state.gameOver = true;
    state.winner = state.attacker;
    state.awaitingNext = false;
  } else {
    state.awaitingNext = true;
  }

  state.pendingSelection = null;
}

function advanceTurn() {
  state.attacker = state.attacker === "player" ? "ai" : "player";
  state.awaitingNext = false;
  state.pendingSelection = null;
  state.hitDefender = null;
  state.scoreFlash = null;
  prepareTurn();
  state.lastRound = startTurnMessage();
}

function resetGame() {
  state.scores.player = 0;
  state.scores.ai = 0;
  state.attacker = Math.random() < 0.5 ? "player" : "ai";
  state.pendingSelection = null;
  state.pendingAiAttack = null;
  state.awaitingNext = false;
  state.gameOver = false;
  state.winner = null;
  state.hitDefender = null;
  state.scoreFlash = null;
  prepareTurn();
  state.lastRound =
    `First attacker: ${attackerLabel()}. ` +
    `Choose ${state.attacker === "player" ? "attack" : "block"} direction.`;
}

elements.directionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (state.awaitingNext || state.gameOver) {
      return;
    }

    state.pendingSelection = button.dataset.direction;
    render();
  });
});

elements.confirmBtn.addEventListener("click", () => {
  if (!state.pendingSelection || state.awaitingNext || state.gameOver) {
    return;
  }

  resolveRound();
  render();
});

elements.nextBtn.addEventListener("click", () => {
  if (!state.awaitingNext || state.gameOver) {
    return;
  }

  advanceTurn();
  render();
});

elements.restartBtn.addEventListener("click", () => {
  resetGame();
  render();
});

resetGame();
render();
