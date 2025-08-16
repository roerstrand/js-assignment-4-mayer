// 🎮 Ultimate Kids' Jumping Adventure - Character-Based Game Engine
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas size
canvas.width = 800;
canvas.height = 400;

// 🔖 Single source of truth for achievements (icon included)
const achievements = [
    { id: 'first_jump', name: 'First Jump', desc: 'Make your first jump', icon: '🦘', condition: () => gameStats.totalJumps >= 1 },
    { id: 'century', name: 'Century', desc: 'Reach 100 points', icon: '⭐', condition: () => gameState.score >= 100 },
    { id: 'speed_demon', name: 'Speed Demon', desc: 'Reach level 5', icon: '🔥', condition: () => gameState.level >= 5 },
    { id: 'perfect_run', name: 'Perfect Run', desc: 'Score 500 without power-ups', icon: '💎', condition: () => gameState.score >= 500 },
    { id: 'jumper', name: 'Super Jumper', desc: 'Make 100 jumps total', icon: '📈', condition: () => gameStats.totalJumps >= 100 },
    { id: 'veteran', name: 'Game Veteran', desc: 'Play 25 games', icon: '🏆', condition: () => gameStats.totalGames >= 25 },
];


// 🎯 Game State Management
let gameState = {
    score: 0,
    highScore: parseInt(localStorage.getItem('jumpingGameHighScore')) || 0,
    level: 1,
    speed: 1.0,
    isRunning: false,
    isPaused: false,
    isGameOver: false,
    theme: localStorage.getItem('jumpingGameTheme') || 'forest',
    soundEnabled: localStorage.getItem('jumpingGameSound') !== 'false',
    frameCount: 0,
    lastPowerUp: 0
};

// 📊 Enhanced Statistics
let gameStats = {
    totalJumps: parseInt(localStorage.getItem('totalJumps')) || 0,
    totalObstacles: parseInt(localStorage.getItem('totalObstacles')) || 0,
    totalGames: parseInt(localStorage.getItem('totalGames')) || 0,
    bestScore: parseInt(localStorage.getItem('bestScore')) || 0,
    achievements: new Set(JSON.parse(localStorage.getItem('achievements') || '[]'))
};

// 🎨 Game Themes with Character Art
const themes = {
    forest: {
        name: "🌲 Forest Adventure",
        background: {
            primary: "linear-gradient(180deg, #87CEEB 0%, #98FB98 50%, #228B22 100%)",
            ground: "#8B4513"
        },
        character: {
            body: "#FFB6C1", // Pink bunny
            ears: "#FFB6C1",
            eyes: "#000000",
            nose: "#FF1493"
        },
        obstacles: {
            body: "#8B4513", // Brown tree stumps
            top: "#228B22"
        },
        powerUps: {
            body: "#FFD700", // Golden carrots
            leaf: "#32CD32"
        }
    },
    ocean: {
        name: "🌊 Ocean Quest",
        background: {
            primary: "linear-gradient(180deg, #87CEEB 0%, #4682B4 50%, #191970 100%)",
            ground: "#F4A460"
        },
        character: {
            body: "#FF6347", // Orange fish
            fins: "#FF4500",
            eyes: "#000000",
            bubbles: "#87CEEB"
        },
        obstacles: {
            body: "#2F4F4F", // Dark coral
            top: "#FF7F50"
        },
        powerUps: {
            body: "#FFD700", // Golden shells
            pearl: "#FFFFFF"
        }
    },
    space: {
        name: "🚀 Space Odyssey",
        background: {
            primary: "linear-gradient(180deg, #000000 0%, #191970 50%, #4B0082 100%)",
            ground: "#696969"
        },
        character: {
            body: "#32CD32", // Green alien
            eyes: "#000000",
            antenna: "#FFD700",
            glow: "#00FF00"
        },
        obstacles: {
            body: "#696969", // Gray meteors
            glow: "#FF6347"
        },
        powerUps: {
            body: "#FFD700", // Golden stars
            glow: "#FFFF00"
        }
    }
};

// 🎯 Game Configuration
const CONFIG = {
    canvas: { width: 800, height: 400 },
    character: {
        width: 50,
        height: 50,
        x: 100,
        jumpPower: -18,
        maxJumps: 2
    },
    physics: {
        gravity: 0.9,
        groundY: 320,
        terminalVelocity: 20
    },
    game: {
        baseSpeed: 5,
        speedIncrement: 0.3,
        obstacleSpawnRate: 100,
        powerUpChance: 0.015,
        maxObstacles: 5,  // Performance limit
        maxPowerUps: 3,   // Performance limit
        maxParticles: 50  // Performance limit
    },
    performance: {
        particleUpdateFreq: 2,     // Update particles every 2 frames
        achievementCheckFreq: 60,  // Check achievements every 60 frames
        collisionMargin: 5         // Collision detection margin
    }
};

// 🐰 Enhanced Character with Animation
const character = {
    x: CONFIG.character.x,
    y: CONFIG.physics.groundY - CONFIG.character.height,
    width: CONFIG.character.width,
    height: CONFIG.character.height,
    velocityY: 0,
    isJumping: false,
    jumpCount: 0,
    rotation: 0,
    bounceOffset: 0,
    animationFrame: 0,
    lastJumpTime: 0
};

// 🌟 Game Objects
const obstacles = [];
const powerUps = [];
const particles = [];
let obstacleSpawnTimer = 0;
let backgroundOffset = 0;

