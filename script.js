const character = document.getElementById("character");
const obstacle = document.getElementById("obstacle");
const scoreDisplay = document.getElementById("score");

let score = 0;
let isJumping = false;
let gameRunning = true;

document.addEventListener("keydown", function (e) {
    if (e.code === "Space" && !isJumping) {
        jump();
    }
});

function jump() {
    isJumping = true;
    character.classList.add("jump");
    setTimeout(() => {
        character.classList.remove("jump");
        isJumping = false;
    }, 500);
}

let checkCollision = setInterval(() => {
    if (!gameRunning) return;

    const characterTop = parseInt(window.getComputedStyle(character).getPropertyValue("top"));
    const obstacleLeft = parseInt(window.getComputedStyle(obstacle).getPropertyValue("right"));

    const characterBottom = parseInt(window.getComputedStyle(character).getPropertyValue("bottom"));
    const obstacleRight = 600 - obstacleLeft;
    const obstacleLeftEdge = obstacleRight - 30;

    const collision =
        obstacleLeftEdge < 90 &&
        obstacleRight > 50 &&
        characterBottom < 40;

    if (collision) {
        alert("Game Over! Your score: " + score);
        gameRunning = false;
        obstacle.style.animation = "none";
        obstacle.style.display = "none";
    }
}, 10);

let scoreCounter = setInterval(() => {
    if (gameRunning) {
        score++;
        scoreDisplay.textContent = "Score: " + score;
    }
}, 500);
