// ==========================================
// TẬP TIN: js/game.js
// CHỨC NĂNG: Xử lý Core Gameplay Logic, Vòng lặp chiến đấu, Tính sát thương
// ==========================================

// --- KHỞI TẠO TRẬN ĐÁNH ---
function startBattle() {
    AudioEngine.init(); 
    AudioEngine.click();
    
    // Ẩn Màn hình Hub, Hiện Màn hình Battle
    document.getElementById('hub-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('hub-screen').style.display = 'none';
        document.getElementById('battle-screen').style.display = 'flex';
        
        // Setup UI & Bắt đầu
        initTeamBattleUI();
        spawnNextStage(); 
        renderStageMap(); 
        renderActionBar(); 
        updateUI(); 
        gameLoop(); // Kích hoạt vòng lặp chính
    }, 500);
}

// --- TẠO QUÁI VẬT MỚI CHO STAGE ---
function spawnNextStage() {
    const currentPos = (player.stage - 1) % STAGES_PER_CHAPTER;
    const type = CHAPTER_LAYOUT[currentPos];

    // Reset UI quái vật
    document.getElementById('monster-sprite').style.opacity = '1';
    document.getElementById('monster-sprite').style.transform = 'scale(1)';

    // Đặt lại hiệu ứng trạng thái của quái về 0
    monster.statuses = { poison: 0, stun: 0, slow: 0, weaken: 0 };

    if (type === 'treasure') {
        monster.maxHp = 1; 
        monster.hp = 1; 
        monster.atk = 0; 
        monster.icon = '🎁';
        document.getElementById('enemy-name').innerText = "Rương Báu";
        document.getElementById('enemy-name').style.color = "#ffcc00";
        document.getElementById('monster-atk-val').style.display = "none";
        addLog(`Stage ${player.stage}: Một chiếc Rương Báu xuất hiện!`);
    } else {
        const isBoss = (type === 'boss');
        document.getElementById('monster-atk-val').style.display = "inline";
        
        // Scale sức mạnh quái theo Stage
        const hpGrowthMultiplier = 1 + (player.stage * 0.20); 
        const atkGrowthMultiplier = 1 + (player.stage * 0.10); 

        let calculatedHp = Math.floor(BASE_MONSTER.hp * hpGrowthMultiplier);
        let calculatedAtk = Math.floor(BASE_MONSTER.atk * atkGrowthMultiplier);

        // Nếu là Boss thì trâu bò hơn
        if (isBoss) { 
            calculatedHp = Math.floor(calculatedHp * 2); 
            calculatedAtk = Math.floor(calculatedAtk * 1.5); 
        }

        monster.maxHp = calculatedHp; 
        monster.hp = monster.maxHp; 
        monster.atk = calculatedAtk;
        
        // Random Icon quái
        const icons = isBoss ? ['🐲', '🧌', '🤖'] : ['👾', '🐍', '🐺', '🦂'];
        monster.icon = icons[Math.floor(Math.random() * icons.length)];
        
        document.getElementById('enemy-name').innerText = isBoss ? `BOSS Stage ${player.stage}` : `Quái Stage ${player.stage}`;
        document.getElementById('enemy-name').style.color = "#d32f2f";
        addLog(`Stage ${player.stage}: ${isBoss ? 'BOSS ' : ''}${monster.icon} xuất hiện!`);
    }
    document.getElementById('monster-icon').innerText = monster.icon;
    updateUI();
}

// --- KÍCH HOẠT KỸ NĂNG SUPPORT BẰNG TAY TỪ UI ---
function manualCastSkill(index) {
    let hero = ACTIVE_TEAM[index];
    // Chỉ kích hoạt nếu Tướng tồn tại, năng lượng đầy và quái còn sống
    if (hero && hero.cdCurrent >= hero.cdMax && monster.hp > 0) {
        AudioEngine.click();
        executeSupportSkill(index);
    }
}

// --- THỰC THI KỸ NĂNG SUPPORT ---
async function executeSupportSkill(index) {
    let hero = ACTIVE_TEAM[index];
    let btnUI = document.getElementById(`skill-btn-${index}`);
    
    // Tắt trạng thái glow trên UI và Reset năng lượng
    if(btnUI) btnUI.classList.remove('ready');
    hero.cdCurrent = 0; 
    
    // Hiệu ứng Visual nhô lên của Tướng
    let entityEl = document.getElementById(`supp-entity-${index}`);
    if (entityEl) {
        let currentTransform = entityEl.style.transform;
        entityEl.style.transform = `${currentTransform} translateY(-15px) scale(1.3)`;
    }
    
    // Tung chiêu và ghi log (Các hiệu ứng Độc, Choáng... được apply bên trong triggerSkill)
    spawnPopup(`supp-entity-${index}`, 0, 'skill', hero.skillName);
    let logStr = hero.triggerSkill(monster, player); 
    addLog(`<b style="color:var(--accent)">[Skill]</b> ${hero.icon} ${hero.name} ${logStr}`);
    
    updateUI();

    // Rút Visual của Tướng về vị trí cũ
    setTimeout(() => {
        if(document.getElementById(`supp-entity-${index}`)) {
            let currentTransform = document.getElementById(`supp-entity-${index}`).style.transform;
            document.getElementById(`supp-entity-${index}`).style.transform = currentTransform.replace('translateY(-15px) scale(1.3)', '');
        }
    }, 500);
}