// 🎬 Animation System
function createParticle(x, y, color, type = 'circle') {
    return {
        x: x + Math.random() * 20 - 10,
        y: y + Math.random() * 20 - 10,
        velocityX: (Math.random() - 0.5) * 8,
        velocityY: Math.random() * -8 - 2,
        life: 30,
        maxLife: 30,
        color: color,
        size: Math.random() * 6 + 3,
        type: type
    };
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.velocityY += 0.3;
        particle.life--;

        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;

        if (particle.type === 'star') {
            drawStar(particle.x, particle.y, particle.size);
        } else {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });
}

// 🌟 Star Drawing Function
function drawStar(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * size,
            Math.sin((18 + i * 72) * Math.PI / 180) * size);
        ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * size * 0.5,
            Math.sin((54 + i * 72) * Math.PI / 180) * size * 0.5);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// 🎨 Optimized Character Drawing
function drawCharacter() {
    const theme = themes[gameState.theme];
    const charTheme = theme.character;

    ctx.save();
    ctx.translate(character.x + character.width / 2, character.y + character.height / 2);

    // Simplified rotation during jump
    if (character.isJumping) {
        ctx.rotate(character.rotation * 0.5); // Reduced rotation for performance
    }

    // Reduced bounce animation
    if (!character.isJumping && gameState.frameCount % 4 === 0) {
        character.bounceOffset = Math.sin(gameState.frameCount * 0.2) * 2;
    }

    ctx.translate(0, character.bounceOffset);

    // Draw character based on theme
    if (gameState.theme === 'forest') {
        drawBunny(charTheme);
    } else if (gameState.theme === 'ocean') {
        drawFish(charTheme);
    } else if (gameState.theme === 'space') {
        drawAlien(charTheme);
    }

    ctx.restore();
}

