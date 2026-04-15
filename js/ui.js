window.cameraMode = 'full';
window.currentCamScale = 0.6;
window.currentCamShakeX = 0;
window.currentCamShakeY = 0;

setTimeout(() => {
    if (GAME_IMAGES.mapPiece !== '') {
        document.documentElement.style.setProperty('--map-piece-img', `url('${GAME_IMAGES.mapPiece}')`);
    }
}, 100);

function updateCamera() {
    const pos = player.boardPos;
    let row, col;
    if (pos <= 8) { row = 1; col = pos + 1; }
    else if (pos <= 16) { row = pos - 7; col = 9; }
    else if (pos <= 24) { row = 9; col = 25 - pos; }
    else { row = 33 - pos; col = 1; }

    const boardSize = 700; 
    const tileSize = boardSize / 9;
    
    const cx = (col - 0.5) * tileSize;
    const cy = (row - 0.5) * tileSize;
    
    const dx = cx - (boardSize / 2);
    const dy = cy - (boardSize / 2);

    const boardWrapper = document.getElementById('monopoly-board-wrapper');
    if (boardWrapper) {
        boardWrapper.style.transform = `scale(${window.currentCamScale}) rotateX(50deg) translate(${-dx + window.currentCamShakeX}px, ${-dy + window.currentCamShakeY}px)`;
    }
}

function toggleSpeed() { gameSpeed = gameSpeed === 1 ? 2 : 1; let btn = document.getElementById('speed-btn'); btn.innerText = `⏩ x${gameSpeed}`; if(gameSpeed === 2) btn.classList.add('active-state'); else btn.classList.remove('active-state'); }
function toggleAuto() { 
    isAutoSkill = !isAutoSkill; 
    let btn = document.getElementById('auto-btn'); 
    if(isAutoSkill) { 
        btn.classList.add('active-state'); 
        btn.innerText = '🤖 AUTO: BẬT'; 
        if (document.getElementById('dice-container').style.display === 'flex') { rollDice('normal'); }
    } else { 
        btn.classList.remove('active-state'); 
        btn.innerText = '🤖 AUTO: TẮT'; 
    } 
}
function openSettings() { document.getElementById('settings-modal').style.display = 'flex'; }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }
function confirmExit() { if (confirm("Bạn muốn thoát?")) location.reload(); }

function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("heroId", ev.target.id); }
function drop(ev) { ev.preventDefault(); let heroId = ev.dataTransfer.getData("heroId"); let element = document.getElementById(heroId); let targetZone = ev.target.closest('.drop-zone'); if (targetZone) { if (targetZone.children.length > 0 && targetZone.children[0].id !== heroId) { document.getElementById('bench-container').appendChild(targetZone.children[0]); } targetZone.innerHTML = ''; targetZone.appendChild(element); updateActiveTeam(); } }
function dropToBench(ev) { ev.preventDefault(); let heroId = ev.dataTransfer.getData("heroId"); let element = document.getElementById(heroId); if(ev.target.id === 'bench-container' || ev.target.closest('.bench-container')) { document.getElementById('bench-container').appendChild(element); updateActiveTeam(); } }

function updateActiveTeam() { 
    for(let i = 0; i < 3; i++) { 
        let zone = document.querySelector(`.drop-zone[data-slot="${i}"]`); 
        if (zone && zone.children.length > 0 && zone.children[0].classList.contains('draggable-hero')) { 
            ACTIVE_TEAM[i] = SUPPORT_ROSTER.find(h => h.id === zone.children[0].getAttribute('data-id')); 
        } else { 
            ACTIVE_TEAM[i] = null; if (zone) zone.innerHTML = 'Trống'; 
        } 
    } 
    if (document.getElementById('hub-screen').style.display !== 'none') { 
        const hubForm = document.querySelector('.formation-wrapper'); 
        if (hubForm) { 
            let mainDisplay = GAME_IMAGES.mainHub !== '' ? `<img src="${GAME_IMAGES.mainHub}" class="char-img">` : '🗡️';
            hubForm.innerHTML = `<div class="form-main">${mainDisplay}</div>`; 
            ACTIVE_TEAM.forEach((hero, index) => { 
                if(hero) {
                    let displayChar = hero.img !== '' ? `<img src="${hero.img}" class="char-img">` : hero.icon;
                    hubForm.innerHTML += `<div class="form-supp" style="${SUPPORT_POSITIONS[index]}">${displayChar}</div>`; 
                }
            }); 
        } 
    } 
}

