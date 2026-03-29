// ==========================================
// TẬP TIN: js/ui.js
// CHỨC NĂNG: Giao diện, Drag & Drop, Cập nhật Máu/Năng lượng
// ==========================================

// --- CÁC HÀM ĐIỀU KHIỂN NÚT BẤM (CÀI ĐẶT / AUTO / TỐC ĐỘ) ---
function toggleSpeed() {
    gameSpeed = gameSpeed === 1 ? 2 : 1;
    let btn = document.getElementById('speed-btn');
    btn.innerText = `⏩ x${gameSpeed}`;
    if(gameSpeed === 2) btn.classList.add('active-state');
    else btn.classList.remove('active-state');
}

function toggleAuto() {
    isAutoSkill = !isAutoSkill;
    let btn = document.getElementById('auto-btn');
    if(isAutoSkill) {
        btn.classList.add('active-state');
        btn.innerText = '🤖 AUTO: BẬT';
    } else {
        btn.classList.remove('active-state');
        btn.innerText = '🤖 AUTO: TẮT';
    }
}

function openSettings() { document.getElementById('settings-modal').style.display = 'flex'; }
function closeSettings() { document.getElementById('settings-modal').style.display = 'none'; }
function confirmExit() { if (confirm("Bạn muốn thoát?")) location.reload(); }

// --- DRAG AND DROP LOGIC (KÉO THẢ ĐỘI HÌNH) ---
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("heroId", ev.target.id); }

function drop(ev) {
    ev.preventDefault();
    let heroId = ev.dataTransfer.getData("heroId");
    let element = document.getElementById(heroId);
    let targetZone = ev.target.closest('.drop-zone');
    
    if (targetZone) {
        // Nếu ô đã có Tướng, đá Tướng cũ về Bench
        if (targetZone.children.length > 0 && targetZone.children[0].id !== heroId) {
            document.getElementById('bench-container').appendChild(targetZone.children[0]);
        }
        targetZone.innerHTML = ''; 
        targetZone.appendChild(element);
        updateActiveTeam();
    }
}

function dropToBench(ev) {
    ev.preventDefault();
    let heroId = ev.dataTransfer.getData("heroId");
    let element = document.getElementById(heroId);
    if(ev.target.id === 'bench-container' || ev.target.closest('.bench-container')) {
        document.getElementById('bench-container').appendChild(element);
        updateActiveTeam();
    }
}

function updateActiveTeam() {
    for(let i = 0; i < 3; i++) {
        let zone = document.querySelector(`.drop-zone[data-slot="${i}"]`);
        if (zone && zone.children.length > 0 && zone.children[0].classList.contains('draggable-hero')) {
            let hId = zone.children[0].getAttribute('data-id');
            ACTIVE_TEAM[i] = SUPPORT_ROSTER.find(h => h.id === hId);
        } else {
            ACTIVE_TEAM[i] = null;
            if (zone) zone.innerHTML = 'Trống';
        }
    }
    // Render lại đội hình ngoài sảnh ngay lập tức (Nếu đang ở Hub)
    if (document.getElementById('hub-screen').style.display !== 'none') {
        const hubForm = document.querySelector('.formation-wrapper');
        if (hubForm) {
            hubForm.innerHTML = '<div class="form-main">🗡️</div>';
            ACTIVE_TEAM.forEach((hero, index) => {
                if(hero) hubForm.innerHTML += `<div class="form-supp" style="${SUPPORT_POSITIONS[index]}">${hero.icon}</div>`;
            });
        }
    }
}

function openTeamModal() {
    const bench = document.getElementById('bench-container');
    bench.innerHTML = '';
    
    // Render Tướng chưa được chọn vào Bench
    SUPPORT_ROSTER.forEach(hero => {
        if (!ACTIVE_TEAM.find(h => h && h.id === hero.id)) {
            bench.innerHTML += `<div class="draggable-hero" id="drag-${hero.id}" data-id="${hero.id}" draggable="true" ondragstart="drag(event)">${hero.icon}<span>${hero.name}</span></div>`;
        }
    });

    // Render Tướng đang dùng vào Drop Zones
    for(let i = 0; i < 3; i++) {
        let zone = document.querySelector(`.drop-zone[data-slot="${i}"]`);
        zone.innerHTML = '';
        if (ACTIVE_TEAM[i]) {
            let hero = ACTIVE_TEAM[i];
            zone.innerHTML = `<div class="draggable-hero" id="drag-${hero.id}" data-id="${hero.id}" draggable="true" ondragstart="drag(event)">${hero.icon}<span>${hero.name}</span></div>`;
        } else {
            zone.innerHTML = 'Trống';
        }
    }
    document.getElementById('team-modal').style.display = 'flex';
}
function closeTeamModal() { document.getElementById('team-modal').style.display = 'none'; }


