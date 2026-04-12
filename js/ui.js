function toggleSpeed() { gameSpeed = gameSpeed === 1 ? 2 : 1; let btn = document.getElementById('speed-btn'); btn.innerText = `⏩ x${gameSpeed}`; if(gameSpeed === 2) btn.classList.add('active-state'); else btn.classList.remove('active-state'); }
function toggleAuto() { isAutoSkill = !isAutoSkill; let btn = document.getElementById('auto-btn'); if(isAutoSkill) { btn.classList.add('active-state'); btn.innerText = '🤖 AUTO: BẬT'; } else { btn.classList.remove('active-state'); btn.innerText = '🤖 AUTO: TẮT'; } }
function openSettings() { document.getElementById('settings-modal').style.display = 'flex'; }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }
function confirmExit() { if (confirm("Bạn muốn thoát?")) location.reload(); }

function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("heroId", ev.target.id); }
function drop(ev) { ev.preventDefault(); let heroId = ev.dataTransfer.getData("heroId"); let element = document.getElementById(heroId); let targetZone = ev.target.closest('.drop-zone'); if (targetZone) { if (targetZone.children.length > 0 && targetZone.children[0].id !== heroId) { document.getElementById('bench-container').appendChild(targetZone.children[0]); } targetZone.innerHTML = ''; targetZone.appendChild(element); updateActiveTeam(); } }
function dropToBench(ev) { ev.preventDefault(); let heroId = ev.dataTransfer.getData("heroId"); let element = document.getElementById(heroId); if(ev.target.id === 'bench-container' || ev.target.closest('.bench-container')) { document.getElementById('bench-container').appendChild(element); updateActiveTeam(); } }
function updateActiveTeam() { for(let i = 0; i < 3; i++) { let zone = document.querySelector(`.drop-zone[data-slot="${i}"]`); if (zone && zone.children.length > 0 && zone.children[0].classList.contains('draggable-hero')) { ACTIVE_TEAM[i] = SUPPORT_ROSTER.find(h => h.id === zone.children[0].getAttribute('data-id')); } else { ACTIVE_TEAM[i] = null; if (zone) zone.innerHTML = 'Trống'; } } if (document.getElementById('hub-screen').style.display !== 'none') { const hubForm = document.querySelector('.formation-wrapper'); if (hubForm) { hubForm.innerHTML = '<div class="form-main">🗡️</div>'; ACTIVE_TEAM.forEach((hero, index) => { if(hero) hubForm.innerHTML += `<div class="form-supp" style="${SUPPORT_POSITIONS[index]}">${hero.icon}</div>`; }); } } }
function openTeamModal() { const bench = document.getElementById('bench-container'); bench.innerHTML = ''; SUPPORT_ROSTER.forEach(hero => { if (!ACTIVE_TEAM.find(h => h && h.id === hero.id)) bench.innerHTML += `<div class="draggable-hero" id="drag-${hero.id}" data-id="${hero.id}" draggable="true" ondragstart="drag(event)">${hero.icon}<span>${hero.name}</span></div>`; }); for(let i = 0; i < 3; i++) { let zone = document.querySelector(`.drop-zone[data-slot="${i}"]`); zone.innerHTML = ''; if (ACTIVE_TEAM[i]) { let hero = ACTIVE_TEAM[i]; zone.innerHTML = `<div class="draggable-hero" id="drag-${hero.id}" data-id="${hero.id}" draggable="true" ondragstart="drag(event)">${hero.icon}<span>${hero.name}</span></div>`; } else zone.innerHTML = 'Trống'; } document.getElementById('team-modal').style.display = 'flex'; }
function closeTeamModal() { document.getElementById('team-modal').style.display = 'none'; }

function initTeamBattleUI() {
    const supportsContainer = document.getElementById('battle-supports-container'); const skillsPanel = document.getElementById('skills-panel');
    supportsContainer.innerHTML = ''; skillsPanel.innerHTML = '';
    ACTIVE_TEAM.forEach((hero, index) => {
        if(hero) {
            supportsContainer.innerHTML += `<div class="support-entity" id="supp-entity-${index}" style="${SUPPORT_POSITIONS[index]}"><div class="support-icon">${hero.icon}</div></div>`;
            skillsPanel.innerHTML += `<div class="skill-btn" id="skill-btn-${index}" onclick="manualCastSkill(${index})"><div class="skill-icon-ui">${hero.icon}</div><div class="skill-cd-bar-ui"><div id="skill-cd-fill-${index}" class="skill-cd-fill-ui"></div></div></div>`;
        } else {
            skillsPanel.innerHTML += `<div class="skill-btn" style="opacity: 0.2; cursor: not-allowed;"><div class="skill-icon-ui">🔒</div></div>`;
        }
    });
}