function drawBunny(theme) {
    const size = character.width;

    // Ears
    ctx.fillStyle = theme.ears;
    ctx.beginPath();
    ctx.ellipse(-size * 0.2, -size * 0.3, size * 0.15, size * 0.3, 0, 0, Math.PI * 2);
    ctx.ellipse(size * 0.2, -size * 0.3, size * 0.15, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = theme.body;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.3, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = theme.eyes;
    ctx.beginPath();
    ctx.ellipse(-size * 0.1, -size * 0.1, size * 0.05, size * 0.05, 0, 0, Math.PI * 2);
    ctx.ellipse(size * 0.1, -size * 0.1, size * 0.05, size * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = theme.nose;
    ctx.beginPath();
    ctx.ellipse(0, size * 0.05, size * 0.03, size * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawFish(theme) {
    const size = character.width;

    // Body
    ctx.fillStyle = theme.body;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.3, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.fillStyle = theme.fins;
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, 0);
    ctx.lineTo(-size * 0.5, -size * 0.15);
    ctx.lineTo(-size * 0.5, size * 0.15);
    ctx.closePath();
    ctx.fill();

    // Fins
    ctx.beginPath();
    ctx.ellipse(0, size * 0.15, size * 0.1, size * 0.08, 0, 0, Math.PI * 2);
    ctx.ellipse(0, -size * 0.15, size * 0.1, size * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = theme.eyes;
    ctx.beginPath();
    ctx.ellipse(size * 0.05, -size * 0.05, size * 0.04, size * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    // Reduced bubble effects for performance
    if (Math.random() < 0.02) {
        particles.push(createParticle(character.x + character.width, character.y, theme.bubbles || '#87CEEB'));
    }
}

function drawAlien(theme) {
    const size = character.width;

    // Glow effect
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 15;

    // Body
    ctx.fillStyle = theme.body;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.25, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.2, size * 0.2, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Antenna
    ctx.strokeStyle = theme.antenna;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-size * 0.1, -size * 0.4);
    ctx.lineTo(-size * 0.1, -size * 0.5);
    ctx.moveTo(size * 0.1, -size * 0.4);
    ctx.lineTo(size * 0.1, -size * 0.5);
    ctx.stroke();

    // Antenna tips
    ctx.fillStyle = theme.antenna;
    ctx.beginPath();
    ctx.ellipse(-size * 0.1, -size * 0.5, size * 0.03, size * 0.03, 0, 0, Math.PI * 2);
    ctx.ellipse(size * 0.1, -size * 0.5, size * 0.03, size * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = theme.eyes;
    ctx.beginPath();
    ctx.ellipse(-size * 0.05, -size * 0.15, size * 0.06, size * 0.08, 0, 0, Math.PI * 2);
    ctx.ellipse(size * 0.05, -size * 0.15, size * 0.06, size * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
}

// 🎨 Optimized Background Drawing
function drawBackground() {
    const theme = themes[gameState.theme];

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simplified background based on theme
    if (gameState.theme === 'space') {
        // Space background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.5, '#191970');
        gradient.addColorStop(1, '#4B0082');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Simplified stars (fewer, no twinkling)
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 20; i++) {
            const x = (i * 40) % canvas.width;
            const y = (i * 30) % (canvas.height - 100);
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (gameState.theme === 'ocean') {
        // Ocean background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#4682B4');
        gradient.addColorStop(1, '#191970');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Simplified bubbles (fewer, static)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 8; i++) {
            const x = (i * 100) % canvas.width;
            const y = (i * 50) % (canvas.height - 100);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Forest background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#98FB98');
        gradient.addColorStop(1, '#228B22');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Ground
    ctx.fillStyle = theme.background.ground;
    ctx.fillRect(0, CONFIG.physics.groundY, canvas.width, canvas.height - CONFIG.physics.groundY);

    // Simplified ground pattern
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < canvas.width; i += 80) {
        ctx.fillRect(i, CONFIG.physics.groundY, 40, canvas.height - CONFIG.physics.groundY);
    }
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size, y, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 0.2, y - size * 0.3, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
}

// 🚧 Enhanced Obstacle Drawing
function drawObstacles() {
    const theme = themes[gameState.theme];

    obstacles.forEach(obstacle => {
        ctx.save();
        ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);

        if (gameState.theme === 'forest') {
            drawTreeStump(obstacle, theme.obstacles);
        } else if (gameState.theme === 'ocean') {
            drawCoral(obstacle, theme.obstacles);
        } else if (gameState.theme === 'space') {
            drawMeteor(obstacle, theme.obstacles);
        }

        ctx.restore();
    });
}

function drawTreeStump(obstacle, theme) {
    const w = obstacle.width;
    const h = obstacle.height;

    // Stump body
    ctx.fillStyle = theme.body;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Tree rings
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, -h / 2 + 10, i * 8, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Top foliage
    ctx.fillStyle = theme.top;
    ctx.beginPath();
    ctx.arc(0, -h / 2 - 10, w / 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawCoral(obstacle, theme) {
    const w = obstacle.width;
    const h = obstacle.height;

    // Coral base
    ctx.fillStyle = theme.body;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Coral branches
    ctx.fillStyle = theme.top;
    ctx.strokeStyle = theme.top;
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-w / 4 + i * w / 4, -h / 2);
        ctx.lineTo(-w / 4 + i * w / 4, -h / 2 - 20 - Math.random() * 10);
        ctx.stroke();
    }
}

function drawMeteor(obstacle, theme) {
    const w = obstacle.width;
    const h = obstacle.height;

    // Glow effect
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 20;

    // Meteor body
    ctx.fillStyle = theme.body;
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Crater details
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(-5, -5, 3, 0, Math.PI * 2);
    ctx.arc(8, 2, 4, 0, Math.PI * 2);
    ctx.fill();
}

// 🌟 Power-up Drawing
function drawPowerUps() {
    const theme = themes[gameState.theme];

    powerUps.forEach(powerUp => {
        ctx.save();
        ctx.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
        ctx.rotate(gameState.frameCount * 0.1);

        // Glow effect
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;

        if (gameState.theme === 'forest') {
            drawCarrot(powerUp, theme.powerUps);
        } else if (gameState.theme === 'ocean') {
            drawShell(powerUp, theme.powerUps);
        } else if (gameState.theme === 'space') {
            drawGoldenStar(powerUp, theme.powerUps);
        }

        ctx.restore();
    });
}

function drawCarrot(powerUp, theme) {
    const size = powerUp.width;

    // Carrot body
    ctx.fillStyle = theme.body;
    ctx.beginPath();
    ctx.moveTo(0, size / 3);
    ctx.lineTo(-size / 4, -size / 4);
    ctx.lineTo(size / 4, -size / 4);
    ctx.closePath();
    ctx.fill();

    // Carrot top
    ctx.fillStyle = theme.leaf;
    ctx.beginPath();
    ctx.ellipse(0, -size / 3, size / 6, size / 4, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawShell(powerUp, theme) {
    const size = powerUp.width;

    // Shell body
    ctx.fillStyle = theme.body;
    ctx.beginPath();
    ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
    ctx.fill();

    // Shell ridges
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(i * Math.PI / 3) * size / 3, Math.sin(i * Math.PI / 3) * size / 3);
        ctx.stroke();
    }

    // Pearl center
    ctx.fillStyle = theme.pearl;
    ctx.beginPath();
    ctx.arc(0, 0, size / 8, 0, Math.PI * 2);
    ctx.fill();
}

function drawGoldenStar(powerUp, theme) {
    const size = powerUp.width;

    ctx.fillStyle = theme.body;
    drawStar(0, 0, size / 3);

    // Inner glow
    ctx.fillStyle = theme.glow;
    drawStar(0, 0, size / 5);
}

// 🎮 Game Mechanics
function jump() {
    if (character.jumpCount < CONFIG.character.maxJumps) {
        character.velocityY = CONFIG.character.jumpPower;
        character.isJumping = true;
        character.jumpCount++;
        character.rotation = 0;
        character.lastJumpTime = Date.now();

        // Reduced jump particles for performance
        for (let i = 0; i < 5; i++) {
            particles.push(createParticle(
                character.x + character.width / 2,
                character.y + character.height,
                themes[gameState.theme].character.body,
                'circle'
            ));
        }

        gameStats.totalJumps++;
        saveGameData();

        // Play jump sound effect
        playSound('jump');
    }
}

function spawnObstacle() {
    if (obstacles.length >= CONFIG.game.maxObstacles) return;

    const obstacle = {
        x: canvas.width,
        y: CONFIG.physics.groundY - 60,
        width: 40 + Math.random() * 20,
        height: 60 + Math.random() * 40,
        speed: CONFIG.game.baseSpeed * gameState.speed
    };

    obstacles.push(obstacle);
}

// ✅ Put this at top-level (same level as spawnObstacle / updatePowerUps)
function spawnPowerUp() {
    // Respect max count
    if (powerUps.length >= CONFIG.game.maxPowerUps) return;

    // Only sometimes spawn (keeps it light)
    if (Math.random() < 0.3) { // 30% chance when called
        const powerUp = {
            x: canvas.width,
            y: CONFIG.physics.groundY - 80 - Math.random() * 60,
            width: 30,
            height: 30,
            speed: CONFIG.game.baseSpeed * gameState.speed,
            type: 'score'
        };
        powerUps.push(powerUp);
        gameState.lastPowerUp = Date.now();
    }
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.x -= obstacle.speed;

        // ✅ cleared by player
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(i, 1);
            gameState.score += 10;

            gameStats.totalObstacles++;             // increment here
            saveGameData();
            updateUI();

            continue;
        }

        const margin = 5;
        if (
            character.x + margin < obstacle.x + obstacle.width &&
            character.x + character.width - margin > obstacle.x &&
            character.y + margin < obstacle.y + obstacle.height &&
            character.y + character.height - margin > obstacle.y
        ) {
            playSound('collision');
            endGame();
            return;
        }
    }
}

function updateCharacter() {
    // Apply gravity
    character.velocityY += CONFIG.physics.gravity;
    character.y += character.velocityY;

    // Ground collision
    if (character.y >= CONFIG.physics.groundY - character.height) {
        character.y = CONFIG.physics.groundY - character.height;
        character.velocityY = 0;
        character.isJumping = false;
        character.jumpCount = 0;
        character.rotation = 0;
    }

    // Jump rotation animation
    if (character.isJumping) {
        const jumpTime = Date.now() - character.lastJumpTime;
        character.rotation = (jumpTime / 300) * Math.PI * 2;
    }

    // Animation frame counter
    character.animationFrame = (character.animationFrame + 1) % 60;
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.x -= obstacle.speed;

        // ✅ Count when the player has fully passed the obstacle (right edge)
        if (!obstacle._counted && (character.x > obstacle.x + obstacle.width)) {
            obstacle._counted = true;                // prevent double count
            gameStats.totalObstacles++;
            saveGameData();
            updateUI();
        }

        // Remove off-screen obstacles (unchanged)
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(i, 1);
            gameState.score += 10;
            updateUI();
            continue;
        }

        // Collision check (unchanged)
        const margin = 5;
        if (character.x + margin < obstacle.x + obstacle.width &&
            character.x + character.width - margin > obstacle.x &&
            character.y + margin < obstacle.y + obstacle.height &&
            character.y + character.height - margin > obstacle.y) {
            playSound('collision');
            endGame();
            return;
        }
    }
}


function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.x -= powerUp.speed;

        // Remove off-screen power-ups
        if (powerUp.x + powerUp.width < 0) {
            powerUps.splice(i, 1);
            continue;
        }

        // Collection detection
        // Enhanced power-up collision (more generous)
        const collectMargin = 10; // Larger collection area
        if (character.x + character.width - collectMargin > powerUp.x &&
            character.x + collectMargin < powerUp.x + powerUp.width &&
            character.y + character.height - collectMargin > powerUp.y &&
            character.y + collectMargin < powerUp.y + powerUp.height) {

            // Collect power-up
            gameState.score += 50;

            // Play collect sound effect
            playSound('collect');

            // Celebration particles (reduced)
            for (let j = 0; j < 6; j++) {
                particles.push(createParticle(
                    powerUp.x + powerUp.width / 2,
                    powerUp.y + powerUp.height / 2,
                    '#FFD700',
                    'star'
                ));
            }

            powerUps.splice(i, 1);
            updateUI();
        }
    }
}