// --- NẠP NĂNG LƯỢNG CHO SUPPORT & CHẠY AUTO ---
async function processSupportEnergy() {
    // Nếu Main Hero bị Chậm (Slow), Support sẽ không được nạp Năng lượng
    if (player.statuses.slow > 0) return; 

    // Tăng năng lượng cho dàn Support hiện tại
    for (let j = 0; j < ACTIVE_TEAM.length; j++) {
        let hero = ACTIVE_TEAM[j];
        if (hero && hero.cdCurrent < hero.cdMax) {
            hero.cdCurrent++; 
        }
    }
    updateUI(); 
    
    // Nếu đang bật AUTO, quét xem ai đầy thì xả skill ngay
    if (isAutoSkill && monster.hp > 0) {
        for (let j = 0; j < ACTIVE_TEAM.length; j++) {
            let hero = ACTIVE_TEAM[j];
            if (hero && hero.cdCurrent >= hero.cdMax) {
                await executeSupportSkill(j);
                await sleep(300); // Khoảng nghỉ để đỡ loạn màn hình
            }
        }
    }
}

// ==========================================
// VÒNG LẶP CHIẾN ĐẤU CHÍNH (THE CORE LOOP)
// ==========================================
async function gameLoop() {
    // 1. KIỂM TRA MÁU NGƯỜI CHƠI
    if (player.hp <= 0) {
        AudioEngine.hurt(); 
        addLog("<b style='color:red'>GAME OVER! Tổ đội đã gục ngã.</b>");
        setTimeout(() => { alert("Tải lại trang để chơi lại."); location.reload(); }, 1000);
        return;
    }

    const currentPos = (player.stage - 1) % STAGES_PER_CHAPTER;
    const type = CHAPTER_LAYOUT[currentPos];

    // 2. XỬ LÝ TRẠNG THÁI ĐẦU HIỆP (Độc trừ máu, Giảm đếm ngược lượt)
    let pLogs = processStatuses(player, 'player-sprite');
    let mLogs = processStatuses(monster, 'monster-sprite');
    pLogs.forEach(l => addLog(l)); 
    mLogs.forEach(l => addLog(l));
    updateUI();
    await sleep(200);

    // Kiểm tra an toàn: Nhỡ bị Độc chết trước khi đánh
    if (player.hp <= 0) {
        gameLoop(); return; 
    }
    if (monster.hp <= 0) { 
        await handleVictory(type); 
        return; 
    }

    addLog("Vũ khí chính bắt đầu chuỗi hành động...");
    
    // 3. DUYỆT CHUỖI HÀNH ĐỘNG CỦA VŨ KHÍ CHÍNH
    for (let i = 0; i < player.sequence.length; i++) {
        if (monster.hp <= 0) break; // Quái chết -> Ngắt chuỗi

        // Nếu người chơi bị Choáng, bỏ qua việc vung kiếm!
        if (player.statuses.stun > 0) {
            addLog(`Vũ khí chính đang bị <b style="color:orange">Choáng</b>, mất lượt!`);
            await sleep(400);
            continue;
        }

        const actionObj = player.sequence[i];
        const action = ACTIONS_LIB[actionObj.id];
        const skillLevel = actionObj.level;
        
        const slot = document.getElementById(`slot-${i}`);
        slot.classList.add('active'); // Highlight ô UI đang thực thi
        
        // Tính toán sát thương bị suy yếu (nếu có)
        let dmgMultiplier = player.statuses.weaken > 0 ? 0.6 : 1;

        // --- HÀNH ĐỘNG 1: ĐÒN HỘI ĐỒNG (Cả Support cùng lao lên) ---
        if (i === 0) {
            // Main chém trước
            document.getElementById('battle-main-icon').style.transform = 'translateX(30px) rotate(15deg)';
            await sleep(150);
            
            if (monster.hp > 0) {
                AudioEngine.attack();
                let mainDmg = type === 'treasure' ? 1 : Math.floor((action.dmg * skillLevel) * dmgMultiplier);
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
            
            // Từng Support lao lên chém bồi
            for (let j = 0; j < ACTIVE_TEAM.length; j++) {
                let supp = ACTIVE_TEAM[j];
                if (supp && monster.hp > 0) {
                    let suppEl = document.getElementById(`supp-entity-${j}`);
                    if(suppEl) suppEl.style.transform = 'translateX(30px)';
                    await sleep(150);
                    
                    if (monster.hp <= 0) break; 
                    
                    AudioEngine.attack();
                    let sDmg = type === 'treasure' ? 1 : Math.floor(supp.baseDmg * dmgMultiplier);
                    monster.hp -= sDmg; 
                    spawnPopup('monster-sprite', sDmg, 'dmg'); 
                    if (type !== 'treasure') triggerShake('monster-sprite');
                    updateUI();
                    
                    await sleep(300);
                    if(suppEl) suppEl.style.transform = 'translateX(0)';
                }
            }
        } 
        // --- CÁC HÀNH ĐỘNG SAU: Chỉ Vũ khí chính chém ---
        else {
            document.getElementById('battle-main-icon').style.transform = 'translateX(30px) rotate(15deg)';
            await sleep(150);
            
            if (monster.hp > 0) {
                AudioEngine.attack();
                if (action.dmg > 0) {
                    let finalDmg = type === 'treasure' ? 1 : Math.floor((action.dmg * skillLevel) * dmgMultiplier); 
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
        
        // Gọi hàm nạp Năng lượng cho Support sau mỗi thẻ đánh
        await processSupportEnergy();
        await sleep(200); 

        if (monster.hp <= 0) { 
            await handleVictory(type); 
            return; 
        }
    }

    // 4. CHỐT CHẶN AN TOÀN (Lỗi Quái Bất Tử)
    if (monster.hp <= 0) { 
        await handleVictory(type); 
        return; 
    }

    // 5. LƯỢT CỦA QUÁI VẬT PHẢN CÔNG
    if (type !== 'treasure') { 
        await sleep(400);
        
        // Kiểm tra an toàn trước khi quái kịp đánh
        if (monster.hp <= 0) { 
            await handleVictory(type); 
            return; 
        }

        // KIỂM TRA CHOÁNG CỦA QUÁI
        if (monster.statuses.stun > 0) {
            addLog(`Quái vật đang bị <b style="color:orange">Choáng</b>, mất lượt phản công!`);
            await sleep(500);
        } else {
            addLog(`Quái vật phản công!`);
            document.getElementById('monster-sprite').style.transform = 'translateX(-40px)';
            await sleep(150);
            
            AudioEngine.hurt(); 
            
            // Tính sát thương Quái đánh ra (Giảm 40% nếu quái bị Suy yếu)
            let mDmgMultiplier = monster.statuses.weaken > 0 ? 0.6 : 1;
            let finalMAtk = Math.floor(monster.atk * mDmgMultiplier);

            player.hp -= finalMAtk;
            spawnPopup('player-sprite', finalMAtk, 'dmg');
            triggerShake('player-sprite');
            
            // Quái có 20% khả năng gây Độc cho người chơi
            if (Math.random() < 0.2) {
                applyStatus(player, 'poison', 2);
                addLog(`Quái vật cắn bạn trúng <b style="color:purple">Độc</b>!`);
            }

            updateUI();
            
            await sleep(400);
            document.getElementById('monster-sprite').style.transform = 'translateX(0)';
            await sleep(200);
        }
    } else {
        // Nếu là Rương báu, chờ lâu một chút rồi qua màn
        await sleep(600); 
    }

    // Xoay vòng lặp lại
    gameLoop(); 
}

// --- XỬ LÝ CHIẾN THẮNG (QUA ẢI / NHẬN THƯỞNG) ---
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
        player.exp += 50; 
        updateUI();
        await showStageClearAnim("BOSS BỊ TIÊU DIỆT!");
        showRewardModal("👑 PHẦN THƯỞNG DIỆT BOSS 👑");
        return;
    }

    // Quái thường
    addLog("<b style='color:green'>Chiến thắng! Nhận 20 EXP</b>");
    player.exp += 20; 
    updateUI();

    // Lên cấp
    if (player.exp >= player.nextExp) {
        AudioEngine.levelUp(); 
        pendingRewardType = 'level';
        await showStageClearAnim("LEVEL UP!");
        showRewardModal("🌟 LÊN CẤP! CHỌN KỸ NĂNG 🌟");
        return;
    }

    // Nếu không lên cấp, tự động qua ải
    await showStageClearAnim("STAGE CLEAR!");
    player.stage += 1; 
    spawnNextStage(); 
    renderStageMap(); 
    gameLoop();
}

// --- CHỌN PHẦN THƯỞNG (GỌI TỪ MODAL UI) ---
function selectUpgrade(key) {
    AudioEngine.click(); 
    const existing = player.sequence.find(s => s.id === key);
    
    // Gộp thẻ để tăng Level nếu đã có, hoặc thêm mới nếu chưa có
    if (existing) {
        existing.level += 1; 
    } else {
        player.sequence.push({ id: key, level: 1 });
    }
    
    executeUpgradeCallback();
}

// --- HOÀN TẤT UPGRADE VÀ CHẠY TIẾP GAME ---
function executeUpgradeCallback() {
    if (pendingRewardType === 'level') {
        player.lv += 1; 
        player.exp -= player.nextExp; 
        player.nextExp += 25;
        // Hồi 20% Máu tối đa khi lên cấp
        player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.2));
    }
    
    pendingRewardType = null; 
    player.stage += 1; 
    
    document.getElementById('level-modal').style.display = 'none';
    
    renderStageMap(); 
    renderActionBar(); 
    spawnNextStage(); 
    updateUI(); 
    
    gameLoop(); // Chạy lại vòng lặp
}