function openTeamModal() { 
    const bench = document.getElementById('bench-container'); bench.innerHTML = ''; 
    SUPPORT_ROSTER.forEach(hero => { 
        if (!ACTIVE_TEAM.find(h => h && h.id === hero.id)) {
            let displayChar = hero.img !== '' ? `<img src="${hero.img}" class="char-img">` : hero.icon;
            bench.innerHTML += `<div class="draggable-hero" id="drag-${hero.id}" data-id="${hero.id}" draggable="true" ondragstart="drag(event)">${displayChar}<span>${hero.name}</span></div>`; 
        }
    }); 
    for(let i = 0; i < 3; i++) { 
        let zone = document.querySelector(`.drop-zone[data-slot="${i}"]`); zone.innerHTML = ''; 
        if (ACTIVE_TEAM[i]) { 
            let hero = ACTIVE_TEAM[i]; 
            let displayChar = hero.img !== '' ? `<img src="${hero.img}" class="char-img">` : hero.icon;
            zone.innerHTML = `<div class="draggable-hero" id="drag-${hero.id}" data-id="${hero.id}" draggable="true" ondragstart="drag(event)">${displayChar}<span>${hero.name}</span></div>`; 
        } else { zone.innerHTML = 'Trống'; }
    } 
    
    let mainImgHtml = GAME_IMAGES.mainHub !== '' ? `<img src="${GAME_IMAGES.mainHub}" class="char-img">` : '🗡️<br><span style="font-size:10px">MAIN</span>';
    document.querySelector('.main-hero-fixed').innerHTML = mainImgHtml;
    
    document.getElementById('team-modal').style.display = 'flex'; 
}
function closeTeamModal() { document.getElementById('team-modal').style.display = 'none'; }