// --- CÁC HÀM RENDER TRẬN ĐÁNH ---
function initTeamBattleUI() {
    const supportsContainer = document.getElementById('battle-supports-container');
    const skillsPanel = document.getElementById('skills-panel');
    
    supportsContainer.innerHTML = ''; 
    skillsPanel.innerHTML = '';

    ACTIVE_TEAM.forEach((hero, index) => {
        if(hero) {
            // Render Tướng đứng quanh Kiếm
            supportsContainer.innerHTML += `
                <div class="support-entity" id="supp-entity-${index}" style="${SUPPORT_POSITIONS[index]}">
                    <div class="support-icon">${hero.icon}</div>
                </div>
            `;
            // Render Nút Skill ở dưới
            skillsPanel.innerHTML += `
                <div class="skill-btn" id="skill-btn-${index}" onclick="manualCastSkill(${index})">
                    <div class="skill-icon-ui">${hero.icon}</div>
                    <div class="skill-cd-bar-ui"><div id="skill-cd-fill-${index}" class="skill-cd-fill-ui"></div></div>
                </div>
            `;
        } else {
            // Ô trống
            skillsPanel.innerHTML += `
                <div class="skill-btn" style="opacity: 0.2; cursor: not-allowed;">
                    <div class="skill-icon-ui">🔒</div>
                </div>
            `;
        }
    });
}

function updateUI() {
    // 1. Cập nhật thông số cơ bản (Level, Stage, Exp, Máu)
    document.getElementById('lv-val').innerText = player.lv;
    document.getElementById('stage-top-val').innerText = player.stage;
    document.getElementById('exp-bar').style.width = (player.exp / player.nextExp * 100) + '%';
    
    let p_hp = Math.max(0, player.hp); 
    let m_hp = Math.max(0, monster.hp);
    
    document.getElementById('player-hp-val').innerText = p_hp;
    document.getElementById('player-maxhp-val').innerText = player.maxHp;
    document.getElementById('player-mini-hp').style.width = (p_hp / player.maxHp * 100) + '%';
    
    document.getElementById('monster-hp-val').innerText = m_hp;
    document.getElementById('monster-maxhp-val').innerText = monster.maxHp;
    document.getElementById('monster-atk-val').innerText = monster.atk; 
    if(monster.maxHp > 0) document.getElementById('monster-mini-hp').style.width = (m_hp / monster.maxHp * 100) + '%';

    // 2. Cập nhật Skill CD Bar của ACTIVE_TEAM
    ACTIVE_TEAM.forEach((hero, index) => {
        if(hero) {
            let fillPercent = (hero.cdCurrent / hero.cdMax) * 100;
            let fillBarUI = document.getElementById(`skill-cd-fill-${index}`);
            let btnUI = document.getElementById(`skill-btn-${index}`);
            
            if (fillBarUI && btnUI) {
                fillBarUI.style.width = `${fillPercent}%`;
                if (hero.cdCurrent >= hero.cdMax) {
                    fillBarUI.style.background = 'var(--accent)'; 
                    btnUI.classList.add('ready');
                } else {
                    fillBarUI.style.background = 'var(--cd-color)'; 
                    btnUI.classList.remove('ready');
                }
            }
        }
    });

    // 3. RENDER ICONS TRẠNG THÁI (ĐỘC, CHOÁNG...)
    renderStatusIcons('player-sprite', player.statuses);
    renderStatusIcons('monster-sprite', monster.statuses);
}

function renderStatusIcons(containerId, statuses) {
    let container = document.getElementById(containerId);
    if(!container) return; // Fix lỗi null

    let statusDiv = container.querySelector('.status-container');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.className = 'status-container';
        container.appendChild(statusDiv);
    }
    
    statusDiv.innerHTML = '';
    if (statuses.poison > 0) statusDiv.innerHTML += `<div class="status-icon">☠️</div>`;
    if (statuses.stun > 0) statusDiv.innerHTML += `<div class="status-icon">💫</div>`;
    if (statuses.slow > 0) statusDiv.innerHTML += `<div class="status-icon">❄️</div>`;
    if (statuses.weaken > 0) statusDiv.innerHTML += `<div class="status-icon">📉</div>`;
}