function updateGameDifficulty() {
    gameState.level = Math.floor(gameState.score / 200) + 1;
    gameState.speed = 1 + (gameState.level - 1) * CONFIG.game.speedIncrement;
    gameState.speed = Math.min(gameState.speed, 3.0);
}

// 🎮 Game Control Functions (ALL FUNCTIONAL!)
let countedThisRun = false;

function startGame() {
    // reset flag for new run
    countedThisRun = false;

    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (gameState.isGameOver || !gameState.isRunning) {
        resetGame();
    }

    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.isGameOver = false;

    hideOverlay();
    updateUI();
    saveGameData();

    if (gameState.soundEnabled) {
        startBackgroundMusic();
    }

    if (!window.gameLoopRunning) {
        gameLoop();
    }
}


function togglePause() {
    if (!gameState.isRunning) return;

    gameState.isPaused = !gameState.isPaused;
    updateUI();

    if (gameState.isPaused) {
        showOverlay('paused', '⏸️ Game Paused', 'Press Space or click Resume to continue', [
            { text: '▶️ Resume', action: 'togglePause()' },
            { text: '🏠 Main Menu', action: 'showStartScreen()' }
        ]);
    } else {
        hideOverlay();
    }
}

function restartGame() {
    gameState.isGameOver = false;
    gameState.isPaused = false;
    resetGame();
    startGame();
}

function resetGame() {
    character.x = CONFIG.character.x;
    character.y = CONFIG.physics.groundY - character.height;
    character.velocityY = 0;
    character.isJumping = false;
    character.jumpCount = 0;
    character.rotation = 0;
    character.bounceOffset = 0;

    obstacles.length = 0;
    powerUps.length = 0;
    particles.length = 0;

    gameState.score = 0;
    gameState.level = 1;
    gameState.speed = 1.0;
    gameState.frameCount = 0;
    obstacleSpawnTimer = 0;
    backgroundOffset = 0;

    updateUI();
}