function updateUI() {
    document.getElementById('lv-val').innerText = player.lv; document.getElementById('exp-bar').style.width = (player.exp / player.nextExp * 100) + '%';
    if(document.getElementById('gold-hub')) document.getElementById('gold-hub').innerText = player.gold;
    document.getElementById('gold-val').innerText = player.gold;
    if(document.getElementById('shrine-buff-val')) document.getElementById('shrine-buff-val').innerText = Math.round(player.shrineBuff * 100);

    let p_hp = Math.max(0, player.hp); let m_hp = Math.max(0, monster.hp);
    document.getElementById('player-hp-val').innerText = p_hp; document.getElementById('player-maxhp-val').innerText = player.maxHp; document.getElementById('player-mini-hp').style.width = (p_hp / player.maxHp * 100) + '%';
    document.getElementById('monster-hp-val').innerText = m_hp; document.getElementById('monster-maxhp-val').innerText = monster.maxHp; document.getElementById('monster-atk-val').innerText = monster.atk; 
    if(monster.maxHp > 0) document.getElementById('monster-mini-hp').style.width = (m_hp / monster.maxHp * 100) + '%';
    
    ACTIVE_TEAM.forEach((hero, index) => {
        if(hero) {
            let fillPercent = (hero.cdCurrent / hero.cdMax) * 100; let fillBarUI = document.getElementById(`skill-cd-fill-${index}`); let btnUI = document.getElementById(`skill-btn-${index}`);
            if (fillBarUI && btnUI) { fillBarUI.style.width = `${fillPercent}%`; if (hero.cdCurrent >= hero.cdMax) { fillBarUI.style.background = 'var(--accent)'; btnUI.classList.add('ready'); } else { fillBarUI.style.background = 'var(--cd-color)'; btnUI.classList.remove('ready'); } }
        }
    });

    renderStatusIcons('player-sprite-container', player.statuses); renderStatusIcons('monster-sprite', monster.statuses);
}

function renderStatusIcons(containerId, statuses) {
    let container = document.getElementById(containerId); if(!container) return;
    let statusDiv = container.querySelector('.status-container');
    if (!statusDiv) { statusDiv = document.createElement('div'); statusDiv.className = 'status-container'; container.appendChild(statusDiv); }
    statusDiv.innerHTML = '';
    if (statuses.poison > 0) statusDiv.innerHTML += `<div class="status-icon">☠️</div>`; if (statuses.stun > 0) statusDiv.innerHTML += `<div class="status-icon">💫</div>`;
    if (statuses.slow > 0) statusDiv.innerHTML += `<div class="status-icon">❄️</div>`; if (statuses.weaken > 0) statusDiv.innerHTML += `<div class="status-icon">📉</div>`;
}

function renderStageMap() {
    const container = document.getElementById('stage-dots-container'); container.innerHTML = '';
    BOARD_TILES.forEach((tile, index) => {
        const dot = document.createElement('div'); dot.className = 'stage-dot';
        if (tile.isCorner) dot.classList.add('corner-tile');
        
        let row, col, posClass;
        if (index <= 8) { row = 1; col = index + 1; posClass = 'shrine-top'; } 
        else if (index <= 16) { row = index - 7; col = 9; posClass = 'shrine-right'; } 
        else if (index <= 24) { row = 9; col = 25 - index; posClass = 'shrine-bottom'; } 
        else { row = 33 - index; col = 1; posClass = 'shrine-left'; } 
        
        dot.style.gridRow = row; dot.style.gridColumn = col;
        if (index < player.boardPos && player.lap === 1) dot.classList.add('completed');
        if (index === player.boardPos) dot.classList.add('active');
        
        // Vẽ Đền Thờ bên ngoài (Chỉ vẽ nếu có cấp độ > 0 và không phải góc)
        let sLevel = player.shrines[index];
        let sIcon = sLevel === 0 ? '' : (sLevel === 1 ? '⛩️' : (sLevel === 2 ? '🏯' : '🕍'));
        let shrineHtml = (!tile.isCorner && sLevel > 0) ? `<div class="shrine-slot ${posClass}">${sIcon}</div>` : '';
        
        dot.innerHTML = tile.icon + shrineHtml; 
        container.appendChild(dot);
    });
    document.getElementById('stage-top-val').innerText = `VÒNG ${player.lap}`;
    if(document.getElementById('map-boss-label-ui')) document.getElementById('map-boss-label-ui').innerText = bossEnrage > 0 ? `TRÙM CUỐI (Nộ: ${bossEnrage})` : 'TRÙM CUỐI';
}

function renderActionBar() {
    const bar = document.getElementById('action-bar'); bar.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const slot = document.createElement('div'); slot.className = 'action-slot'; slot.id = `slot-${i}`;
        if (i < player.sequence.length) {
            let act = player.sequence[i];
            slot.classList.add('filled');
            let caretHTML = act.level > 1 ? `<div class="carets">${'^'.repeat(act.level - 1)}</div>` : '';
            let teamTag = i === 0 ? `<div style="font-size:8px; color:var(--accent); position:absolute; top:2px;">ALL</div>` : '';
            slot.innerHTML = `${teamTag}<div style="margin-bottom: ${(act.level>1)?'8px':'0'}">${ACTIONS_LIB[act.id].icon}</div>${caretHTML}`;
        } else {
            slot.innerHTML = `<span style="font-size:10px; color:#5d4037;">TRỐNG</span>`;
        }
        bar.appendChild(slot);
    }
}

