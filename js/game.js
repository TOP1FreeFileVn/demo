function startBattle() {
    AudioEngine.init(); AudioEngine.click();
    document.getElementById('hub-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('hub-screen').style.display = 'none';
        document.getElementById('battle-screen').style.display = 'flex';
        initTeamBattleUI(); renderStageMap(); renderActionBar(); updateUI(); 
        showMapPhase(); 
    }, 500);
}

function showMapPhase() {
    document.getElementById('combat-view').style.display = 'none';
    document.getElementById('stage-dots-container').style.display = 'grid';
    document.getElementById('center-map-boss').style.display = 'flex';
    document.getElementById('dice-container').style.display = 'flex'; 
}

function addShrineBuff(percent) {
    player.shrineBuff += percent;
    let oldMaxHp = player.maxHp; player.maxHp = Math.floor(BASE_PLAYER_HP * (1 + player.shrineBuff)); player.hp += (player.maxHp - oldMaxHp); updateUI();
}

async function rollDice() {
    if (isRolling) return;
    isRolling = true; AudioEngine.click();

    if (player.lap === 25) {
        addLog(`<b style="color:red; font-size:14px;">🚨 TỬ CHIẾN VÒNG 25 🚨</b>`);
        document.getElementById('monopoly-board-wrapper').style.boxShadow = "0 0 30px red";
        document.getElementById('stage-dots-container').style.background = "rgba(255,0,0,0.2)";
        for(let i=0; i<32; i++) {
            if(!BOARD_TILES[i].isCorner && (BOARD_TILES[i].type === 'event' || BOARD_TILES[i].type === 'empty' || BOARD_TILES[i].type === 'trap')) {
                BOARD_TILES[i] = { type: 'trap', icon: '🔥', name: 'Dung Nham' };
            }
        }
        renderStageMap();
    }

    const diceUI1 = document.getElementById('dice-result-1'); const diceUI2 = document.getElementById('dice-result-2'); const btnRoll = document.getElementById('btn-roll');
    btnRoll.style.opacity = '0.5'; btnRoll.innerText = 'ĐANG LĂN...';

    let d1 = 1, d2 = 1;
    for(let i=0; i<10; i++) {
        d1 = Math.floor(Math.random() * 6) + 1; d2 = Math.floor(Math.random() * 6) + 1; 
        diceUI1.innerText = d1; diceUI2.innerText = d2; await sleep(100);
    }
    
    let totalSteps = d1 + d2;
    addLog(`Đổ được <b style="color:var(--accent)">${d1} + ${d2} = ${totalSteps}</b> điểm!`);

    await sleep(600);
    btnRoll.style.opacity = '1'; btnRoll.innerText = 'ĐỔ XÚC XẮC';
    let passedStart = false;

    for(let step = 0; step < totalSteps; step++) {
        player.boardPos++;
        if(player.boardPos >= BOARD_TILES.length) { 
            player.boardPos = 0; player.lap++; 
            if (step < totalSteps - 1) passedStart = true;
            
            // XÓA BÀN CỜ RESET LẠI MỖI VÒNG (Không mất đền thờ vì đền thờ lưu ở player.shrines)
            for(let j=0; j<32; j++) {
                if(!BOARD_TILES[j].isCorner) BOARD_TILES[j] = generateRandomTile();
            }
            addLog(`<b style="color:green">Hoàn thành vòng! Bàn cờ đã được xáo trộn.</b>`);
        }
        renderStageMap(); AudioEngine.click(); await sleep(200);
    }
    
    if (passedStart) {
        addLog(`<b style="color:green">Đi ngang Trại: +20% HP, +50 Vàng!</b>`);
        let heal = Math.floor(player.maxHp * 0.2); player.hp = Math.min(player.maxHp, player.hp + heal); player.gold += 50; 
        spawnPopup('player-sprite-container', heal, 'heal'); updateUI(); await sleep(500);
    }

    isRolling = false; 
    
    if ((passedStart || player.boardPos === 0) && player.lap % 2 === 0) {
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
    
    // --- 1. XỬ LÝ LỚP ĐỀN THỜ (SHRINE) NẰM NGOÀI BÀN CỜ ---
    if (!tile.isCorner && player.shrines[pos] > 0) {
        if (player.shrines[pos] === 1) {
            addLog("<b style='color:#9c27b0'>Trùng Phùng! Đền Thờ Lv1 -> Lv2 (+2% Chỉ số) & +50 Vàng</b>");
            player.shrines[pos] = 2; player.gold += 50; addShrineBuff(0.01); 
            spawnPopup('player-sprite-container', 50, 'heal', '🪙 +50 Vàng'); renderStageMap(); await sleep(800);
        } else if (player.shrines[pos] === 2) {
            addLog("<b style='color:#9c27b0'>Hoàn Mỹ! Đền Thờ Lv2 -> Lv3 (+10% Chỉ số) & Nhận Kỹ Năng</b>");
            player.shrines[pos] = 3; addShrineBuff(0.08); 
            renderStageMap(); pendingRewardType = 'event'; showRewardModal("🕍 QUÀ ĐỀN THỜ TỐI THƯỢNG 🕍");
            return; // Dừng tại đây, bỏ qua Tile để tránh đụng Modal
        } else if (player.shrines[pos] === 3) { 
            addLog("<b style='color:#9c27b0'>Viếng thăm Đền Thờ Max: Nhận 20 Vàng!</b>"); 
            player.gold += 20; updateUI(); await sleep(800); 
        }
    }
    // Xây đền mới nếu dẫm trúng đất trống
    else if (!tile.isCorner && player.shrines[pos] === 0 && tile.type === 'empty') {
        addLog("<b style='color:#9c27b0'>Cắm Cờ! Xây Đền Thờ Lv1 (+1% Chỉ số)</b>");
        player.shrines[pos] = 1; addShrineBuff(0.01); spawnPopup('player-sprite-container', 0, 'skill', '⛩️ +1% STATS');
        renderStageMap(); await sleep(800); showMapPhase();
        return; // Đã xây đền thì xong lượt
    }

    // --- 2. XỬ LÝ LỚP BÀN CỜ CƠ BẢN ---
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
        else if (r < 90) { addLog("<b style='color:green'>Gacha: Trúng Thẻ Kỹ Năng!</b>"); pendingRewardType = 'event'; showRewardModal("🎰 TẾ ĐÀN: NHẬN KỸ NĂNG 🎰"); }
        else { player.hp -= 20; spawnPopup('player-sprite-container', 20, 'dmg'); triggerShake('player-sprite-container'); addLog("<b style='color:red'>Gacha: Bị sét đánh mất 20 HP!</b>"); updateUI(); await sleep(1000); showMapPhase(); }
    }
    else if (tile.type === 'boss_gate') {
        if(player.lap >= 25) { chooseFightBoss(); } else { document.getElementById('boss-gate-modal').style.display = 'flex'; }
    }
    else if (tile.type === 'empty') {
        // Đã có đền thờ rồi nên bỏ qua đất trống
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
    else if (tile.type === 'event') { addLog("Bất ngờ nhặt được thẻ kỹ năng!"); pendingRewardType = 'event'; showRewardModal("❓ SỰ KIỆN: NHẬN KỸ NĂNG ❓"); }
    else { spawnNextStage(tile.type); }
}

function chooseSkipBoss() { AudioEngine.click(); document.getElementById('boss-gate-modal').style.display = 'none'; bossEnrage++; addLog(`<b style="color:red">Đã bỏ qua Boss. Nhận 1 tầng Cuồng Nộ (Hiện tại: ${bossEnrage} tầng)</b>`); renderStageMap(); showMapPhase(); }
function chooseFightBoss() { AudioEngine.click(); document.getElementById('boss-gate-modal').style.display = 'none'; spawnNextStage('boss'); }

function spawnNextStage(tileType) {
    document.getElementById('stage-dots-container').style.display = 'none'; document.getElementById('center-map-boss').style.display = 'none'; document.getElementById('dice-container').style.display = 'none'; document.getElementById('combat-view').style.display = 'flex';
    document.getElementById('monster-sprite').style.display = 'flex'; document.getElementById('monster-sprite').style.opacity = '1'; document.getElementById('monster-sprite').style.transform = 'scale(1)';
    monster.statuses = { poison: 0, stun: 0, slow: 0, weaken: 0 }; monster.currentTileType = tileType; 
    if (tileType === 'chest') {
        monster.maxHp = 1; monster.hp = 1; monster.atk = 0; monster.icon = '🎁'; document.getElementById('enemy-name').innerText = "Rương Báu"; document.getElementById('enemy-name').style.color = "#ffcc00"; document.getElementById('monster-atk-val').style.display = "none";
    } else {
        const isBoss = (tileType === 'boss'); document.getElementById('monster-atk-val').style.display = "inline";
        const hpGrowthMultiplier = 1 + (player.lap * 0.30); const atkGrowthMultiplier = 1 + (player.lap * 0.15); 
        let calculatedHp = Math.floor(BASE_MONSTER.hp * hpGrowthMultiplier); let calculatedAtk = Math.floor(BASE_MONSTER.atk * atkGrowthMultiplier);
        if (isBoss) { calculatedHp = Math.floor(calculatedHp * 2); let enrageMultiplier = 1 + (bossEnrage * 0.1); calculatedAtk = Math.floor((calculatedAtk * 1.5) * enrageMultiplier); }
        monster.maxHp = calculatedHp; monster.hp = monster.maxHp; monster.atk = calculatedAtk;
        const icons = isBoss ? ['🐲', '🧌', '🤖', '👽', '🧛‍♂️'] : ['👾', '🐍', '🐺', '🦂', '🕷️', '🦇']; monster.icon = icons[Math.floor(Math.random() * icons.length)];
        document.getElementById('enemy-name').innerText = isBoss ? `TRÙM CUỐI (Nộ: ${bossEnrage})` : `Quái Vòng ${player.lap}`; document.getElementById('enemy-name').style.color = "#d32f2f"; addLog(`Đụng độ ${isBoss ? 'BOSS ' : ''}${monster.icon}!`);
    }
    document.getElementById('monster-icon').innerText = monster.icon; updateUI(); gameLoop();
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

async function chargeSupportMana() {
    if (player.statuses.slow > 0) return; 
    let triggered = false;
    for (let j = 0; j < ACTIVE_TEAM.length; j++) { 
        let hero = ACTIVE_TEAM[j]; 
        if (hero && hero.cdCurrent < hero.cdMax) { 
            hero.cdCurrent++; 
            updateUI();
            if (hero.cdCurrent >= hero.cdMax) { await sleep(150); await executeSupportSkill(j); triggered = true; }
        } 
    }
    if (triggered) await sleep(300);
}

async function gameLoop() {
    if (player.hp <= 0) { AudioEngine.hurt(); addLog("<b style='color:red'>GAME OVER! Tổ đội đã gục ngã.</b>"); setTimeout(() => { alert("Tải lại trang để chơi lại."); location.reload(); }, 1000); return; }
    const type = monster.currentTileType || 'monster';

    let pLogs = processStatuses(player, 'player-sprite-container'); let mLogs = processStatuses(monster, 'monster-sprite');
    pLogs.forEach(l => addLog(l)); mLogs.forEach(l => addLog(l)); updateUI(); await sleep(200);

    if (player.hp <= 0) { gameLoop(); return; }
    if (monster.hp <= 0) { await handleVictory(type); return; }

    addLog("Vũ khí chính bắt đầu chuỗi hành động...");
    
    for (let i = 0; i < 5; i++) {
        if (monster.hp <= 0) break; 
        
        // ĐÃ SỬA: BREAK ngay lập tức nếu hết thẻ kỹ năng, không cần chạy qua slot trống
        if (i >= player.sequence.length) { 
            break; 
        }

        const slot = document.getElementById(`slot-${i}`); slot.classList.add('active'); 
        if (player.statuses.stun > 0) { addLog(`Vũ khí chính đang bị <b style="color:orange">Choáng</b>, mất lượt!`); await sleep(400); slot.classList.remove('active'); continue; }

        const actionObj = player.sequence[i]; const action = ACTIONS_LIB[actionObj.id]; const skillLevel = actionObj.level;
        let dmgMultiplier = player.statuses.weaken > 0 ? 0.6 : 1; let shrineMultiplier = 1 + player.shrineBuff; 

        document.getElementById('battle-main-icon').style.transform = 'translateY(-30px) rotate(15deg)'; await sleep(150);
        if (monster.hp > 0) {
            AudioEngine.attack(); 
            let mainDmg = type === 'chest' ? 1 : Math.floor((action.dmg * skillLevel) * dmgMultiplier * shrineMultiplier);
            if (mainDmg > 0) { monster.hp -= mainDmg; spawnPopup('monster-sprite', mainDmg, 'dmg'); if (type !== 'chest') triggerShake('monster-sprite'); }
            if (action.heal > 0) { let healAmount = Math.floor((action.heal * skillLevel) * shrineMultiplier); player.hp = Math.min(player.maxHp, player.hp + healAmount); spawnPopup('player-sprite-container', healAmount, 'heal'); }
        }
        updateUI(); await sleep(300); document.getElementById('battle-main-icon').style.transform = 'translateY(0) rotate(0deg)';
        
        await chargeSupportMana();

        slot.classList.remove('active'); await sleep(200); 
        if (monster.hp <= 0) break;
    }

    if (monster.hp <= 0) { await handleVictory(type); return; }

    if (type !== 'chest') { 
        await sleep(400); if (monster.hp <= 0) { await handleVictory(type); return; }
        if (monster.statuses.stun > 0) { addLog(`Quái vật đang bị <b style="color:orange">Choáng</b>, mất lượt phản công!`); await sleep(500); } 
        else {
            addLog(`Quái vật phản công!`); document.getElementById('monster-sprite').style.transform = 'translateY(30px)'; await sleep(150);
            AudioEngine.hurt(); let mDmgMultiplier = monster.statuses.weaken > 0 ? 0.6 : 1; let finalMAtk = Math.floor(monster.atk * mDmgMultiplier);
            player.hp -= finalMAtk; spawnPopup('player-sprite-container', finalMAtk, 'dmg'); triggerShake('player-sprite-container');
            if (Math.random() < 0.2) { applyStatus(player, 'poison', 2); addLog(`Quái vật cắn bạn trúng <b style="color:purple">Độc</b>!`); }
            updateUI(); await sleep(400); document.getElementById('monster-sprite').style.transform = 'scale(1)'; await sleep(200);
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
    document.getElementById('monster-sprite').style.opacity = '0'; 
    if (stageType === 'chest') {
        AudioEngine.levelUp(); addLog("<b style='color:#ffcc00'>Đã mở Rương Báu!</b>");
        pendingRewardType = 'chest'; await showStageClearAnim("MỞ RƯƠNG!"); showRewardModal("🎁 PHẦN THƯỞNG TỪ RƯƠNG 🎁"); return;
    }
    if (stageType === 'boss') {
        bossEnrage = 0; AudioEngine.levelUp(); addLog("<b style='color:#ff9800'>Hạ gục Boss! Đã reset Cuồng Nộ.</b>");
        pendingRewardType = 'boss'; player.exp += 50; updateUI();
        await showStageClearAnim("BOSS BỊ TIÊU DIỆT!"); showRewardModal("👑 PHẦN THƯỞNG DIỆT BOSS 👑"); return;
    }

    addLog("<b style='color:green'>Chiến thắng! Nhận 20 EXP & 10 Vàng</b>");
    player.exp += 20; player.gold += 10; updateUI();
    if (player.exp >= player.nextExp) {
        AudioEngine.levelUp(); pendingRewardType = 'level';
        await showStageClearAnim("LEVEL UP!"); showRewardModal("🌟 LÊN CẤP! CHỌN KỸ NĂNG 🌟"); return;
    }
    await showStageClearAnim("STAGE CLEAR!"); showMapPhase(); 
}

function selectUpgrade(key) { AudioEngine.click(); const existing = player.sequence.find(s => s.id === key); if (existing) { existing.level += 1; } else { player.sequence.push({ id: key, level: 1 }); } executeUpgradeCallback(); }
function executeUpgradeCallback() { if (pendingRewardType === 'level') { player.lv += 1; player.exp -= player.nextExp; player.nextExp += 25; player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.2)); } pendingRewardType = null; document.getElementById('level-modal').style.display = 'none'; renderActionBar(); updateUI(); showMapPhase(); }