function endGame() {
    gameState.isRunning = false;
    gameState.isGameOver = true;

    // ✅ Count a finished run here (once per run)
    if (!countedThisRun) {
        countedThisRun = true;
        gameStats.totalGames++;
        saveGameData();
    }

    // Stop music, check highscore, etc. (your existing code)
    stopBackgroundMusic();
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('jumpingGameHighScore', gameState.highScore);
        for (let i = 0; i < 50; i++) {
            particles.push(createParticle(canvas.width / 2, canvas.height / 2, '#FFD700', 'star'));
        }
    }

    checkAchievements();
    updateUI();

    showOverlay(
        'gameOver',
        '💥 Game Over!',
        `Final Score: ${gameState.score}${gameState.score === gameState.highScore ? ' 🏆 NEW RECORD!' : ''}`,
        [
            { text: '🔄 Play Again', action: 'restartGame()' },
            { text: '🎯 How to Play', action: 'showInstructions()' },
            { text: '🏠 Main Menu', action: 'showStartScreen()' }
        ]
    );
}

checkAchievements();
saveGameData();
updateUI();

showOverlay('gameOver', '💥 Game Over!', `Final Score: ${gameState.score}${gameState.score === gameState.highScore ? ' 🏆 NEW RECORD!' : ''}`, [
    { text: '🔄 Play Again', action: 'restartGame()' },
    { text: '🎯 How to Play', action: 'showInstructions()' },
    { text: '🏠 Main Menu', action: 'showStartScreen()' }
]);

// 🏆 Achievement System
function checkAchievements() {
    const achievements = [
        { id: 'first_jump', name: 'First Jump', desc: 'Make your first jump', icon: '🦘', condition: () => gameStats.totalJumps >= 1 },
        { id: 'century', name: 'Century', desc: 'Reach 100 points', icon: '⭐', condition: () => gameState.score >= 100 },
        { id: 'speed_demon', name: 'Speed Demon', desc: 'Reach level 5', icon: '🔥', condition: () => gameState.level >= 5 },
        { id: 'perfect_run', name: 'Perfect Run', desc: 'Score 500 without power-ups', icon: '💎', condition: () => gameState.score >= 500 },
        { id: 'jumper', name: 'Super Jumper', desc: 'Make 100 jumps total', icon: '📈', condition: () => gameStats.totalJumps >= 100 },
        { id: 'veteran', name: 'Game Veteran', desc: 'Play 25 games', icon: '🏆', condition: () => gameStats.totalGames >= 25 }
    ];

    achievements.forEach(a => {
        if (!gameStats.achievements.has(a.id) && a.condition()) {
            unlockAchievement(a);
        }
    });
}


function unlockAchievement(achievement) {
    gameStats.achievements.add(achievement.id);

    // Play achievement sound
    playSound('achievement');

    // Achievement notification particles
    for (let i = 0; i < 25; i++) {
        particles.push(createParticle(
            canvas.width - 100,
            50,
            '#FFD700',
            'star'
        ));
    }

    // Show achievement notification
    showAchievementNotification(achievement);

    saveGameData();
    updateAchievementsDisplay();
}

