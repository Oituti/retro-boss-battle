// 🔗 Step 1 でコピーした GAS の URL をここに貼り付けてください
const GAS_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbxD22_-B9ckVUN7adpXQF46ZNRORoMQ7zkp-mOARoRSood9RReKvBqtfe3mIaObHFNjFA/exec';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GROUND_Y = 500;

const GAME_STATE = {
    TITLE: 'title',
    PLAYING: 'playing',
    CLEAR: 'clear',
    GAMEOVER: 'gameover'
};
let gameState = GAME_STATE.TITLE;

let startTime = 0;
let clearTime = 0;

let phaseMessageTimer = 0;
let megalovaniaNoticeTimer = 0;
let itemSpawnTimer = 0;

let leaderboardData = []; // TOP 5 スコア配列

const keys = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    shoot: false
};

let bullets = [];
let bossBullets = [];
let particles = [];
let items = [];

// DOM要素
const overlay = document.getElementById('rankingInputOverlay');
const finalTimeDisplay = document.getElementById('finalTimeDisplay');
const nameInput = document.getElementById('playerNameInput');
const submitBtn = document.getElementById('submitScoreBtn');

// ランキング取得関数
function fetchLeaderboard() {
    if (!GAS_ENDPOINT_URL || GAS_ENDPOINT_URL === 'YOUR_GAS_WEB_APP_URL_HERE') return;
    fetch(GAS_ENDPOINT_URL)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                leaderboardData = data;
            }
        })
        .catch(() => {});
}

// スコア送信処理
submitBtn.addEventListener('click', () => {
    const name = nameInput.value.trim() || 'HERO';
    submitBtn.disabled = true;
    submitBtn.innerText = '送信中...';

    fetch(GAS_ENDPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ name: name, time: clearTime })
    })
        .then(res => res.json())
        .then(data => {
            overlay.classList.add('hidden');
            submitBtn.disabled = false;
            submitBtn.innerText = 'ランキングに登録';
            fetchLeaderboard(); // 最新のランキングを再取得
        })
        .catch(() => {
            overlay.classList.add('hidden');
            submitBtn.disabled = false;
            submitBtn.innerText = 'ランキングに登録';
        });
});

// 初回ランキング読み込み
fetchLeaderboard();

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 6 + 3,
            color: color,
            life: 30
        });
    }
}

function spawnHealPotion(x, y) {
    items.push({
        x: x || Math.random() * 400 + 100,
        y: y || 0,
        width: 20,
        height: 24,
        vy: 2
    });
}

function initGame() {
    overlay.classList.add('hidden');
    Sound.init();
    player.init(GROUND_Y);
    boss.init();
    bullets = [];
    bossBullets = [];
    particles = [];
    items = [];
    phaseMessageTimer = 0;
    itemSpawnTimer = 0;

    Sound.startBGM();

    if (Sound.isMegalovania) {
        megalovaniaNoticeTimer = 90;
    } else {
        megalovaniaNoticeTimer = 0;
    }

    startTime = Date.now();
    gameState = GAME_STATE.PLAYING;
}

