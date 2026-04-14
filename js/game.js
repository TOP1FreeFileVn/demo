function startBattle() {
    if(AudioEngine && typeof AudioEngine.init === 'function') AudioEngine.init(); 
    if(AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
    document.getElementById('hub-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('hub-screen').style.display = 'none';
        document.getElementById('battle-screen').style.display = 'flex';
        initTeamBattleUI(); renderStageMap(); renderActionBar(); updateUI(); 
        
        window.cameraMode = 'full';
        updateCamera();
        showMapPhase(); 
    }, 500);
}

function showMapPhase() {
    document.getElementById('combat-view').style.display = 'none';
    document.getElementById('skills-panel').style.display = 'none';
    document.getElementById('action-bar-container').style.display = 'none';
    
    document.getElementById('stage-dots-container').style.display = 'grid';
    document.getElementById('center-map-boss').style.display = 'flex';
    document.getElementById('dice-container').style.display = 'flex'; 

    window.cameraMode = 'full';
    updateCamera();

    if (isAutoSkill) {
        let btnRoll = document.getElementById('btn-roll');
        if(btnRoll) btnRoll.style.opacity = '0.5';
        setTimeout(() => {
            if (isAutoSkill && document.getElementById('dice-container').style.display === 'flex') {
                if(btnRoll) btnRoll.style.opacity = '1';
                rollDice('normal');
            }
        }, 1200 / gameSpeed);
    }
}

function addShrineBuff(percent) {
    player.shrineBuff += percent;
    let oldMaxHp = player.maxHp; player.maxHp = Math.floor(BASE_PLAYER_HP * (1 + player.shrineBuff)); player.hp += (player.maxHp - oldMaxHp); updateUI();
}

