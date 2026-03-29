function startBattle() {
    AudioEngine.init(); AudioEngine.click();
    document.getElementById('hub-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('hub-screen').style.display = 'none';
        document.getElementById('battle-screen').style.display = 'flex';
        
        initTeamBattleUI();
        spawnNextStage(); renderStageMap(); renderActionBar(); updateUI(); gameLoop();
    }, 500);
}

function spawnNextStage() {
    const currentPos = (player.stage - 1) % STAGES_PER_CHAPTER;
    const type = CHAPTER_LAYOUT[currentPos];

    document.getElementById('monster-sprite').style.opacity = '1';
    document.getElementById('monster-sprite').style.transform = 'scale(1)';

    if (type === 'treasure') {
        monster.maxHp = 1; monster.hp = 1; monster.atk = 0; monster.icon = '🎁';
        document.getElementById('enemy-name').innerText = "Rương Báu";
        document.getElementById('enemy-name').style.color = "#ffcc00";
        document.getElementById('monster-atk-val').style.display = "none";
        addLog(`Stage ${player.stage}: Một chiếc Rương Báu!`);
    } else {
        const isBoss = (type === 'boss');
        document.getElementById('monster-atk-val').style.display = "inline";
        
        const hpGrowthMultiplier = 1 + (player.stage * 0.20); 
        const atkGrowthMultiplier = 1 + (player.stage * 0.10); 

        let calculatedHp = Math.floor(BASE_MONSTER.hp * hpGrowthMultiplier);
        let calculatedAtk = Math.floor(BASE_MONSTER.atk * atkGrowthMultiplier);

        if (isBoss) { calculatedHp = Math.floor(calculatedHp * 2); calculatedAtk = Math.floor(calculatedAtk * 1.5); }

        monster.maxHp = calculatedHp; monster.hp = monster.maxHp; monster.atk = calculatedAtk;
        const icons = isBoss ? ['🐲', '🧌', '🤖'] : ['👾', '🐍', '🐺', '🦂'];
        monster.icon = icons[Math.floor(Math.random() * icons.length)];
        
        document.getElementById('enemy-name').innerText = isBoss ? `BOSS Stage ${player.stage}` : `Quái Stage ${player.stage}`;
        document.getElementById('enemy-name').style.color = "#d32f2f";
        addLog(`Stage ${player.stage}: ${isBoss ? 'BOSS ' : ''}${monster.icon} xuất hiện!`);
    }
    document.getElementById('monster-icon').innerText = monster.icon;
    updateUI();
}

function manualCastSkill(index) {
    let hero = TEAM[index];
    if (hero.cdCurrent >= hero.cdMax && monster.hp > 0) {
        AudioEngine.click();
        executeSupportSkill(index);
    }
}

async function executeSupportSkill(index) {
    let hero = TEAM[index];
    let btnUI = document.getElementById(`skill-btn-${index}`);
    if(btnUI) btnUI.classList.remove('ready');
    hero.cdCurrent = 0; 
    
    let entityEl = document.getElementById(`supp-entity-${index}`);
    if (entityEl) {
        let currentTransform = entityEl.style.transform;
        entityEl.style.transform = `${currentTransform} translateY(-15px) scale(1.3)`;
    }
    
    spawnPopup(`supp-entity-${index}`, 0, 'skill', hero.skillName);
    let logStr = hero.triggerSkill(monster, player);
    addLog(`<b style="color:var(--accent)">[Skill]</b> ${hero.icon} ${hero.name} ${logStr}`);
    
    updateUI();

    setTimeout(() => {
        if(document.getElementById(`supp-entity-${index}`)) {
            let currentTransform = document.getElementById(`supp-entity-${index}`).style.transform;
            document.getElementById(`supp-entity-${index}`).style.transform = currentTransform.replace('translateY(-15px) scale(1.3)', '');
        }
    }, 500);
}

async function processSupportEnergy() {
    for (let j = 0; j < TEAM.length; j++) {
        let hero = TEAM[j];
        if (hero.type === 'support' && hero.cdCurrent < hero.cdMax) {
            hero.cdCurrent++; 
        }
    }
    updateUI(); 
    
    if (isAutoSkill && monster.hp > 0) {
        for (let j = 0; j < TEAM.length; j++) {
            let hero = TEAM[j];
            if (hero.type === 'support' && hero.cdCurrent >= hero.cdMax) {
                await executeSupportSkill(j);
                await sleep(300); 
            }
        }
    }
}

