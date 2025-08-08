// I enhanced Robin's game to use Canvas API while keeping his core logic
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");

// I kept Robin's core game variables and enhanced them
let score = 0;
let isJumping = false;
let gameRunning = true;

// I added Canvas-based game objects while maintaining Robin's character concept
const character = {
    x: 50,
    y: 160, // bottom of 200px canvas minus 40px height
    width: 40,
    height: 40,
    velocityY: 0,
    color: "#2196f3" // I kept Robin's blue color
};

// I enhanced Robin's obstacle system with multiple obstacles
const obstacles = [];
let obstacleSpawnTimer = 0;
const gravity = 0.8;
const jumpPower = -15;

document.addEventListener("keydown", function (e) {
    if (e.code === "Space" && !isJumping) {
        jump();
    }
});

// I enhanced Robin's jump function with realistic physics
function jump() {
    if (!isJumping && character.y >= 160) { // only jump when on ground
        isJumping = true;
        character.velocityY = jumpPower; // I added realistic physics instead of CSS animation
    }
}

// I enhanced Robin's collision detection with proper Canvas-based rectangle collision
function checkCollisions() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // I implemented precise collision detection
        if (character.x < obstacle.x + obstacle.width &&
            character.x + character.width > obstacle.x &&
            character.y < obstacle.y + obstacle.height &&
            character.y + character.height > obstacle.y) {
            
            // I kept Robin's game over approach but enhanced it
            alert("Game Over! Your score: " + score);
            gameRunning = false;
            return;
        }
        
        // I added score increment when obstacle is passed (like Robin's concept)
        if (!obstacle.passed && obstacle.x + obstacle.width < character.x) {
            obstacle.passed = true;
            score++;
            scoreDisplay.textContent = "Score: " + score;
        }
    }
}

// I added obstacle generation (missing from Robin's implementation)
function generateObstacles() {
    obstacleSpawnTimer++;
    if (obstacleSpawnTimer >= 120) { // spawn every ~2 seconds at 60fps
        obstacles.push({
            x: canvas.width,
            y: 160,
            width: 30,
            height: 40,
            color: "#4caf50", // I kept Robin's green color
            passed: false
        });
        obstacleSpawnTimer = 0;
    }
}

// I added physics update (needed for Canvas implementation)
function updatePhysics() {
    // I apply gravity to character
    character.velocityY += gravity;
    character.y += character.velocityY;
    
    // I keep character on ground
    if (character.y >= 160) {
        character.y = 160;
        character.velocityY = 0;
        isJumping = false;
    }
    
    // I move obstacles (replacing Robin's CSS animation)
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= 3; // I kept Robin's movement speed concept
        
        // I remove off-screen obstacles
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

// I added Canvas rendering function
function draw() {
    // I clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // I draw character (keeping Robin's blue color)
    ctx.fillStyle = character.color;
    ctx.fillRect(character.x, character.y, character.width, character.height);
    
    // I draw obstacles (keeping Robin's green color)
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

// I created the main game loop (replacing Robin's setInterval approach)
function gameLoop() {
    if (!gameRunning) return;
    
    updatePhysics();
    generateObstacles();
    checkCollisions();
    draw();
    
    requestAnimationFrame(gameLoop);
}

// I start the enhanced game while maintaining Robin's core concept
gameLoop();