async function rollDice(type = 'normal') {
    if (isRolling) return;
    
    if (type === 'low' && player.inventory.diceLow <= 0) return;
    if (type === 'high' && player.inventory.diceHigh <= 0) return;

    isRolling = true; 
    if(AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
    if (type === 'low') player.inventory.diceLow--;
    if (type === 'high') player.inventory.diceHigh--;
    updateUI(); 

    if (player.lap === 25) {
        addLog(`<b style="color:red; font-size:14px;">🚨 TỬ CHIẾN VÒNG 25 🚨</b>`);
        let boardWrapper = document.getElementById('monopoly-board-wrapper');
        if (boardWrapper) boardWrapper.style.boxShadow = "0 0 30px red";
        let stageDots = document.getElementById('stage-dots-container');
        if (stageDots) stageDots.style.background = "rgba(255,0,0,0.2)";
        for(let i=0; i<32; i++) {
            if(!BOARD_TILES[i].isCorner && (BOARD_TILES[i].type === 'event' || BOARD_TILES[i].type === 'empty' || BOARD_TILES[i].type === 'trap')) {
                BOARD_TILES[i] = { type: 'trap', icon: '🔥', name: 'Dung Nham' };
            }
        }
        renderStageMap();
    }

    const diceUI1 = document.getElementById('dice-result-1'); const diceUI2 = document.getElementById('dice-result-2'); const btnRoll = document.getElementById('btn-roll');
    if(btnRoll) { btnRoll.style.opacity = '0.5'; btnRoll.innerText = 'ĐANG LĂN...'; }

    let d1 = 1, d2 = 1;
    
    if (gameSpeed > 1) {
        if (type === 'low') { d1 = Math.floor(Math.random() * 3) + 1; d2 = Math.floor(Math.random() * 3) + 1; }
        else if (type === 'high') { d1 = Math.floor(Math.random() * 3) + 4; d2 = Math.floor(Math.random() * 3) + 4; }
        else { d1 = Math.floor(Math.random() * 6) + 1; d2 = Math.floor(Math.random() * 6) + 1; }
        if(diceUI1) diceUI1.innerText = d1; if(diceUI2) diceUI2.innerText = d2; 
        await sleep(150); 
    } else {
        for(let i=0; i<10; i++) {
            if (type === 'low') { d1 = Math.floor(Math.random() * 3) + 1; d2 = Math.floor(Math.random() * 3) + 1; }
            else if (type === 'high') { d1 = Math.floor(Math.random() * 3) + 4; d2 = Math.floor(Math.random() * 3) + 4; }
            else { d1 = Math.floor(Math.random() * 6) + 1; d2 = Math.floor(Math.random() * 6) + 1; }
            if(diceUI1) diceUI1.innerText = d1; if(diceUI2) diceUI2.innerText = d2; await sleep(100);
        }
    }
    
    let totalSteps = d1 + d2;
    addLog(`Đổ được <b style="color:var(--accent)">${d1} + ${d2} = ${totalSteps}</b> điểm!`);

    await sleep(600);
    if(btnRoll) { btnRoll.style.opacity = '1'; btnRoll.innerText = 'ĐỔ XÚC XẮC'; }
    let passedStart = false;

    window.cameraMode = 'focus';
    window.currentCamScale = 0.6;
    updateCamera();
    await sleep(400 / gameSpeed);

    for(let step = 0; step < totalSteps; step++) {
        player.boardPos++;
        if(player.boardPos >= BOARD_TILES.length) { 
            player.boardPos = 0; player.lap++; 
            if (step < totalSteps - 1) passedStart = true;
            
            for(let j=0; j<32; j++) {
                if(!BOARD_TILES[j].isCorner) BOARD_TILES[j] = generateRandomTile();
            }
            addLog(`<b style="color:green">Hoàn thành vòng! Bàn cờ đã được xáo trộn.</b>`);
        }
        
        let progress = (step + 1) / totalSteps; 
        let isFinalStep = (step === totalSteps - 1);

        if (isFinalStep) {
            window.currentCamScale = 0.7; 
            renderStageMap(); 
            
            let activeDot = document.querySelector('.stage-dot.active');
            if (activeDot) { activeDot.classList.add('final-step'); }
            
            await sleep(385 / gameSpeed);

            if(AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click(); 
            let shakePower = 4; 
            window.currentCamShakeX = (Math.random()-0.5)*shakePower;
            window.currentCamShakeY = (Math.random()-0.5)*shakePower;
            window.currentCamScale = 0.68; 
            updateCamera();
            
            await sleep(220 / gameSpeed);

        } else {
            window.currentCamScale = 0.6 + (progress * 0.05); 
            window.currentCamShakeX = 0;
            window.currentCamShakeY = 0;
            renderStageMap(); 

            let shakePower = progress * 2;
            window.currentCamShakeX = (Math.random()-0.5)*shakePower;
            window.currentCamShakeY = (Math.random()-0.5)*shakePower;
            updateCamera();

            if(AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click(); 
            let baseDelay = 250 - (progress * 150);
            await sleep((baseDelay * 1.1) / gameSpeed); 
        }
    }
    
    window.cameraMode = 'full';
    window.currentCamShakeX = 0;
    window.currentCamShakeY = 0;
    updateCamera();
    await sleep(400 / gameSpeed); 

    if (passedStart) {
        addLog(`<b style="color:green">Đi ngang Trại: +20% HP, +50 Vàng!</b>`);
        let heal = Math.floor(player.maxHp * 0.2); player.hp = Math.min(player.maxHp, player.hp + heal); player.gold += 50; 
        spawnPopup('player-sprite-container', heal, 'heal'); updateUI(); await sleep(500);
    }

    isRolling = false; 
    
    if ((passedStart || player.boardPos === 0) && player.lap % 2 === 0 && !isAutoSkill) {
        addLog(`<b style="color:#ffcc00">🛒 Thương Nhân đã xuất hiện!</b>`);
        openShop(); 
    } else {
        handleTileEvent(); 
    }
}

async function handleTileEvent() {
    const pos = player.boardPos;
    const tile = BOARD_TILES[pos]; 
    addLog(`Dừng tại: <b>${tile.name}</b>`);
    
    if (!tile.isCorner && player.shrines[pos] > 0) {
        if (player.shrines[pos] === 1) {
            addLog("<b style='color:#9c27b0'>Trùng Phùng! Đền Thờ Lv1 -> Lv2 (+2% Chỉ số) & +50 Vàng</b>");
            player.shrines[pos] = 2; player.gold += 50; addShrineBuff(0.01); 
            spawnPopup('player-sprite-container', 50, 'heal', '🪙 +50 Vàng'); renderStageMap(); await sleep(800);
        } else if (player.shrines[pos] === 2) {
            addLog("<b style='color:#9c27b0'>Hoàn Mỹ! Đền Thờ Lv2 -> Lv3 (+10% Chỉ số) & Nhận Kỹ Năng</b>");
            player.shrines[pos] = 3; addShrineBuff(0.08); 
            renderStageMap(); pendingRewardType = 'event'; 
            if (isAutoSkill) { addLog("<b style='color:green'>Auto lấy phần thưởng Đền Thờ!</b>"); selectUpgrade(Object.keys(ACTIONS_LIB)[Math.floor(Math.random()*4)]); return; }
            showRewardModal("🕍 QUÀ ĐỀN THỜ TỐI THƯỢNG 🕍");
            return; 
        } else if (player.shrines[pos] === 3) { 
            addLog("<b style='color:#9c27b0'>Viếng thăm Đền Thờ Max: Nhận 20 Vàng!</b>"); 
            player.gold += 20; updateUI(); await sleep(800); 
        }
    }
    else if (!tile.isCorner && player.shrines[pos] === 0 && tile.type === 'empty') {
        addLog("<b style='color:#9c27b0'>Cắm Cờ! Xây Đền Thờ Lv1 (+1% Chỉ số)</b>");
        player.shrines[pos] = 1; addShrineBuff(0.01); spawnPopup('player-sprite-container', 0, 'skill', '⛩️ +1% STATS');
        renderStageMap(); await sleep(800); showMapPhase(); return; 
    }

    if (tile.type === 'start') {
        addLog(`<b style="color:green">Về Trại: +50% HP, Đầy Mana, +100 Vàng!</b>`);
        let heal = Math.floor(player.maxHp * 0.5); player.hp = Math.min(player.maxHp, player.hp + heal); player.gold += 100;
        ACTIVE_TEAM.forEach(hero => { if(hero) hero.cdCurrent = hero.cdMax; }); 
        spawnPopup('player-sprite-container', heal, 'heal'); updateUI(); await sleep(1000); showMapPhase();
    } 
    else if (tile.type === 'spring') {
        addLog(`<b style="color:#4da3ff">Suối Tiên: Giải trừ mọi hiệu ứng, Hồi 100% HP!</b>`);
        player.hp = player.maxHp; player.statuses = { poison: 0, stun: 0, slow: 0, weaken: 0 }; 
        spawnPopup('player-sprite-container', 999, 'heal', 'THANH TẨY'); updateUI(); await sleep(1000); showMapPhase();
    }
    else if (tile.type === 'gacha') {
        let r = Math.random() * 100;
        if (r < 40) { player.gold += 150; addLog("<b style='color:#ffcc00'>Gacha: Nhận 150 Vàng!</b>"); updateUI(); await sleep(1000); showMapPhase(); }
        else if (r < 90) { 
            addLog("<b style='color:green'>Gacha: Trúng Thẻ Kỹ Năng!</b>"); pendingRewardType = 'event'; 
            if (isAutoSkill) { addLog("<b style='color:green'>Auto lấy kỹ năng Gacha!</b>"); selectUpgrade(Object.keys(ACTIONS_LIB)[Math.floor(Math.random()*4)]); return; }
            showRewardModal("🎰 TẾ ĐÀN: NHẬN KỸ NĂNG 🎰"); 
        }
        else { player.hp -= 20; spawnPopup('player-sprite-container', 20, 'dmg'); triggerShake('player-sprite-container'); addLog("<b style='color:red'>Gacha: Bị sét đánh mất 20 HP!</b>"); updateUI(); await sleep(1000); showMapPhase(); }
    }
    else if (tile.type === 'boss_gate') {
        if(player.lap >= 25 || isAutoSkill) { chooseFightBoss(); } else { document.getElementById('boss-gate-modal').style.display = 'flex'; }
    }
    else if (tile.type === 'empty') {
        showMapPhase();
    }
    else if (tile.type === 'trap') {
        addLog("<b style='color:red'>Dẫm phải Cạm Bẫy/Dung Nham, mất 15 HP!</b>"); player.hp -= 15; spawnPopup('player-sprite-container', 15, 'dmg'); triggerShake('player-sprite-container'); updateUI();
        await sleep(1000); if (player.hp <= 0) { addLog("<b style='color:red'>Bạn đã gục ngã!</b>"); setTimeout(() => { alert("GAME OVER."); location.reload(); }, 1000); return; } showMapPhase();
    } 
    else if (tile.type === 'forge') {
        addLog("<b style='color:orange'>Đến Lò Rèn: Nâng cấp ngẫu nhiên 1 Kỹ năng!</b>");
        if(player.sequence.length > 0) { let randSkill = player.sequence[Math.floor(Math.random() * player.sequence.length)]; randSkill.level += 1; renderActionBar(); } await sleep(1000); showMapPhase();
    }
    else if (tile.type === 'event') { 
        addLog("Bất ngờ nhặt được thẻ kỹ năng!"); pendingRewardType = 'event'; 
        if (isAutoSkill) { addLog("<b style='color:green'>Auto lấy kỹ năng Sự Kiện!</b>"); selectUpgrade(Object.keys(ACTIONS_LIB)[Math.floor(Math.random()*4)]); return; }
        showRewardModal("❓ SỰ KIỆN: NHẬN KỸ NĂNG ❓"); 
    }
    else { spawnNextStage(tile.type); }
}

function chooseSkipBoss() { if(AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click(); document.getElementById('boss-gate-modal').style.display = 'none'; bossEnrage++; addLog(`<b style="color:red">Đã bỏ qua Boss. Nhận 1 tầng Cuồng Nộ (Hiện tại: ${bossEnrage} tầng)</b>`); renderStageMap(); showMapPhase(); }
function chooseFightBoss() { if(AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click(); document.getElementById('boss-gate-modal').style.display = 'none'; spawnNextStage('boss'); }

function spawnNextStage(tileType) {
    document.getElementById('stage-dots-container').style.display = 'none'; 
    document.getElementById('center-map-boss').style.display = 'none'; 
    document.getElementById('dice-container').style.display = 'none'; 
    
    document.getElementById('combat-view').style.display = 'flex';
    document.getElementById('skills-panel').style.display = 'flex';
    document.getElementById('action-bar-container').style.display = 'block';

    let monsterSprite = document.getElementById('monster-sprite');
    if (monsterSprite) {
        monsterSprite.style.display = 'flex'; 
        monsterSprite.style.opacity = '1'; 
        monsterSprite.style.transform = 'scale(1)';
    }

    monster.statuses = { poison: 0, stun: 0, slow: 0, weaken: 0 }; monster.currentTileType = tileType; 
    window.cameraMode = 'full';
    
    let atkValElement = document.getElementById('monster-atk-val');
    let enemyNameElement = document.getElementById('enemy-name');

    if (tileType === 'chest') {
        monster.maxHp = 1; monster.hp = 1; monster.atk = 0; monster.icon = '🎁'; 
        if (enemyNameElement) { enemyNameElement.innerText = "Rương Báu"; enemyNameElement.style.color = "#ffcc00"; }
        if (atkValElement) atkValElement.style.display = "none";
    } else {
        const isBoss = (tileType === 'boss'); 
        if (atkValElement) atkValElement.style.display = "inline";
        const hpGrowthMultiplier = 1 + (player.lap * 0.30); const atkGrowthMultiplier = 1 + (player.lap * 0.15); 
        let calculatedHp = Math.floor(BASE_MONSTER.hp * hpGrowthMultiplier); let calculatedAtk = Math.floor(BASE_MONSTER.atk * atkGrowthMultiplier);
        if (isBoss) { calculatedHp = Math.floor(calculatedHp * 2); let enrageMultiplier = 1 + (bossEnrage * 0.1); calculatedAtk = Math.floor((calculatedAtk * 1.5) * enrageMultiplier); }
        monster.maxHp = calculatedHp; monster.hp = monster.maxHp; monster.atk = calculatedAtk;
        const icons = isBoss ? ['🐲', '🧌', '🤖', '👽', '🧛‍♂️'] : ['👾', '🐍', '🐺', '🦂', '🕷️', '🦇']; monster.icon = icons[Math.floor(Math.random() * icons.length)];
        
        if (enemyNameElement) {
            enemyNameElement.innerText = isBoss ? `TRÙM CUỐI (Nộ: ${bossEnrage})` : `Quái Vòng ${player.lap}`; 
            enemyNameElement.style.color = "#d32f2f"; 
        }
        addLog(`Đụng độ ${isBoss ? 'BOSS ' : ''}${monster.icon}!`);
    }
    let mIconUI = document.getElementById('monster-icon');
    if (mIconUI) mIconUI.innerText = monster.icon; 
    
    updateUI(); 
    gameLoop();
}

function manualCastSkill(index) {
    let hero = ACTIVE_TEAM[index]; 
    if (hero && hero.cdCurrent >= hero.cdMax && monster.hp > 0) { 
        if(AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click(); 
        executeSupportSkill(index); 
    }
}

async function executeSupportSkill(index) {
    let hero = ACTIVE_TEAM[index]; let btnUI = document.getElementById(`skill-btn-${index}`);
    if(btnUI) btnUI.classList.remove('ready'); hero.cdCurrent = 0; 
    let entityEl = document.getElementById(`supp-entity-${index}`);
    if (entityEl) { let currentTransform = entityEl.style.transform; entityEl.style.transform = `${currentTransform} translateY(-20px) scale(1.3)`; }
    spawnPopup(`supp-entity-${index}`, 0, 'skill', hero.skillName);
    let logStr = hero.triggerSkill(monster, player); addLog(`<b style="color:var(--accent)">[Support]</b> ${hero.icon} ${hero.name} ${logStr}`); updateUI();
    setTimeout(() => { if(document.getElementById(`supp-entity-${index}`)) { let currentTransform = document.getElementById(`supp-entity-${index}`).style.transform; document.getElementById(`supp-entity-${index}`).style.transform = currentTransform.replace('translateY(-20px) scale(1.3)', ''); } }, 500);
}

// FIX: Chỉ tự dùng skill nếu đang bật AUTO
async function chargeSupportMana() {
    if (player.statuses.slow > 0) return; 
    let triggered = false;
    for (let j = 0; j < ACTIVE_TEAM.length; j++) { 
        let hero = ACTIVE_TEAM[j]; 
        if (hero) {
            if (hero.cdCurrent < hero.cdMax) { 
                hero.cdCurrent++; 
                updateUI();
            }
            if (isAutoSkill && hero.cdCurrent >= hero.cdMax && monster.hp > 0) { 
                await sleep(150); 
                await executeSupportSkill(j); 
                triggered = true; 
            }
        } 
    }
    if (triggered) await sleep(300);
}

// BỌC THÉP HÀM NÀY, XỬ LÝ LỖI MẤT KỸ NĂNG DO CUSTOM
async function gameLoop() {
    if (player.hp <= 0) { if(AudioEngine && typeof AudioEngine.hurt === 'function') AudioEngine.hurt(); addLog("<b style='color:red'>GAME OVER! Tổ đội đã gục ngã.</b>"); setTimeout(() => { alert("Tải lại trang để chơi lại."); location.reload(); }, 1000); return; }
    const type = monster.currentTileType || 'monster';

    let pLogs = processStatuses(player, 'player-sprite-container'); let mLogs = processStatuses(monster, 'monster-sprite');
    pLogs.forEach(l => addLog(l)); mLogs.forEach(l => addLog(l)); updateUI(); await sleep(200);

    if (player.hp <= 0) { gameLoop(); return; }
    if (monster.hp <= 0) { await handleVictory(type); return; }

    addLog("Vũ khí chính bắt đầu chuỗi hành động...");
    
    // Nếu vào trận đang auto và có skill sẵn thì dùng ngay
    if (isAutoSkill) {
        await chargeSupportMana();
        if (monster.hp <= 0) { await handleVictory(type); return; }
    }
    
    for (let i = 0; i < 5; i++) {
        if (monster.hp <= 0) break; 
        
        // Cầu chì an toàn: Thoát ngay nếu đã duyệt hết mảng
        if (!player.sequence || i >= player.sequence.length) { break; } 

        const slot = document.getElementById(`slot-${i}`); 
        if(slot) slot.classList.add('active'); 

        if (player.statuses.stun > 0) { 
            addLog(`Vũ khí chính đang bị <b style="color:orange">Choáng</b>, mất lượt!`); 
            await sleep(400); 
            if(slot) slot.classList.remove('active'); 
            continue; 
        }

        const actionObj = player.sequence[i]; 
        const action = ACTIONS_LIB[actionObj.id]; 
        
        // Tránh lỗi khi mảng sequence lưu ID không tồn tại
        if (!action) {
            addLog(`<b style="color:red">Lỗi: Thẻ kỹ năng bị trống! Bỏ qua.</b>`);
            if(slot) slot.classList.remove('active'); 
            continue;
        }

        const skillLevel = actionObj.level || 1;
        let dmgMultiplier = player.statuses.weaken > 0 ? 0.6 : 1; 
        let shrineMultiplier = 1 + (player.shrineBuff || 0); 

        let mainIcon = document.getElementById('battle-main-icon');
        if (mainIcon) mainIcon.style.transform = 'translateY(-30px) rotate(15deg)'; 
        
        await sleep(150);
        
        if (monster.hp > 0) {
            if(AudioEngine && typeof AudioEngine.attack === 'function') AudioEngine.attack(); 
            
            // Xử lý an toàn các chỉ số
            let baseDmg = action.dmg || 0;
            let baseHeal = action.heal || 0;

            let mainDmg = type === 'chest' ? 1 : Math.floor((baseDmg * skillLevel) * dmgMultiplier * shrineMultiplier);
            
            if (mainDmg > 0) { 
                monster.hp -= mainDmg; 
                spawnPopup('monster-sprite', mainDmg, 'dmg'); 
                addLog(`> Tung ${action.icon} gây <b style="color:#ff4d4d">${mainDmg}</b> sát thương!`); // BẬT LẠI LOG SÁT THƯƠNG
                if (type !== 'chest') triggerShake('monster-sprite'); 
            }
            if (baseHeal > 0) { 
                let healAmount = Math.floor((baseHeal * skillLevel) * shrineMultiplier); 
                player.hp = Math.min(player.maxHp, player.hp + healAmount); 
                spawnPopup('player-sprite-container', healAmount, 'heal'); 
                addLog(`> Dùng ${action.icon} hồi <b style="color:#4caf50">${healAmount}</b> HP!`);
            }
        }
        
        updateUI(); 
        await sleep(300); 
        if (mainIcon) mainIcon.style.transform = 'translateY(0) rotate(0deg)';
        
        await chargeSupportMana();

        if(slot) slot.classList.remove('active'); 
        await sleep(200); 
        if (monster.hp <= 0) break;
    }

    if (monster.hp <= 0) { await handleVictory(type); return; }

    if (type !== 'chest') { 
        await sleep(400); if (monster.hp <= 0) { await handleVictory(type); return; }
        if (monster.statuses.stun > 0) { 
            addLog(`Quái vật đang bị <b style="color:orange">Choáng</b>, mất lượt phản công!`); 
            await sleep(500); 
        } else {
            addLog(`Quái vật phản công!`); 
            let mSprite = document.getElementById('monster-sprite');
            if (mSprite) mSprite.style.transform = 'translateY(30px)'; 
            
            await sleep(150);
            if(AudioEngine && typeof AudioEngine.hurt === 'function') AudioEngine.hurt(); 
            
            let mDmgMultiplier = monster.statuses.weaken > 0 ? 0.6 : 1; 
            let finalMAtk = Math.floor((monster.atk || 0) * mDmgMultiplier);
            player.hp -= finalMAtk; 
            spawnPopup('player-sprite-container', finalMAtk, 'dmg'); 
            triggerShake('player-sprite-container');
            
            if (Math.random() < 0.2) { 
                applyStatus(player, 'poison', 2); 
                addLog(`Quái vật cắn bạn trúng <b style="color:purple">Độc</b>!`); 
            }
            updateUI(); 
            await sleep(400); 
            if (mSprite) mSprite.style.transform = 'scale(1)'; 
            await sleep(200);
        }
    } else { await sleep(600); }
    
    gameLoop(); 
}

async function showStageClearAnim(text) {
    const banner = document.getElementById('stage-clear-banner');
    if(banner) { banner.innerText = text; banner.classList.add('show'); } await sleep(1500); 
    if(banner) { banner.classList.remove('show'); } await sleep(100); 
}

async function handleVictory(stageType) {
    let mSprite = document.getElementById('monster-sprite');
    if (mSprite) mSprite.style.opacity = '0'; 

    if (stageType === 'chest') {
        if(AudioEngine && typeof AudioEngine.levelUp === 'function') AudioEngine.levelUp(); 
        addLog("<b style='color:#ffcc00'>Đã mở Rương Báu!</b>");
        pendingRewardType = 'chest'; await showStageClearAnim("MỞ RƯƠNG!"); 
        if (isAutoSkill) { addLog("<b style='color:green'>Auto lấy kỹ năng Rương!</b>"); selectUpgrade(Object.keys(ACTIONS_LIB)[Math.floor(Math.random()*Object.keys(ACTIONS_LIB).length)]); return; }
        showRewardModal("🎁 PHẦN THƯỞNG TỪ RƯƠNG 🎁"); return;
    }
    if (stageType === 'boss') {
        bossEnrage = 0; 
        if(AudioEngine && typeof AudioEngine.levelUp === 'function') AudioEngine.levelUp(); 
        addLog("<b style='color:#ff9800'>Hạ gục Boss! Đã reset Cuồng Nộ.</b>");
        pendingRewardType = 'boss'; player.exp += 50; updateUI();
        await showStageClearAnim("BOSS BỊ TIÊU DIỆT!"); 
        if (isAutoSkill) { addLog("<b style='color:green'>Auto lấy kỹ năng Boss!</b>"); selectUpgrade(Object.keys(ACTIONS_LIB)[Math.floor(Math.random()*Object.keys(ACTIONS_LIB).length)]); return; }
        showRewardModal("👑 PHẦN THƯỞNG DIỆT BOSS 👑"); return;
    }

    addLog("<b style='color:green'>Chiến thắng! Nhận 20 EXP & 10 Vàng</b>");
    player.exp += 20; player.gold += 10; updateUI();
    if (player.exp >= player.nextExp) {
        if(AudioEngine && typeof AudioEngine.levelUp === 'function') AudioEngine.levelUp(); 
        pendingRewardType = 'level';
        await showStageClearAnim("LEVEL UP!"); 
        if (isAutoSkill) { addLog("<b style='color:green'>Auto lấy kỹ năng Cấp!</b>"); selectUpgrade(Object.keys(ACTIONS_LIB)[Math.floor(Math.random()*Object.keys(ACTIONS_LIB).length)]); return; }
        showRewardModal("🌟 LÊN CẤP! CHỌN KỸ NĂNG 🌟"); return;
    }
    await showStageClearAnim("STAGE CLEAR!"); showMapPhase(); 
}

function selectUpgrade(key) { if(AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click(); const existing = player.sequence.find(s => s.id === key); if (existing) { existing.level += 1; } else { player.sequence.push({ id: key, level: 1 }); } executeUpgradeCallback(); }
function executeUpgradeCallback() { if (pendingRewardType === 'level') { player.lv += 1; player.exp -= player.nextExp; player.nextExp += 25; player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.2)); } pendingRewardType = null; let lvlModal = document.getElementById('level-modal'); if(lvlModal) lvlModal.style.display = 'none'; renderActionBar(); updateUI(); showMapPhase(); }