function initTeamBattleUI() {
    const supportsContainer = document.getElementById('battle-supports-container'); const skillsPanel = document.getElementById('skills-panel');
    supportsContainer.innerHTML = ''; skillsPanel.innerHTML = '';
    ACTIVE_TEAM.forEach((hero, index) => {
        if(hero) {
            let displayChar = hero.img !== '' ? `<img src="${hero.img}" class="char-img">` : hero.icon;
            supportsContainer.innerHTML += `<div class="support-entity" id="supp-entity-${index}" style="${SUPPORT_POSITIONS[index]}"><div class="support-icon">${displayChar}</div></div>`;
            skillsPanel.innerHTML += `<div class="skill-btn" id="skill-btn-${index}" onclick="manualCastSkill(${index})"><div class="skill-icon-ui">${displayChar}</div><div class="skill-cd-bar-ui"><div id="skill-cd-fill-${index}" class="skill-cd-fill-ui"></div></div></div>`;
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

    const btnLow = document.getElementById('btn-dice-low'); const badgeLow = document.getElementById('badge-low');
    const btnHigh = document.getElementById('btn-dice-high'); const badgeHigh = document.getElementById('badge-high');
    if(btnLow) { if(player.inventory.diceLow > 0) { btnLow.classList.add('active'); badgeLow.style.display = 'flex'; badgeLow.innerText = player.inventory.diceLow; } else { btnLow.classList.remove('active'); badgeLow.style.display = 'none'; } }
    if(btnHigh) { if(player.inventory.diceHigh > 0) { btnHigh.classList.add('active'); badgeHigh.style.display = 'flex'; badgeHigh.innerText = player.inventory.diceHigh; } else { btnHigh.classList.remove('active'); badgeHigh.style.display = 'none'; } }

    renderStatusIcons('player-sprite-container', player.statuses); renderStatusIcons('monster-sprite', monster.statuses);

    // --- ĐÃ THÊM: UPDATE THANH MÁU TRÊN MAP LIÊN TỤC THEO MÁU THẬT ---
    let mapHpFill = document.getElementById('map-player-hp-fill');
    if (mapHpFill) {
        let hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
        let hpColor = hpPercent > 50 ? 'var(--cd-color)' : (hpPercent > 20 ? '#ff9800' : 'var(--hp-color)');
        mapHpFill.style.width = hpPercent + '%';
        mapHpFill.style.backgroundColor = hpColor;
    }
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
        
        let sLevel = player.shrines[index];
        let sIcon = sLevel === 0 ? '' : (sLevel === 1 ? '⛩️' : (sLevel === 2 ? '🏯' : '🕍'));
        let shrineHtml = (!tile.isCorner && sLevel > 0) ? `<div class="shrine-slot ${posClass}">${sIcon}</div>` : '';
        
        dot.innerHTML = tile.icon + shrineHtml; 

        // --- ĐÃ THÊM: GẮN THANH MÁU VÀO Ô NGƯỜI CHƠI ĐANG ĐỨNG ---
        if (index === player.boardPos) {
            dot.classList.add('active');
            let hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
            let hpColor = hpPercent > 50 ? 'var(--cd-color)' : (hpPercent > 20 ? '#ff9800' : 'var(--hp-color)');
            
            dot.innerHTML += `
                <div class="map-hp-bar" id="map-player-hp-wrap">
                    <div id="map-player-hp-fill" style="width: ${hpPercent}%; background-color: ${hpColor};"></div>
                </div>
            `;
        }

        container.appendChild(dot);
    });
    document.getElementById('stage-top-val').innerText = `VÒNG ${player.lap}`;
    if(document.getElementById('map-boss-label-ui')) document.getElementById('map-boss-label-ui').innerText = bossEnrage > 0 ? `TRÙM CUỐI (Nộ: ${bossEnrage})` : 'TRÙM CUỐI';
    
    updateCamera();
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
    let target = document.getElementById(targetId); 
    if (targetId === 'player-sprite-container' && document.getElementById('combat-view').style.display === 'none') {
        target = document.querySelector('.stage-dot.active');
    }
    if(!target) return;

    const popup = document.createElement('div');
    const offsetX = (Math.random() - 0.5) * 50; 
    const offsetY = (Math.random() - 0.5) * 30;

    if (skillName) { 
        popup.className = 'popup-text popup-skill'; popup.innerText = skillName; 
    } else { 
        popup.className = `popup-text popup-${type}`; popup.innerText = type === 'dmg' ? `-${val}` : `+${val}`; 
    }
    
    popup.style.left = `calc(50% + ${offsetX}px)`;
    popup.style.top = `calc(50% + ${offsetY}px)`;
    
    if (target.classList.contains('stage-dot')) { popup.style.transform = `translateZ(40px)`; }

    target.appendChild(popup); setTimeout(() => popup.remove(), 800);
}

function openShop() {
    if(AudioEngine && typeof AudioEngine.levelUp === 'function') AudioEngine.levelUp(); 
    const modal = document.getElementById('shop-modal');
    document.getElementById('shop-gold-display').innerText = player.gold;
    renderShopItems();
    modal.style.display = 'flex';
}

function closeShop() { if(AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click(); document.getElementById('shop-modal').style.display = 'none'; showMapPhase(); }

function refreshShop() {
    if (player.gold >= 10) {
        player.gold -= 10; document.getElementById('shop-gold-display').innerText = player.gold; updateUI();
        if(AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click(); renderShopItems();
    } else { addLog("<b style='color:red'>Không đủ vàng làm mới!</b>"); }
}

function renderShopItems() {
    const container = document.getElementById('shop-items-container'); container.innerHTML = '';
    const shuffled = [...SHOP_DATABASE].sort(() => 0.5 - Math.random()).slice(0, 3); 
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
    player.gold -= price; if(AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click();
    document.getElementById('shop-gold-display').innerText = player.gold; 
    
    if (id === 'heal') { 
        player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.4)); 
        spawnPopup('player-sprite-container', Math.floor(player.maxHp * 0.4), 'heal'); 
    }
    else if (id === 'diceLow') { player.inventory.diceLow++; }
    else if (id === 'diceHigh') { player.inventory.diceHigh++; }
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
        btn.onclick = () => { if(AudioEngine && typeof AudioEngine.click === 'function') AudioEngine.click(); player.hp = player.maxHp; executeUpgradeCallback(); }; choicesDiv.appendChild(btn); return;
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