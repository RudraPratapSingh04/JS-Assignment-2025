let score = 0;
let best = localStorage.getItem("bestScore")
  ? parseInt(localStorage.getItem("bestScore"))
  : 0;
let skipChance = 3;
let word = "";
let fallSpeed = 0.4;
let currentWordDiv = null;
let animationFrameId = null;
const exitBtn = document.getElementById("exit");
const mainBox = document.getElementById("mainBox");
const scoreBox = document.getElementById("scoreBox");
const lowBtn = document.getElementById("lowBtn");
const highBtn = document.getElementById("highBtn");
const ansBox = document.getElementById("ansBox");
const openSpace = document.getElementById("openSpace");
const scoreDiv = document.getElementById("score");
const skipBtn = document.getElementById("skipBtn");
const life = document.getElementById("life");
life.innerText = "❤️❤️❤️";
skipBtn.addEventListener("click", () => {
  if (skipChance > 0) {
    if (skipChance == 3) {
      life.innerText = "❤️❤️";
    }
    if (skipChance == 2) {
      life.innerText = "❤️";
    }
    if (skipChance == 1) {
      life.innerText = "";
    }
    cancelAnimationFrame(animationFrameId);
    if (currentWordDiv && currentWordDiv.parentElement === openSpace) {
      openSpace.removeChild(currentWordDiv);
    }
    startGame();
    skipChance--;
  }
});
scoreDiv.innerText = `SCORE : ${score}`;

const bestDiv = document.getElementById("bestDiv");
bestDiv.innerText = `BEST : ${best}`;

exitBtn.addEventListener("click", gameOver);
lowBtn.addEventListener("click", () => {
  if (fallSpeed > 0.2) fallSpeed -= 0.1;
});

highBtn.addEventListener("click", () => {
  if (fallSpeed < 1) fallSpeed += 0.1;
});

ansBox.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const answer = ansBox.value.trim().toLowerCase();
    ansBox.value = "";

    if (answer === word) {
      cancelAnimationFrame(animationFrameId);
      if (currentWordDiv && currentWordDiv.parentElement === openSpace) {
        openSpace.removeChild(currentWordDiv);
      }
      score++;
      scoreDiv.innerText = `SCORE : ${score}`;

      if (score > best) {
        best = score;
        localStorage.setItem("bestScore", best);
      }
      startGame();
    }
  }
});

function startGame() {
  ansBox.value = "";
  getWord();
}

async function getWord() {
  const url = "https://random-word-api.vercel.app/api?words=1";
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);

    const json = await response.json();
    word = json[0];
    console.log("Word:", word);

    if (currentWordDiv && currentWordDiv.parentElement === openSpace) {
      openSpace.removeChild(currentWordDiv);
    }

    const wordDiv = document.createElement("div");
    wordDiv.textContent = word;
    wordDiv.id = "wordDiv";
    wordDiv.style.position = "absolute";
    wordDiv.style.top = "-30px";
    wordDiv.style.left = `${getRandomInteger(20, 80)}%`;
    wordDiv.style.transform = "translateX(-50%)";
    openSpace.appendChild(wordDiv);
    currentWordDiv = wordDiv;

    let posY = -30;
    const maxY = openSpace.offsetHeight - 30;

    function fall() {
      if (posY < maxY) {
        posY += fallSpeed;
        wordDiv.style.top = `${posY}px`;
        animationFrameId = requestAnimationFrame(fall);
      } else {
        gameOver();
      }
    }

    animationFrameId = requestAnimationFrame(fall);
  } catch (error) {
    console.error("Error fetching word:", error.message);
  }
}

function gameOver() {
  cancelAnimationFrame(animationFrameId);
  if (score > best) best = score;
  bestDiv.innerText = `BEST : ${best}`;

  mainBox.innerHTML = `<div style='font-size:40px'>Game Over!</div><div style='font-size:25px;color:yellow' >Your Score is ${score}  </div><div style='font-size:15px;color:red'>Best :${best}</div><div class="button" style="width:fit-content;margin:auto;margin-top:20px;padding:1rem;cursor:pointer;" onclick="history.go(0)">Restart</div>`;
  mainBox.style.backgroundImage = "url()";
  mainBox.style.backgroundColor = "black";
  scoreBox.style.backgroundColor = "black";
  mainBox.style.color = "white";

  mainBox.classList.add("gameOver");
  scoreBox.innerHTML = "";
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

document.addEventListener("DOMContentLoaded", startGame);
