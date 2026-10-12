const boss = {
    x: 580,
    y: 260,
    baseX: 580,
    baseY: 260,
    width: 180,
    height: 240,
    maxHp: 45,
    hp: 45,
    coreOpen: false,
    coreTimer: 0,
    coreOpenDuration: 110,
    coreCloseDuration: 150,
    flashTimer: 0,
    attackTimer: 0,
    attackInterval: 130,
    warningTimer: 0,
    warningDuration: 40,
    nextAttackType: 0,
    isPhase2: false,
    moveAngle: 0,

    groundStateTimer: 0,
    isGroundedState: false,

    init() {
        this.x = 580;
        this.y = 260;
        this.baseX = 580;
        this.baseY = 260;
        this.maxHp = Sound.isMegalovania ? 50 : 45;
        this.hp = this.maxHp;
        this.coreOpen = false;
        this.coreTimer = 0;
        this.flashTimer = 0;
        this.attackTimer = 0;

        this.attackInterval = Sound.isMegalovania ? 70 : 130;
        this.warningTimer = 0;
        this.warningDuration = Sound.isMegalovania ? 25 : 40;
        this.isPhase2 = false;
        this.moveAngle = 0;
        this.groundStateTimer = 0;
        this.isGroundedState = false;
    },

    update(playerObj, bossBullets, groundY) {
        if (this.hp <= this.maxHp / 2) {
            this.isPhase2 = true;
            this.attackInterval = Sound.isMegalovania ? 40 : 80;
        }

        if (Sound.isMegalovania) {
            this.isGroundedState = false;
        } else {
            this.groundStateTimer++;
            if (this.groundStateTimer >= 300) {
                this.groundStateTimer = 0;
                this.isGroundedState = !this.isGroundedState;
            }
        }

        const moveSpeed = Sound.isMegalovania ? (this.isPhase2 ? 0.08 : 0.06) : (this.isPhase2 ? 0.05 : 0.035);
        this.moveAngle += moveSpeed;

        const targetY = this.isGroundedState
            ? (groundY + playerObj.height - this.height + 48)
            : (this.baseY + Math.sin(this.moveAngle * 2) * 45);

        this.y += (targetY - this.y) * 0.08;

        const moveRange = this.isPhase2 ? 160 : 90;
        this.x = this.baseX - Math.abs(Math.sin(this.moveAngle)) * moveRange;

        this.coreTimer++;
        if (this.coreOpen) {
            if (this.coreTimer >= this.coreOpenDuration) {
                this.coreOpen = false;
                this.coreTimer = 0;
            }
        } else {
            if (this.coreTimer >= this.coreCloseDuration) {
                this.coreOpen = true;
                this.coreTimer = 0;
            }
        }

        if (this.flashTimer > 0) this.flashTimer--;

        this.attackTimer++;
        if (this.warningTimer > 0) {
            this.warningTimer--;
            if (this.warningTimer === 0) {
                this.executeAttack(playerObj, bossBullets, groundY);
            }
        } else if (this.attackTimer >= this.attackInterval) {
            this.attackTimer = 0;
            if (this.isGroundedState && Math.random() < 0.6) {
                this.nextAttackType = 2;
            } else {
                this.nextAttackType = Math.floor(Math.random() * 3) + 1;
            }
            this.warningTimer = this.warningDuration;
        }
    },

    executeAttack(playerObj, bossBullets, groundY) {
        const bx = this.x;
        const by = this.y + 110;

        if (this.nextAttackType === 1) {
            const dx = (playerObj.x + playerObj.width / 2) - bx;
            const dy = (playerObj.y + playerObj.height / 2) - by;
            const angle = Math.atan2(dy, dx);
            const speed = Sound.isMegalovania ? (this.isPhase2 ? 12 : 10) : (this.isPhase2 ? 9.5 : 7.5);

            bossBullets.push({
                x: bx,
                y: by,
                width: 20,
                height: 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#ff00ff'
            });
        } else if (this.nextAttackType === 2) {
            const speed = Sound.isMegalovania ? (this.isPhase2 ? -11 : -9) : (this.isPhase2 ? -8.5 : -6.5);
            bossBullets.push({
                x: this.x,
                y: groundY + playerObj.height - 30,
                width: 50,
                height: 30,
                vx: speed,
                vy: 0,
                color: '#ff3300'
            });
        } else if (this.nextAttackType === 3) {
            let angles;
            if (Sound.isMegalovania) {
                angles = this.isPhase2
                    ? [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]
                    : [-0.6, -0.3, 0, 0.3, 0.6];
            } else {
                angles = this.isPhase2
                    ? [-0.6, -0.3, 0, 0.3, 0.6]
                    : [-0.4, 0, 0.4];
            }

            const speed = Sound.isMegalovania ? (this.isPhase2 ? 8.5 : 7) : (this.isPhase2 ? 6.5 : 5.5);
            angles.forEach(offsetAngle => {
                const angle = Math.PI + offsetAngle;
                bossBullets.push({
                    x: bx,
                    y: by,
                    width: 16,
                    height: 16,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: '#00ffff'
                });
            });
        }
    },

    getCoreRect() {
        return {
            x: this.x - 10,
            y: this.y + 100,
            width: 50,
            height: 70
        };
    },

    draw(ctx) {
        let mainColor = '#1a0d26';
        let armorColor = '#4a154b';

        if (this.flashTimer > 0) {
            mainColor = '#ff4444';
            armorColor = '#ffffff';
        } else if (this.isPhase2) {
            mainColor = '#4a0000';
            armorColor = '#990033';
        }

        ctx.fillStyle = armorColor;
        ctx.beginPath();
        ctx.moveTo(this.x + 40, this.y + 60);
        ctx.lineTo(this.x - 40, this.y + 20);
        ctx.lineTo(this.x - 20, this.y + 180);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = mainColor;
        ctx.fillRect(this.x, this.y + 40, this.width, this.height - 40);

        ctx.fillStyle = '#111';
        ctx.fillRect(this.x + 20, this.y - 30, 20, 50);
        ctx.fillRect(this.x, this.y - 50, 20, 30);
        ctx.fillRect(this.x + 120, this.y - 30, 20, 50);
        ctx.fillRect(this.x + 140, this.y - 50, 20, 30);

        ctx.fillStyle = '#2d0a31';
        ctx.fillRect(this.x + 30, this.y + 10, 120, 50);

        if (this.warningTimer > 0) {
            ctx.fillStyle = (Math.floor(this.warningTimer / 4) % 2 === 0) ? '#ff0000' : '#ffff00';
            ctx.fillRect(this.x + 40, this.y + 25, 100, 20);
        } else {
            ctx.fillStyle = '#ff0033';
            ctx.fillRect(this.x + 50, this.y + 30, 25, 12);
            ctx.fillRect(this.x + 105, this.y + 30, 25, 12);
        }

        if (this.coreOpen) {
            ctx.fillStyle = '#ff0055';
            ctx.fillRect(this.x - 10, this.y + 100, 50, 70);
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(this.x, this.y + 115, 30, 40);
        } else {
            ctx.fillStyle = '#0a0511';
            ctx.fillRect(this.x - 10, this.y + 100, 50, 70);
            ctx.fillStyle = '#331a00';
            ctx.fillRect(this.x - 10, this.y + 130, 50, 10);
        }
    }
};