async function gameLoop() {
    if (player.hp <= 0) {
        AudioEngine.hurt(); 
        addLog("<b style='color:red'>GAME OVER! Tổ đội đã gục ngã.</b>");
        setTimeout(() => { alert("Tải lại trang để chơi lại."); location.reload(); }, 1000);
        return;
    }

    const currentPos = (player.stage - 1) % STAGES_PER_CHAPTER;
    const type = CHAPTER_LAYOUT[currentPos];

    addLog("Đội hình đang tác chiến...");
    
    for (let i = 0; i < player.sequence.length; i++) {
        if (monster.hp <= 0) break; 

        const actionObj = player.sequence[i];
        const action = ACTIONS_LIB[actionObj.id];
        const skillLevel = actionObj.level;

        const slot = document.getElementById(`slot-${i}`);
        slot.classList.add('active');
        
        if (i === 0) {
            document.getElementById('battle-main-icon').style.transform = 'translateX(30px) rotate(15deg)';
            await sleep(150);
            
            if (monster.hp > 0) {
                AudioEngine.attack();
                let mainDmg = type === 'treasure' ? 1 : (action.dmg * skillLevel);
                if (mainDmg > 0) {
                    monster.hp -= mainDmg;
                    spawnPopup('monster-sprite', mainDmg, 'dmg');
                    if (type !== 'treasure') triggerShake('monster-sprite');
                }
                if (action.heal > 0) {
                    let healAmount = action.heal * skillLevel;
                    player.hp = Math.min(player.maxHp, player.hp + healAmount);
                    spawnPopup('player-sprite', healAmount, 'heal');
                }
            }
            
            updateUI();
            await sleep(300);
            document.getElementById('battle-main-icon').style.transform = 'translateX(0) rotate(0deg)';
            
            for (let j = 0; j < TEAM.length; j++) {
                let supp = TEAM[j];
                if (supp.type === 'support' && monster.hp > 0) {
                    let suppEl = document.getElementById(`supp-entity-${j}`);
                    if(suppEl) suppEl.style.transform = 'translateX(30px)';
                    await sleep(150);
                    
                    if (monster.hp <= 0) break; 
                    
                    AudioEngine.attack();
                    let sDmg = type === 'treasure' ? 1 : supp.baseDmg;
                    monster.hp -= sDmg;
                    spawnPopup('monster-sprite', sDmg, 'dmg');
                    if (type !== 'treasure') triggerShake('monster-sprite');
                    updateUI();
                    
                    await sleep(300);
                    if(suppEl) suppEl.style.transform = 'translateX(0)';
                }
            }
        } 
        else {
            document.getElementById('battle-main-icon').style.transform = 'translateX(30px) rotate(15deg)';
            await sleep(150);
            
            if (monster.hp > 0) {
                AudioEngine.attack();
                if (action.dmg > 0) {
                    let finalDmg = type === 'treasure' ? 1 : (action.dmg * skillLevel); 
                    monster.hp -= finalDmg;
                    spawnPopup('monster-sprite', finalDmg, 'dmg');
                    if (type !== 'treasure') triggerShake('monster-sprite');
                }
                if (action.heal > 0) {
                    let healAmount = action.heal * skillLevel;
                    player.hp = Math.min(player.maxHp, player.hp + healAmount);
                    spawnPopup('player-sprite', healAmount, 'heal');
                }
            }
            
            updateUI();
            await sleep(300); 
            document.getElementById('battle-main-icon').style.transform = 'translateX(0) rotate(0deg)';
        }

        slot.classList.remove('active');
        
        await processSupportEnergy();
        await sleep(200); 

        if (monster.hp <= 0) {
            await handleVictory(type);
            return; 
        }
    }

    if (monster.hp <= 0) {
        await handleVictory(type);
        return;
    }

    if (type !== 'treasure') { 
        await sleep(400);
        if (monster.hp <= 0) {
            await handleVictory(type);
            return;
        }

        addLog(`Quái vật phản công!`);
        document.getElementById('monster-sprite').style.transform = 'translateX(-40px)';
        await sleep(150);
        
        AudioEngine.hurt(); 
        player.hp -= monster.atk;
        spawnPopup('player-sprite', monster.atk, 'dmg');
        triggerShake('player-sprite');
        updateUI();
        
        await sleep(400);
        document.getElementById('monster-sprite').style.transform = 'translateX(0)';
        await sleep(200);
    } else {
        await sleep(600); 
    }

    gameLoop(); 
}

async function handleVictory(stageType) {
    if (stageType === 'treasure') {
        AudioEngine.levelUp(); 
        addLog("<b style='color:#ffcc00'>Đã mở Rương Báu!</b>");
        pendingRewardType = 'treasure';
        await showStageClearAnim("MỞ RƯƠNG THÀNH CÔNG!");
        showRewardModal("🎁 PHẦN THƯỞNG TỪ RƯƠNG 🎁");
        return;
    }

    if (stageType === 'boss') {
        AudioEngine.levelUp(); 
        addLog("<b style='color:#ff9800'>Hạ gục Boss!</b>");
        pendingRewardType = 'boss';
        player.exp += 50; updateUI();
        await showStageClearAnim("BOSS BỊ TIÊU DIỆT!");
        showRewardModal("👑 PHẦN THƯỞNG DIỆT BOSS 👑");
        return;
    }

    addLog("<b style='color:green'>Chiến thắng! Nhận 20 EXP</b>");
    player.exp += 20; updateUI();

    if (player.exp >= player.nextExp) {
        AudioEngine.levelUp(); 
        pendingRewardType = 'level';
        await showStageClearAnim("LEVEL UP!");
        showRewardModal("🌟 LÊN CẤP! CHỌN KỸ NĂNG 🌟");
        return;
    }

    await showStageClearAnim("STAGE CLEAR!");
    player.stage += 1; spawnNextStage(); renderStageMap(); gameLoop();
}

function selectUpgrade(key) {
    AudioEngine.click(); 
    const existing = player.sequence.find(s => s.id === key);
    if (existing) existing.level += 1; else player.sequence.push({ id: key, level: 1 });
    executeUpgradeCallback();
}

function executeUpgradeCallback() {
    if (pendingRewardType === 'level') {
        player.lv += 1; player.exp -= player.nextExp; player.nextExp += 25;
        player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.2));
    }
    pendingRewardType = null; player.stage += 1; 
    document.getElementById('level-modal').style.display = 'none';
    
    renderStageMap(); renderActionBar(); spawnNextStage(); updateUI(); gameLoop();
}