function addLog(msg) { const log = document.getElementById('log'); if(log) { log.innerHTML += `<div>> ${msg}</div>`; log.scrollTop = log.scrollHeight; } }
function triggerShake(elementId) { const el = document.getElementById(elementId); if(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } }
function spawnPopup(targetId, val, type, skillName = null) {
    const target = document.getElementById(targetId); if(!target) return;
    const popup = document.createElement('div');
    if (skillName) { popup.className = 'popup-text popup-skill'; popup.innerText = skillName; } else { popup.className = `popup-text popup-${type}`; popup.innerText = type === 'dmg' ? `-${val}` : `+${val}`; }
    target.appendChild(popup); setTimeout(() => popup.remove(), 800);
}

function openShop() {
    AudioEngine.levelUp(); 
    const modal = document.getElementById('shop-modal');
    document.getElementById('shop-gold-display').innerText = player.gold;
    renderShopItems();
    modal.style.display = 'flex';
}

function closeShop() { AudioEngine.click(); document.getElementById('shop-modal').style.display = 'none'; showMapPhase(); }

function refreshShop() {
    if (player.gold >= 10) {
        player.gold -= 10; 
        document.getElementById('shop-gold-display').innerText = player.gold; 
        updateUI(); AudioEngine.click(); renderShopItems();
    } else { addLog("<b style='color:red'>Không đủ vàng làm mới!</b>"); }
}

function renderShopItems() {
    const container = document.getElementById('shop-items-container'); container.innerHTML = '';
    const shuffled = [...SHOP_DATABASE].sort(() => 0.5 - Math.random()).slice(0, 2); 
    shuffled.forEach(item => {
        const canAfford = player.gold >= item.price;
        container.innerHTML += `
            <div class="shop-item">
                <div class="shop-item-info">
                    <div class="shop-item-icon">${item.icon}</div>
                    <div class="shop-item-details"><b>${item.name}</b><span>${item.desc}</span></div>
                </div>
                <button class="shop-btn-buy" ${canAfford ? '' : 'disabled'} onclick="buyShopItem('${item.id}', ${item.price})">${item.price} 🪙</button>
            </div>
        `;
    });
}

function buyShopItem(id, price) {
    if (player.gold < price) return;
    player.gold -= price; AudioEngine.click();
    document.getElementById('shop-gold-display').innerText = player.gold; 
    
    if (id === 'heal') { 
        player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.4)); 
        spawnPopup('player-sprite-container', Math.floor(player.maxHp * 0.4), 'heal'); 
    }
    else if (id === 'skill') { 
        document.getElementById('shop-modal').style.display = 'none';
        updateUI(); pendingRewardType = 'shop_event'; showRewardModal("🃏 MUA THẺ KỸ NĂNG 🃏"); return;
    }
    updateUI(); renderShopItems(); 
}

function showRewardModal(titleText) {
    document.getElementById('modal-title-text').innerText = titleText;
    const modal = document.getElementById('level-modal'); const choicesDiv = document.getElementById('choices');
    choicesDiv.innerHTML = ''; modal.style.display = 'flex';
    
    const availableKeys = Object.keys(ACTIONS_LIB).filter(key => { 
        const existing = player.sequence.find(s => s.id === key); 
        if (existing && existing.level < 4) return true;
        if (!existing && player.sequence.length < 5) return true;
        return false;
    });

    const shuffled = availableKeys.sort(() => 0.5 - Math.random()).slice(0, 3);
    if (shuffled.length === 0) {
        const btn = document.createElement('button'); btn.className = 'choice-btn';
        btn.innerHTML = `<div class="choice-icon">💖</div><div class="choice-info"><b>Hồi Phục Tuyệt Đối</b><span>Hồi 100% HP (Full thẻ)</span></div>`;
        btn.onclick = () => { AudioEngine.click(); player.hp = player.maxHp; executeUpgradeCallback(); }; choicesDiv.appendChild(btn); return;
    }
    shuffled.forEach(key => {
        const act = ACTIONS_LIB[key]; const existing = player.sequence.find(s => s.id === key);
        const nextLvl = existing ? existing.level + 1 : 1; const isUpgrade = existing ? true : false;
        const btn = document.createElement('button'); btn.className = 'choice-btn';
        let badge = isUpgrade ? `<div class="upgrade-badge">UPGRADE LV.${nextLvl}</div>` : ''; let statInfo = [];
        if(act.dmg > 0) statInfo.push(`Gây ${act.dmg * nextLvl} sát thương`); if(act.heal > 0) statInfo.push(`Hồi ${act.heal * nextLvl} HP`);
        btn.innerHTML = `${badge}<div class="choice-icon">${act.icon}</div><div class="choice-info"><b>${act.name} ${isUpgrade ? `(Lv.${nextLvl})` : '(Mới)'}</b><span>${statInfo.join(', ')}</span></div>`;
        btn.onclick = () => selectUpgrade(key); choicesDiv.appendChild(btn);
    });
}