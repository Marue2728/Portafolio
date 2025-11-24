// ========== SPACE INVADERS - CÓDIGO DEL JUEGO ==========

/* ---------- CONFIGURACIÓN (resolución interna fija) ---------- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resolución interna fija para evitar desalineos
const INTERNAL_WIDTH = 800;
const INTERNAL_HEIGHT = 600;

// Forzamos la resolución interna y luego escalamos con CSS
canvas.width = INTERNAL_WIDTH;
canvas.height = INTERNAL_HEIGHT;

// Elementos UI del juego
const gameStartScreen = document.getElementById('gameStartScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const finalScoreElement = document.getElementById('finalScore');
const highScoreElement = document.getElementById('highScoreValue');
const gameOverMessage = document.getElementById('gameOverMessage');

// Botones del juego
document.getElementById('startGameBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resetBtn').addEventListener('click', resetGame);

// Controles móviles
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const shootBtn = document.getElementById('shootBtn');

/* ---------- ESTADO DEL JUEGO ---------- */
let game = {
    running: false,
    paused: false,
    score: 0,
    lives: 3,
    level: 1,
    highScore: parseInt(localStorage.getItem('spaceInvadersHighScore')) || 0
};

// Jugador (posiciones calculadas en la resolución interna)
const player = {
    x: INTERNAL_WIDTH / 2 - 25,
    y: INTERNAL_HEIGHT - 50,
    width: 50,
    height: 30,
    speed: 7,
    color: '#00ff00'
};

let bullets = [];
let enemyBullets = [];
let enemies = [];
const enemyRows = 5;
const enemyCols = 10;
const enemyWidth = 40;
const enemyHeight = 30;
let enemySpeed = 1;
let enemyDirection = 1;

const keys = {};
let touchControls = { left:false, right:false };

/* ---------- ESCALADO VISUAL (NO CAMBIAR resolución interna) ---------- */
function resizeCanvasVisual() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    // calc scale to fit width, but respect viewport height
    let scale = containerWidth / INTERNAL_WIDTH;
    let maxHeightScale = (window.innerHeight * 0.6) / INTERNAL_HEIGHT;
    scale = Math.min(scale, maxHeightScale);
    // don't allow scale to be 0 or negative
    if (!isFinite(scale) || scale <= 0) scale = 1;
    canvas.style.width = (INTERNAL_WIDTH * scale) + 'px';
    canvas.style.height = (INTERNAL_HEIGHT * scale) + 'px';
}

window.addEventListener('resize', resizeCanvasVisual);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvasVisual, 100));

/* ---------- DIBUJADO ---------- */
function drawGameBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,INTERNAL_WIDTH,INTERNAL_HEIGHT);
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width/2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(player.x + player.width/4, player.y + player.height, player.width/2, 5);
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width/3, enemy.y + enemy.height/3, 3, 0, Math.PI*2);
        ctx.arc(enemy.x + enemy.width*2/3, enemy.y + enemy.height/3, 3, 0, Math.PI*2);
        ctx.fill();
    });
}

function drawBullets() {
    ctx.fillStyle = '#00ffff';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
    ctx.fillStyle = '#ff4444';
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
}

/* ---------- LÓGICA ---------- */
function initEnemies() {
    enemies = [];
    const startX = 30;
    const startY = 50;
    const gapX = enemyWidth + 10;
    const gapY = enemyHeight + 10;
    for (let row=0; row<enemyRows; row++){
        for (let col=0; col<enemyCols; col++){
            enemies.push({
                x: col * gapX + startX,
                y: row * gapY + startY,
                width: enemyWidth,
                height: enemyHeight,
                color: row === 0 ? '#ff4444' :
                       row === 1 ? '#ffaa00' :
                       row === 2 ? '#ffff00' :
                       row === 3 ? '#00ff00' : '#00aaff',
                alive: true
            });
        }
    }
}

function updatePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < INTERNAL_WIDTH - player.width) player.x += player.speed;
    if (touchControls.left && player.x > 0) player.x -= player.speed;
    if (touchControls.right && player.x < INTERNAL_WIDTH - player.width) player.x += player.speed;
}

function updateEnemies() {
    let edgeReached = false;
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        enemy.x += enemySpeed * enemyDirection;
        if (enemy.x <= 0 || enemy.x + enemy.width >= INTERNAL_WIDTH) edgeReached = true;
    });

    if (edgeReached) {
        enemyDirection *= -1;
        enemies.forEach(enemy => { if (enemy.alive) enemy.y += 20; });
    }

    // Verificar si cualquier enemigo vivo llega al área del jugador
    enemies.forEach(enemy => {
        if (enemy.alive && (enemy.y + enemy.height) >= (player.y)) {
            gameOver('¡Los invasores han llegado a la Tierra!');
        }
    });

    // Disparo aleatorio de enemigos
    if (Math.random() < 0.02 && game.running && !game.paused) {
        const aliveEnemies = enemies.filter(e => e.alive);
        if (aliveEnemies.length > 0) {
            const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
            enemyBullets.push({
                x: shooter.x + shooter.width/2 - 2,
                y: shooter.y + shooter.height,
                width: 4,
                height: 10,
                speed: 5
            });
        }
    }
}