window.addEventListener('keydown', (e) => {
    // オーバーレイ入力中はゲーム操作を無効化
    if (!overlay.classList.contains('hidden')) return;

    Sound.init();

    const key = e.key;
    const code = e.code;

    if (key === 'a' || key === 'A' || code === 'ArrowLeft')  keys.left = true;
    if (key === 'd' || key === 'D' || code === 'ArrowRight') keys.right = true;

    if (key === ' ' || key === 'Spacebar' || code === 'Space' || code === 'ArrowUp') {
        if (!keys.jump) keys.jumpPressed = true;
        keys.jump = true;

        if (gameState === GAME_STATE.TITLE) {
            initGame();
        }
    }

    if (key === 'j' || key === 'J' || key === 'x' || key === 'X') keys.shoot = true;

    if (key === 'r' || key === 'R') {
        initGame();
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key;
    const code = e.code;

    if (key === 'a' || key === 'A' || code === 'ArrowLeft')  keys.left = false;
    if (key === 'd' || key === 'D' || code === 'ArrowRight') keys.right = false;

    if (key === ' ' || key === 'Spacebar' || code === 'Space' || code === 'ArrowUp') {
        keys.jump = false;
        keys.jumpPressed = false;
    }

    if (key === 'j' || key === 'J' || key === 'x' || key === 'X') keys.shoot = false;
});

function update() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }

    if (gameState !== GAME_STATE.PLAYING) return;

    const wasPhase2 = boss.isPhase2;

    player.update(keys, canvas.width, GROUND_Y, bullets);
    boss.update(player, bossBullets, GROUND_Y);

    if (!wasPhase2 && boss.isPhase2) {
        phaseMessageTimer = 120;
        Sound.setPhase2Bgm();
        spawnHealPotion(300, 0);
    }

    if (phaseMessageTimer > 0) phaseMessageTimer--;
    if (megalovaniaNoticeTimer > 0) megalovaniaNoticeTimer--;

    itemSpawnTimer++;
    if (itemSpawnTimer >= 7200) {
        itemSpawnTimer = 0;
        spawnHealPotion();
    }

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.vy;

        if (item.y + item.height >= GROUND_Y + player.height) {
            item.y = GROUND_Y + player.height - item.height;
        }

        if (checkCollision(item, player)) {
            if (player.heal(1)) {
                createExplosion(item.x + 10, item.y + 12, '#00ff66', 20);
                items.splice(i, 1);
            }
        }
    }

    const bossCoreRect = boss.getCoreRect();
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;

        if (checkCollision(b, boss)) {
            if (boss.coreOpen && checkCollision(b, bossCoreRect)) {
                boss.hp -= 1;
                boss.flashTimer = 5;
                createExplosion(b.x, b.y, '#ffcc00', 5);
                Sound.playCoreHit();

                if (Math.random() < 0.015) {
                    spawnHealPotion(boss.x - 20, boss.y + 80);
                }

                if (boss.hp <= 0) {
                    boss.hp = 0;
                    clearTime = ((Date.now() - startTime) / 1000).toFixed(2);
                    gameState = GAME_STATE.CLEAR;
                    Sound.stopBGM();
                    Sound.playExplosion();
                    createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, '#ff3300', 100);

                    // クリア時名前入力オーバーレイを表示
                    finalTimeDisplay.innerText = clearTime;
                    nameInput.value = '';
                    overlay.classList.remove('hidden');
                }
            }
            bullets.splice(i, 1);
            continue;
        }

        if (b.x < 0 || b.x > canvas.width) {
            bullets.splice(i, 1);
        }
    }

    for (let i = bossBullets.length - 1; i >= 0; i--) {
        const bb = bossBullets[i];
        bb.x += bb.vx;
        bb.y += bb.vy;

        if (checkCollision(bb, player)) {
            if (player.damage(1)) {
                if (player.hp <= 0) {
                    gameState = GAME_STATE.GAMEOVER;
                    Sound.stopBGM();
                    Sound.playExplosion();
                    createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00ffcc', 40);
                }
            }
            bossBullets.splice(i, 1);
            continue;
        }

        if (bb.x < -50 || bb.x > canvas.width + 50 || bb.y < -50 || bb.y > canvas.height + 50) {
            bossBullets.splice(i, 1);
        }
    }

    if (checkCollision(player, boss)) {
        if (player.damage(1)) {
            if (player.hp <= 0) {
                gameState = GAME_STATE.GAMEOVER;
                Sound.stopBGM();
                Sound.playExplosion();
                createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00ffcc', 40);
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#22222a';
    ctx.fillRect(0, GROUND_Y + 48, canvas.width, canvas.height - (GROUND_Y + 48));
    ctx.fillStyle = '#444455';
    ctx.fillRect(0, GROUND_Y + 48, canvas.width, 4);

    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    if (gameState === GAME_STATE.TITLE) {
        ctx.textAlign = 'center';

        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 38px Courier New';
        ctx.fillText('LAST GUARDIAN', canvas.width / 2, 80);

        ctx.fillStyle = '#ffaa00';
        ctx.font = '14px Courier New';
        ctx.fillText('- 虚無の魔王と最後の勇者 -', canvas.width / 2, 110);

        ctx.fillStyle = '#cccccc';
        ctx.font = '12px Courier New';
        ctx.fillText('千年の封印は破られた。魔王のコアを撃ち抜き世界を救え！', canvas.width / 2, 145);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Courier New';
        ctx.fillText('>> PRESS SPACE TO START <<', canvas.width / 2, 185);

        // 🏆 オンラインランキング TOP 5 表示
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px Courier New';
        ctx.fillText('=== ONLINE LEADERBOARD (TOP 5) ===', canvas.width / 2, 230);

        if (leaderboardData.length === 0) {
            ctx.fillStyle = '#8888aa';
            ctx.font = '13px Courier New';
            ctx.fillText('Loading rankings...', canvas.width / 2, 265);
        } else {
            leaderboardData.forEach((score, idx) => {
                ctx.fillStyle = idx === 0 ? '#ffcc00' : (idx === 1 ? '#cccccc' : (idx === 2 ? '#cc6600' : '#ffffff'));
                ctx.font = '14px Courier New';
                ctx.fillText(`${idx + 1}. ${score.name.padEnd(10, ' ')} : ${score.time}s`, canvas.width / 2, 265 + idx * 25);
            });
        }

        ctx.fillStyle = '#8888aa';
        ctx.font = '12px Courier New';
        ctx.fillText('--- CONTROLS ---', canvas.width / 2, 420);
        ctx.fillText('移動: A / D | ジャンプ: Space | 攻撃: J / X | リトライ: R', canvas.width / 2, 445);
        ctx.textAlign = 'left';
        return;
    }

    if (gameState === GAME_STATE.PLAYING || gameState === GAME_STATE.CLEAR) {
        player.draw(ctx);
    }

    bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    if (gameState === GAME_STATE.PLAYING || gameState === GAME_STATE.GAMEOVER) {
        boss.draw(ctx);
    }

    bossBullets.forEach(bb => {
        ctx.fillStyle = bb.color;
        ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
    });

    items.forEach(item => {
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(item.x + 4, item.y + 8, 12, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(item.x + 6, item.y + 2, 8, 6);
        ctx.fillRect(item.x + 6, item.y + 10, 4, 4);
    });

    ctx.fillStyle = '#fff';
    ctx.font = '15px Courier New';
    ctx.fillText('HERO HP:', 20, 30);
    for (let i = 0; i < player.maxHp; i++) {
        ctx.fillStyle = i < player.hp ? '#00ffcc' : '#333333';
        ctx.fillRect(110 + i * 22, 16, 18, 18);
    }

    if (gameState === GAME_STATE.PLAYING) {
        const currentElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`TIME: ${currentElapsed}s`, 250, 30);
    }

    const bossTitle = boss.isPhase2 ? '魔王: LAST GUARDIAN [OVERDRIVE]' : '魔王: LAST GUARDIAN';
    ctx.fillStyle = boss.isPhase2 ? '#ff4444' : '#ffffff';
    ctx.fillText(bossTitle, 410, 30);

    ctx.strokeStyle = '#fff';
    ctx.strokeRect(450, 40, 300, 16);

    const hpWidth = (boss.hp / boss.maxHp) * 300;
    ctx.fillStyle = boss.isPhase2 ? '#ff0055' : '#00ff66';
    ctx.fillRect(450, 40, hpWidth, 16);

    if (megalovaniaNoticeTimer > 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 24px Courier New';
        ctx.fillText('★ SPECIAL BGM: MEGALOVANIA! ★', canvas.width / 2, 130);
        ctx.textAlign = 'left';
    }

    if (phaseMessageTimer > 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 22px Courier New';
        ctx.fillText('魔王:「ククク… 真の絶望を見せてやる！」', canvas.width / 2, 160);
        ctx.textAlign = 'left';
    }

    ctx.fillStyle = '#666';
    ctx.font = '12px Courier New';
    ctx.fillText('MOVE: A/D | JUMP: Space | SHOOT: J/X | RETRY: R', 20, 585);

    if (gameState === GAME_STATE.GAMEOVER) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 40px Courier New';
        ctx.fillText('GAME OVER', canvas.width / 2, 220);

        ctx.fillStyle = '#ffaaaa';
        ctx.font = '16px Courier New';
        ctx.fillText('勇者は力尽き、世界は深淵の闇に包まれた…', canvas.width / 2, 270);

        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Courier New';
        ctx.fillText('>> PRESS R TO RETRY <<', canvas.width / 2, 340);
        ctx.textAlign = 'left';
    }

    if (gameState === GAME_STATE.CLEAR) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 36px Courier New';
        ctx.fillText('VICTORY!', canvas.width / 2, 160);

        ctx.fillStyle = '#ffff00';
        ctx.font = '16px Courier New';
        ctx.fillText('魔王は滅び、世界に再び光が戻った！', canvas.width / 2, 200);
        ctx.fillText(`撃破タイム: ${clearTime} 秒`, canvas.width / 2, 230);

        // クリア画面にもリアルタイムTOP 5ランキングを表示
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 15px Courier New';
        ctx.fillText('=== TOP 5 LEADERBOARD ===', canvas.width / 2, 280);

        leaderboardData.forEach((score, idx) => {
            ctx.fillStyle = idx === 0 ? '#ffcc00' : '#ffffff';
            ctx.font = '13px Courier New';
            ctx.fillText(`${idx + 1}. ${score.name.padEnd(10, ' ')} : ${score.time}s`, canvas.width / 2, 305 + idx * 22);
        });

        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Courier New';
        ctx.fillText('>> PRESS R TO PLAY AGAIN <<', canvas.width / 2, 450);
        ctx.textAlign = 'left';
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();