function showAchievementNotification(achievement) {
    const icon = achievement.icon || '🏅'; // ✅ fallback
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        font-weight: 700;
        font-size: 0.9rem;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;

    notification.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.75rem;">
      <div style="font-size:1.5rem;">${icon}</div>
      <div>
        <div style="font-weight:700;">🏆 Achievement Unlocked!</div>
        <div style="font-size:0.85rem; opacity:0.9;">${achievement.name}</div>
      </div>
    </div>
  `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}

// 🎨 Functional Theme Management
function setTheme(themeName) {
    if (!themes[themeName]) {
        console.warn(`Theme ${themeName} not found, defaulting to forest`);
        themeName = 'forest';
    }

    gameState.theme = themeName;
    localStorage.setItem('jumpingGameTheme', themeName);

    // Update theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-theme="${themeName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    updateThemeDisplay();

    // Update canvas background based on theme
    updateCanvasTheme();
}

function updateThemeDisplay() {
    const theme = themes[gameState.theme];
    const container = document.querySelector('.game-container');
    if (container) {
        container.style.background = theme.background.primary;
    }

    // Update any theme-specific UI elements
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        if (gameState.theme === 'space') {
            canvas.style.background = 'linear-gradient(to bottom, #000000 0%, #1a1a2e 100%)';
        } else if (gameState.theme === 'ocean') {
            canvas.style.background = 'linear-gradient(to bottom, #87CEEB 0%, #4682B4 100%)';
        } else {
            canvas.style.background = 'linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%)';
        }
    }
}

function updateCanvasTheme() {
    // This will be used in the game loop to draw the themed background
    const theme = themes[gameState.theme];
    // Theme updated successfully
}

// 🎵 Real Audio System with Web Audio API (Enhanced Error Handling)
let audioContext;
try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (error) {
    console.warn('Audio not supported:', error);
    audioContext = null;
}
let backgroundMusic = null;
let soundEffects = {};
let musicPlaying = false;  // ✅ new flag

// Create sound effects using oscillators
function createTone(frequency, duration, type = 'sine') {
    return new Promise((resolve) => {
        if (!gameState.soundEnabled || !audioContext) {
            resolve();
            return;
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);

        setTimeout(resolve, duration * 1000);
    });
}

// Background music using oscillators
async function startBackgroundMusic() {
    if (!gameState.soundEnabled || musicPlaying) return; // already running
    musicPlaying = true;

    const playMelody = async () => {
        const notes = [
            { freq: 261.63, duration: 0.5 }, // C4
            { freq: 293.66, duration: 0.5 }, // D4
            { freq: 329.63, duration: 0.5 }, // E4
            { freq: 349.23, duration: 0.5 }, // F4
            { freq: 392.00, duration: 0.5 }, // G4
            { freq: 440.00, duration: 0.5 }, // A4
            { freq: 493.88, duration: 0.5 }, // B4
            { freq: 523.25, duration: 1.0 }  // C5
        ];

        for (const note of notes) {
            if (!musicPlaying || !gameState.isRunning) return; // stop if flagged
            await createTone(note.freq, note.duration, 'triangle');
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // loop only if still allowed
        if (musicPlaying && gameState.isRunning) {
            setTimeout(playMelody, 2000);
        }
    };

    backgroundMusic = playMelody();
}

function stopBackgroundMusic() {
    musicPlaying = false;  // flag stops loop
    backgroundMusic = null;
}


function stopBackgroundMusic() {
    backgroundMusic = null;
}

// Enhanced sound effects with visual feedback
async function playSound(type) {
    if (!gameState.soundEnabled) return;

    // Create visual feedback
    const canvas = document.getElementById('gameCanvas');

    switch (type) {
        case 'jump':
            // Play jump sound (quick upward tone)
            createTone(440, 0.1, 'square');

            // Visual effect
            if (canvas) {
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        canvas.style.filter = 'brightness(1.2)';
                        setTimeout(() => {
                            canvas.style.filter = 'brightness(1)';
                        }, 50);
                    }, i * 50);
                }
            }
            break;

        case 'collect':
            // Play collect sound (ascending chime)
            createTone(523.25, 0.1, 'sine');
            setTimeout(() => createTone(659.25, 0.1, 'sine'), 100);
            setTimeout(() => createTone(783.99, 0.2, 'sine'), 200);

            // Visual effect
            if (canvas) {
                canvas.style.filter = 'hue-rotate(45deg) brightness(1.3)';
                setTimeout(() => {
                    canvas.style.filter = 'brightness(1)';
                }, 150);
            }
            break;

        case 'collision':
            // Play collision sound (harsh low tone)
            createTone(130.81, 0.3, 'sawtooth');

            // Visual effect
            if (canvas) {
                canvas.style.filter = 'hue-rotate(0deg) brightness(1.5) saturate(2)';
                setTimeout(() => {
                    canvas.style.filter = 'brightness(1)';
                }, 200);
            }
            break;

        case 'achievement':
            // Play achievement sound (victory fanfare)
            const fanfare = [
                { freq: 261.63, duration: 0.2 },
                { freq: 329.63, duration: 0.2 },
                { freq: 392.00, duration: 0.2 },
                { freq: 523.25, duration: 0.4 }
            ];

            for (let i = 0; i < fanfare.length; i++) {
                setTimeout(() => {
                    createTone(fanfare[i].freq, fanfare[i].duration, 'triangle');
                }, i * 150);
            }
            break;
    }
}

function toggleMute() {
    gameState.soundEnabled = !gameState.soundEnabled;
    localStorage.setItem('jumpingGameSound', gameState.soundEnabled);

    const btn = document.getElementById('muteBtn');
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = gameState.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
        btn.title = gameState.soundEnabled ? 'Mute Sound' : 'Unmute Sound';
    }

    // Play a test sound effect
    playSound('jump');

    // Show feedback notification
    showNotification(gameState.soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 2 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 2000);
}

// 📱 Fullscreen Management
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            // Fullscreen not supported or blocked
        });
    } else {
        document.exitFullscreen();
    }
}

// 🎮 UI Management
function updateUI() {
    const elements = {
        currentScore: document.getElementById('currentScore'),
        highScore: document.getElementById('highScore'),
        gameLevel: document.getElementById('gameLevel'),
        speedDisplay: document.getElementById('speedDisplay')
    };

    if (elements.currentScore) elements.currentScore.textContent = gameState.score;
    if (elements.highScore) elements.highScore.textContent = gameState.highScore;
    if (elements.gameLevel) elements.gameLevel.textContent = gameState.level;
    if (elements.speedDisplay) elements.speedDisplay.textContent = gameState.speed.toFixed(1) + 'x';

    // Update pause button
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        const icon = pauseBtn.querySelector('i');
        if (icon) {
            icon.className = gameState.isPaused ? 'fas fa-play' : 'fas fa-pause';
        }
        pauseBtn.title = gameState.isPaused ? 'Resume Game' : 'Pause Game';
    }

    updateStatisticsDisplay();
}

function updateStatisticsDisplay() {
    const getOne = (preferred, fallback) =>
        document.getElementById(preferred) || document.getElementById(fallback);

    const els = {
        totalJumps: document.getElementById('totalJumps'),
        totalObstacles: getOne('totalObstacles', 'obstaclesCleared'),
        totalGames: getOne('totalGames', 'gamesPlayed'),
        averageScore: document.getElementById('averageScore')
    };

    if (els.totalJumps) els.totalJumps.textContent = gameStats.totalJumps;
    if (els.totalObstacles) els.totalObstacles.textContent = gameStats.totalObstacles;
    if (els.totalGames) els.totalGames.textContent = gameStats.totalGames;

    if (els.averageScore) {
        // if you want average *score*, compute from score; if you want avg obstacles/run, keep as below
        const avg = gameStats.totalGames > 0
            ? Math.round(gameStats.totalObstacles / gameStats.totalGames)
            : 0;
        els.averageScore.textContent = avg;
    }
}


function updateAchievementsDisplay() {
    // Find achievements container in the sidebar
    const achievementsContainer = document.querySelector('.achievements');
    if (!achievementsContainer) {
        return; // Achievement container not ready yet
    }

    const achievements = [
        { id: 'first_jump', name: 'First Jump', desc: 'Make your first jump', icon: '🦘' },
        { id: 'century', name: 'Century', desc: 'Reach 100 points', icon: '⭐' },
        { id: 'speed_demon', name: 'Speed Demon', desc: 'Reach level 5', icon: '👑' },
        { id: 'perfect_run', name: 'Perfect Run', desc: 'Score 500 without power-ups', icon: '💎' },
        { id: 'jumper', name: 'Super Jumper', desc: 'Make 100 jumps total', icon: '📈' },
        { id: 'veteran', name: 'Game Veteran', desc: 'Play 25 games', icon: '🏆' }
    ];

    achievementsContainer.innerHTML = achievements.map(achievement => {
        const unlocked = gameStats.achievements.has(achievement.id);
        return `
            <div class="achievement ${unlocked ? 'unlocked' : 'locked'}" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 8px; background: ${unlocked ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 'rgba(52, 152, 219, 0.1)'}; margin-bottom: 0.5rem;">
                <div style="font-size: 1.5rem;">${achievement.icon}</div>
                <div class="achievement-info" style="flex: 1; color: ${unlocked ? 'white' : '#2c3e50'};">
                    <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700;">${achievement.name}</h4>
                    <p style="margin: 0; font-size: 0.8rem; opacity: ${unlocked ? '0.9' : '0.7'};">${achievement.desc}</p>
                </div>
                <div style="font-size: 1.2rem;">
                    ${unlocked ? '✅' : '🔒'}
                </div>
            </div>
        `;
    }).join('');
}

// 🎭 Overlay Management
function showOverlay(type, title, message, buttons = []) {
    const overlay = document.getElementById('gameOverlay');
    if (!overlay) return;

    const overlayContent = overlay.querySelector('.overlay-content');
    if (!overlayContent) return;

    overlayContent.innerHTML = `
        <div class="overlay-icon">${type === 'gameOver' ? '💥' : type === 'paused' ? '⏸️' : '🎮'}</div>
        <h2>${title}</h2>
        <p>${message}</p>
        <div class="overlay-buttons">
            ${buttons.map(btn => `<button class="btn btn-primary" onclick="${btn.action}">${btn.text}</button>`).join('')}
        </div>
    `;

    overlay.style.display = 'flex';
}

function hideOverlay() {
    const overlay = document.getElementById('gameOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function showStartScreen() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    gameState.isGameOver = true;

    const overlay = document.getElementById('gameOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.innerHTML = `
            <div class="overlay-content">
                <div class="overlay-icon">🎮</div>
                <h2>🚀 Ultimate Jumping Adventure</h2>
                <p>Welcome to the most fun jumping game! Press SPACE or click to start!</p>
                <div class="overlay-buttons">
                    <button class="btn btn-primary" onclick="startGame()">🚀 Start Game</button>
                    <button class="btn btn-secondary" onclick="showInstructions()">📖 How to Play</button>
                </div>
            </div>
        `;
    }
}

function showInstructions() {
    const overlay = document.getElementById('gameOverlay');
    if (!overlay) {
        return; // Overlay not ready
    }

    overlay.innerHTML = `
        <div class="overlay-content">
            <div class="overlay-icon">📖</div>
            <h2 style="color: #2c3e50; text-align: center; margin-bottom: 1.5rem;">Game Instructions</h2>
            
            <div style="text-align: left; margin-bottom: 1rem; flex: 1; overflow-y: auto;">
                <h3 style="color: #2c3e50; margin-bottom: 1rem;">🎮 How to Play</h3>
                
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem; background: rgba(52, 152, 219, 0.1); border-radius: 6px;">
                        <div style="font-size: 1.2rem;">🦘</div>
                        <div style="color: #2c3e50; font-weight: 600; font-size: 0.9rem;">
                            <strong>Jump</strong> - Press SPACE, UP arrow, or tap screen
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem; background: rgba(52, 152, 219, 0.1); border-radius: 6px;">
                        <div style="font-size: 1.2rem;">🏃</div>
                        <div style="color: #2c3e50; font-weight: 600; font-size: 0.9rem;">
                            <strong>Double Jump</strong> - Jump again in air for extra height
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem; background: rgba(52, 152, 219, 0.1); border-radius: 6px;">
                        <div style="font-size: 1.2rem;">🚧</div>
                        <div style="color: #2c3e50; font-weight: 600; font-size: 0.9rem;">
                            <strong>Avoid Obstacles</strong> - Jump over to keep going
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem; background: rgba(52, 152, 219, 0.1); border-radius: 6px;">
                        <div style="font-size: 1.2rem;">⭐</div>
                        <div style="color: #2c3e50; font-weight: 600; font-size: 0.9rem;">
                            <strong>Collect Power-ups</strong> - Golden items give extra points
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem; background: rgba(52, 152, 219, 0.1); border-radius: 6px;">
                        <div style="font-size: 1.2rem;">🎨</div>
                        <div style="color: #2c3e50; font-weight: 600; font-size: 0.9rem;">
                            <strong>Change Themes</strong> - Try Forest, Ocean, Space
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem; background: rgba(52, 152, 219, 0.1); border-radius: 6px;">
                        <div style="font-size: 1.2rem;">🏆</div>
                        <div style="color: #2c3e50; font-weight: 600; font-size: 0.9rem;">
                            <strong>Unlock Achievements</strong> - Complete challenges for rewards
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="overlay-buttons" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;">
                <button class="btn btn-primary" onclick="startGame()" style="background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%); color: white; font-weight: 700; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer;">🚀 Got it! Let's Play</button>
                <button class="btn btn-secondary" onclick="showStartScreen()" style="background: linear-gradient(135deg, #6bcf7f 0%, #4facfe 100%); color: white; font-weight: 700; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer;">🏠 Back to Menu</button>
            </div>
        </div>
    `;

    overlay.style.display = 'flex';
}

// 💾 Save/Load System
function saveGameData() {
    localStorage.setItem('jumpingGameHighScore', gameState.highScore);
    localStorage.setItem('jumpingGameTheme', gameState.theme);
    localStorage.setItem('jumpingGameSound', gameState.soundEnabled);
    localStorage.setItem('totalJumps', gameStats.totalJumps);
    localStorage.setItem('totalObstacles', gameStats.totalObstacles);
    localStorage.setItem('totalGames', gameStats.totalGames);
    localStorage.setItem('achievements', JSON.stringify([...gameStats.achievements]));
}

function loadGameData() {
    gameState.highScore = parseInt(localStorage.getItem('jumpingGameHighScore')) || 0;
    gameState.theme = localStorage.getItem('jumpingGameTheme') || 'forest';
    gameState.soundEnabled = localStorage.getItem('jumpingGameSound') !== 'false';

    gameStats.totalJumps = parseInt(localStorage.getItem('totalJumps')) || 0;
    gameStats.totalObstacles = parseInt(localStorage.getItem('totalObstacles')) || 0;
    gameStats.totalGames = parseInt(localStorage.getItem('totalGames')) || 0;
    gameStats.achievements = new Set(JSON.parse(localStorage.getItem('achievements') || '[]'));
}

// 🎮 Optimized Game Loop
function gameLoop() {
    if (window.gameLoopRunning) return; // Prevent multiple loops
    window.gameLoopRunning = true;
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    function animate(currentTime) {
        try {
            const deltaTime = currentTime - lastTime;

            if (deltaTime >= frameInterval) {
                if (gameState.isRunning && !gameState.isPaused && !gameState.isGameOver) {
                    gameState.frameCount++;
                    backgroundOffset += gameState.speed;

                    // Spawn obstacles (less frequently to reduce lag)
                    obstacleSpawnTimer++;
                    if (obstacleSpawnTimer >= CONFIG.game.obstacleSpawnRate / gameState.speed) {
                        spawnObstacle();
                        obstacleSpawnTimer = 0;
                    }

                    // Spawn power-ups less frequently
                    if (gameState.frameCount % 180 === 0) { // Every 3 seconds at 60fps
                        spawnPowerUp();
                    }

                    // Update game objects
                    updateCharacter();
                    updateObstacles();
                    updatePowerUps();
                    updateGameDifficulty();

                    // Update particles less frequently
                    if (gameState.frameCount % 2 === 0) {
                        updateParticles();
                    }
                }

                // Draw everything
                drawBackground();
                drawObstacles();
                drawPowerUps();
                drawCharacter();

                // Draw particles less frequently
                if (gameState.frameCount % 2 === 0) {
                    drawParticles();
                }

                lastTime = currentTime;
            }

            requestAnimationFrame(animate);
        } catch (error) {
            console.error('Game loop error:', error);
            window.gameLoopRunning = false;
        }
    }

    animate(0);
}

// 🎮 Event Listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            if (gameState.isRunning && !gameState.isPaused && !gameState.isGameOver) {
                jump();
            } else if (gameState.isPaused) {
                togglePause();
            } else if (!gameState.isRunning) {
                startGame();
            }
        }

        if (e.code === 'KeyP') {
            e.preventDefault();
            if (gameState.isRunning) {
                togglePause();
                showNotification(gameState.isPaused ? '⏸️ Game Paused' : '▶️ Game Resumed');
            }
        }

        if (e.code === 'KeyR') {
            e.preventDefault();
            restartGame();
            showNotification('🔄 Game Restarted');
        }

        if (e.code === 'KeyM') {
            e.preventDefault();
            toggleMute();
        }

        if (e.code === 'KeyF') {
            e.preventDefault();
            toggleFullscreen();
            showNotification('🖥️ Fullscreen Toggled');
        }

        if (e.code === 'Escape') {
            e.preventDefault();
            if (gameState.isRunning && !gameState.isPaused) {
                togglePause();
                showNotification('⏸️ Game Paused');
            } else {
                showStartScreen();
                showNotification('🏠 Back to Menu');
            }
        }
    });

    // Touch/Click controls
    canvas.addEventListener('click', () => {
        if (gameState.isRunning && !gameState.isPaused && !gameState.isGameOver) {
            jump();
        } else if (!gameState.isRunning || gameState.isGameOver) {
            startGame();
        }
    });

    // Mobile touch prevention of scrolling
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameState.isRunning && !gameState.isPaused && !gameState.isGameOver) {
            jump();
        } else if (!gameState.isRunning || gameState.isGameOver) {
            startGame();
        }
    });

    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setTheme(btn.dataset.theme);
        });
    });
}

// 🚀 Game Initialization
function initGame() {
    try {
        loadGameData();
        updateUI();
        updateAchievementsDisplay();
        updateThemeDisplay();
        setTheme(gameState.theme);

        // Set initial button states
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            const icon = muteBtn.querySelector('i');
            if (icon) {
                icon.className = gameState.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
            muteBtn.title = gameState.soundEnabled ? 'Mute Sound' : 'Unmute Sound';
        }

        setupEventListeners();

        // Show start screen
        setTimeout(() => {
            showStartScreen();
        }, 300);

        // Start the game loop
        gameLoop();

    } catch (error) {
        console.error("Error initializing game:", error);
    }
}

// 🎮 Start the game when page loads
document.addEventListener('DOMContentLoaded', initGame);
