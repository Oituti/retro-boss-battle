const player = {
    x: 100,
    y: 500,
    width: 32,
    height: 48,
    color: '#3366cc',
    speed: 6.5,
    vy: 0,
    gravity: 1.2,
    jumpPower: -14.5,
    isGrounded: false,
    jumpsLeft: 2,
    facing: 'right',
    shootCooldown: 0,
    maxHp: 5,
    hp: 5,
    invincibleTimer: 0,

    init(groundY) {
        this.x = 100;
        this.y = groundY;
        this.vy = 0;
        this.isGrounded = false;
        this.jumpsLeft = 2;
        this.facing = 'right';
        this.shootCooldown = 0;
        this.hp = this.maxHp;
        this.invincibleTimer = 0;

        // 💀 メガロバニア時は勇者もハイテンポ化（スピード＆連射力UP）
        if (Sound.isMegalovania) {
            this.speed = 8.0;
        } else {
            this.speed = 6.5;
        }
    },

    update(keys, canvasWidth, groundY, bullets) {
        if (keys.left) {
            this.x -= this.speed;
            this.facing = 'left';
        }
        if (keys.right) {
            this.x += this.speed;
            this.facing = 'right';
        }

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth) {
            this.x = canvasWidth - this.width;
        }

        if (keys.jumpPressed && this.jumpsLeft > 0) {
            this.vy = this.jumpPower;
            this.jumpsLeft--;
            this.isGrounded = false;
            keys.jumpPressed = false;
            Sound.playJump();
        }

        this.vy += this.gravity;
        this.y += this.vy;

        if (this.y >= groundY) {
            this.y = groundY;
            this.vy = 0;
            this.isGrounded = true;
            this.jumpsLeft = 2;
        }

        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.invincibleTimer > 0) this.invincibleTimer--;

        if (keys.shoot) {
            this.shootBullet(bullets);
        }
    },

    shootBullet(bullets) {
        if (this.shootCooldown > 0) return;

        const bulletSpeed = Sound.isMegalovania ? 16 : 14;
        const bx = this.facing === 'right' ? this.x + this.width : this.x - 16;
        const by = this.y + this.height / 2 - 4;

        bullets.push({
            x: bx,
            y: by,
            width: 18,
            height: 6,
            vx: this.facing === 'right' ? bulletSpeed : -bulletSpeed,
            color: '#ffff00'
        });

        // 💀 メガロバニア時は連射速度がアップ！
        this.shootCooldown = Sound.isMegalovania ? 6 : 10;
        Sound.playShoot();
    },

    damage(amount) {
        if (this.invincibleTimer > 0) return false;

        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        this.invincibleTimer = 55;
        Sound.playHit();
        return true;
    },

    heal(amount) {
        if (this.hp < this.maxHp) {
            this.hp += amount;
            if (this.hp > this.maxHp) this.hp = this.maxHp;
            Sound.playHeal();
            return true;
        }
        return false;
    },

    draw(ctx) {
        if (this.invincibleTimer === 0 || Math.floor(this.invincibleTimer / 4) % 2 === 0) {
            const isRight = this.facing === 'right';

            ctx.fillStyle = '#cc0033';
            const capeX = isRight ? this.x - 6 : this.x + 18;
            ctx.fillRect(capeX, this.y + 12, 20, 32);

            ctx.fillStyle = '#2255bb';
            ctx.fillRect(this.x + 4, this.y + 16, 24, 24);

            ctx.fillStyle = '#663300';
            ctx.fillRect(this.x + 6, this.y + 40, 8, 8);
            ctx.fillRect(this.x + 18, this.y + 40, 8, 8);

            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(this.x + 4, this.y, 24, 16);
            ctx.fillStyle = '#aaaaff';
            ctx.fillRect(this.x + 4, this.y + 4, 24, 5);

            ctx.fillStyle = '#ffccaa';
            const faceX = isRight ? this.x + 12 : this.x + 4;
            ctx.fillRect(faceX, this.y + 8, 16, 8);

            ctx.fillStyle = '#000000';
            const eyeX = isRight ? this.x + 22 : this.x + 6;
            ctx.fillRect(eyeX, this.y + 10, 4, 4);

            ctx.fillStyle = '#dddddd';
            const swordX = isRight ? this.x + 24 : this.x;
            ctx.fillRect(swordX, this.y + 18, 8, 16);
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(swordX - 2, this.y + 24, 12, 4);
        }
    }
};