function renderStageMap() {
    const container = document.getElementById('stage-dots-container');
    container.innerHTML = '';
    const currentPos = (player.stage - 1) % STAGES_PER_CHAPTER;
    for (let i = 0; i < STAGES_PER_CHAPTER; i++) {
        const dot = document.createElement('div'); dot.className = 'stage-dot';
        if (i < currentPos) dot.classList.add('completed');
        if (i === currentPos) dot.classList.add('active');
        const type = CHAPTER_LAYOUT[i];
        if (type === 'boss') dot.classList.add('boss');
        if (type === 'treasure') dot.classList.add('treasure');
        container.appendChild(dot);
    }
}

function renderActionBar() {
    const bar = document.getElementById('action-bar');
    bar.innerHTML = '';
    player.sequence.forEach((act, index) => {
        const slot = document.createElement('div'); slot.className = 'action-slot'; slot.id = `slot-${index}`;
        let caretHTML = act.level > 1 ? `<div class="carets">${'^'.repeat(act.level - 1)}</div>` : '';
        let teamTag = index === 0 ? `<div style="font-size:8px; color:var(--accent); position:absolute; top:2px;">ALL</div>` : '';
        slot.innerHTML = `${teamTag}<div style="margin-bottom: ${(act.level>1)?'8px':'0'}">${ACTIONS_LIB[act.id].icon}</div>${caretHTML}`;
        bar.appendChild(slot);
    });
}

function addLog(msg) {
    const log = document.getElementById('log');
    if(log) {
        log.innerHTML += `<div>> ${msg}</div>`;
        log.scrollTop = log.scrollHeight;
    }
}

function triggerShake(elementId) {
    const el = document.getElementById(elementId);
    if(el) {
        el.classList.remove('shake'); 
        void el.offsetWidth; // Trigger reflow
        el.classList.add('shake');
    }
}

function spawnPopup(targetId, val, type, skillName = null) {
    const target = document.getElementById(targetId);
    if(!target) return;

    const popup = document.createElement('div');
    if (skillName) {
        popup.className = 'popup-text popup-skill'; 
        popup.innerText = skillName;
    } else {
        popup.className = `popup-text popup-${type}`; 
        popup.innerText = type === 'dmg' ? `-${val}` : `+${val}`;
    }
    target.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
}

async function showStageClearAnim(text) {
    const banner = document.getElementById('stage-clear-banner');
    if(banner) {
        banner.innerText = text; 
        banner.classList.add('show');
    }
    const monsterSprite = document.getElementById('monster-sprite');
    if(monsterSprite) {
        monsterSprite.style.opacity = '0';
        monsterSprite.style.transform = 'scale(0.5)';
    }
    await sleep(1200); 
    if(banner) banner.classList.remove('show'); 
    await sleep(300); 
}

function showRewardModal(titleText) {
    document.getElementById('modal-title-text').innerText = titleText;
    const modal = document.getElementById('level-modal');
    const choicesDiv = document.getElementById('choices');
    choicesDiv.innerHTML = '';
    modal.style.display = 'flex';

    const availableKeys = Object.keys(ACTIONS_LIB).filter(key => {
        const existing = player.sequence.find(s => s.id === key);
        return !existing || existing.level < 4; 
    });

    const shuffled = availableKeys.sort(() => 0.5 - Math.random()).slice(0, 3);

    if (shuffled.length === 0) {
        const btn = document.createElement('button'); btn.className = 'choice-btn';
        btn.innerHTML = `<div class="choice-icon">💖</div><div class="choice-info"><b>Hồi Phục Tuyệt Đối</b><span>Hồi 100% HP</span></div>`;
        btn.onclick = () => { AudioEngine.click(); player.hp = player.maxHp; executeUpgradeCallback(); };
        choicesDiv.appendChild(btn); return;
    }

    shuffled.forEach(key => {
        const act = ACTIONS_LIB[key]; const existing = player.sequence.find(s => s.id === key);
        const nextLvl = existing ? existing.level + 1 : 1; const isUpgrade = existing ? true : false;
        const btn = document.createElement('button'); btn.className = 'choice-btn';
        
        let badge = isUpgrade ? `<div class="upgrade-badge">UPGRADE LV.${nextLvl}</div>` : '';
        let statInfo = [];
        if(act.dmg > 0) statInfo.push(`Gây ${act.dmg * nextLvl} sát thương`);
        if(act.heal > 0) statInfo.push(`Hồi ${act.heal * nextLvl} HP`);

        btn.innerHTML = `${badge}<div class="choice-icon">${act.icon}</div>
            <div class="choice-info"><b>${act.name} ${isUpgrade ? `(Lv.${nextLvl})` : '(Mới)'}</b><span>${statInfo.join(', ')}</span></div>`;
        btn.onclick = () => selectUpgrade(key);
        choicesDiv.appendChild(btn);
    });
}