function updateBullets() {
    // Balas jugador
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y + bullets[i].height < 0) { bullets.splice(i,1); continue; }

        for (let j = 0; j < enemies.length; j++) {
            const e = enemies[j];
            if (e.alive &&
                bullets[i].x < e.x + e.width &&
                bullets[i].x + bullets[i].width > e.x &&
                bullets[i].y < e.y + e.height &&
                bullets[i].y + bullets[i].height > e.y) {

                e.alive = false;
                bullets.splice(i,1);
                game.score += 10 * game.level;
                updateScore();
                break;
            }
        }
    }

    // Balas enemigas
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        if (enemyBullets[i].y > INTERNAL_HEIGHT) { enemyBullets.splice(i,1); continue; }

        if (enemyBullets[i].x < player.x + player.width &&
            enemyBullets[i].x + enemyBullets[i].width > player.x &&
            enemyBullets[i].y < player.y + player.height &&
            enemyBullets[i].y + enemyBullets[i].height > player.y) {

            enemyBullets.splice(i,1);
            game.lives--;
            updateLives();
            if (game.lives <= 0) gameOver('¡Te han destruido!');
            break;
        }
    }
}

function checkLevelComplete() {
    const alive = enemies.filter(e => e.alive).length;
    if (alive === 0 && game.running) {
        game.level++;
        levelElement.textContent = game.level;
        enemySpeed += 0.5;
        initEnemies();
    }
}

function updateScore() { scoreElement.textContent = game.score; }
function updateLives() { livesElement.textContent = game.lives; }

function shoot() {
    if (game.running && !game.paused) {
        bullets.push({
            x: player.x + player.width/2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: 10
        });
    }
}

/* ---------- BUCLE PRINCIPAL ---------- */
let rafId = null;
function gameLoop() {
    if (!game.running || game.paused) return;

    drawGameBackground();
    updatePlayer();
    updateEnemies();
    updateBullets();
    checkLevelComplete();

    drawEnemies();
    drawBullets();
    drawPlayer();

    rafId = requestAnimationFrame(gameLoop);
}

/* ---------- INICIO/PARA/REINICIO ---------- */
function startGame() {
    // esconder pantallas
    gameStartScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';

    // reset básico
    game.running = true;
    game.paused = false;
    game.score = 0;
    game.lives = 3;
    game.level = 1;

    // reajustar jugador y arrays
    player.x = INTERNAL_WIDTH / 2 - player.width / 2;
    player.y = INTERNAL_HEIGHT - 50;
    bullets = [];
    enemyBullets = [];
    enemySpeed = 1;
    enemyDirection = 1;

    // UI
    updateScore();
    updateLives();
    levelElement.textContent = game.level;
    highScoreElement.textContent = game.highScore;

    // inicializar enemigos y recalcular escala visual
    initEnemies();
    resizeCanvasVisual();

    // iniciar bucle
    if (rafId) cancelAnimationFrame(rafId);
    gameLoop();
}

function togglePause() {
    if (!game.running) return;
    game.paused = !game.paused;
    document.getElementById('pauseBtn').textContent = game.paused ? 'REANUDAR' : 'PAUSAR';
    if (!game.paused) gameLoop();
}

function resetGame() {
    game.running = false;
    if (rafId) cancelAnimationFrame(rafId);
    startGame();
}

function gameOver(message) {
    if (!game.running) return;
    game.running = false;
    if (rafId) cancelAnimationFrame(rafId);

    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('spaceInvadersHighScore', game.highScore);
        highScoreElement.textContent = game.highScore;
    }

    finalScoreElement.textContent = game.score;
    gameOverMessage.textContent = message;
    gameOverScreen.style.display = 'block';
}

/* ---------- EVENTOS (teclado, toque, mouse) ---------- */
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if ((e.key === ' ' || e.key === 'Spacebar') && game.running && !game.paused) {
        shoot();
        e.preventDefault();
    }
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
        e.preventDefault();
    }
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Controles táctiles
leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); touchControls.left = true; });
leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); touchControls.left = false; });
rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); touchControls.right = true; });
rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); touchControls.right = false; });
shootBtn.addEventListener('touchstart', (e) => { e.preventDefault(); shoot(); });

// Clics para mouse
leftBtn.addEventListener('mousedown', () => touchControls.left = true);
leftBtn.addEventListener('mouseup', () => touchControls.left = false);
leftBtn.addEventListener('mouseleave', () => touchControls.left = false);

rightBtn.addEventListener('mousedown', () => touchControls.right = true);
rightBtn.addEventListener('mouseup', () => touchControls.right = false);
rightBtn.addEventListener('mouseleave', () => touchControls.right = false);

shootBtn.addEventListener('mousedown', shoot);

// Control pointer (mover nave con dedo/mouse sobre el canvas)
canvas.addEventListener('pointermove', (e) => {
    // Convertir coordenadas del evento a coordenadas internas (respetando la escala visual)
    const rect = canvas.getBoundingClientRect();
    const scaleX = INTERNAL_WIDTH / rect.width;
    const scaleY = INTERNAL_HEIGHT / rect.height;
    const xInternal = (e.clientX - rect.left) * scaleX;
    // Solo mover en X para evitar sobrescribir Y del jugador
    player.x = xInternal - player.width/2;
    if (player.x < 0) player.x = 0;
    if (player.x > INTERNAL_WIDTH - player.width) player.x = INTERNAL_WIDTH - player.width;
});

// Prevenir scroll en botones
document.addEventListener('touchmove', (e) => {
    if (e.target.classList.contains('mobile-btn')) e.preventDefault();
}, { passive:false });

/* ---------- INICIALIZACIÓN AL CARGAR ---------- */
window.addEventListener('load', () => {
    resizeCanvasVisual();
    highScoreElement.textContent = game.highScore;
    gameStartScreen.style.display = 'block';
    gameOverScreen.style.display = 'none';
});

window.addEventListener('DOMContentLoaded', () => {
    game.running = false;
    game.paused = false;
});