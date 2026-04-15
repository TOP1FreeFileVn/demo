// ==============================================
// 🎨 KHU VỰC THAY ẢNH NHÂN VẬT & QUÁI 
// Dán link ảnh (.png/.gif) vào giữa 2 dấu nháy đơn ''. 
// Nếu bỏ trống '', game sẽ tự dùng EMOJI mặc định.
// ==============================================
const GAME_IMAGES = {
    // --- MAIN CHARACTER ---
    mainHub: 'image_9x16__7_-removebg-preview.png',
    mainIdle: 'image_9x16__7_-removebg-preview.png',
    mainAtk: 'image_9x16__7_-removebg-preview.png',
    mainSkill: 'image_9x16__7_-removebg-preview.png',
    
    // --- MAP & ENEMIES ---
    mapPiece: 'image_9x16__7_-removebg-preview.png',
    bossIdle: '',
    bossAtk: '',
    monsterIdle: '',
    monsterAtk: '',
    chest: ''
};

// ==============================================
// 📐 CÀI ĐẶT SCALE ẢNH
// Chỉnh số ở đây, không cần sửa CSS hay HTML.
// 1.0 = 100% (mặc định), 1.2 = to hơn 20%, 0.8 = nhỏ hơn 20%
// Áp dụng cho cả Hub lẫn trong trận.
// ==============================================
const IMAGE_SCALE = {
    // --- MAIN CHARACTER ---
    mainHub:   1.0,   // Ảnh main ở màn Hub
    mainIdle:  1.0,   // Ảnh main đứng yên trong trận
    mainAtk:   1.0,   // Ảnh main lúc tấn công
    mainSkill: 1.0,   // Ảnh main lúc dùng chiêu

    // --- SUPPORT HEROES (theo id) ---
    frieran:   1.5,   // Scale cho Frieran
    tarot:     1.5,   // Scale cho Tarot
    elaine:    1.5,   // Scale cho Elaine
};

// Helper nội bộ — không cần chỉnh
function _scaleStyle(scale, origin = 'bottom center') {
    const s = scale ?? 1.0;
    if (s === 1.0) return '';
    return `style="transform: scale(${s}); transform-origin: ${origin};"`;
}
function _scaleImgTag(src, scale, origin = 'bottom center') {
    const s = scale ?? 1.0;
    const styleAttr = s !== 1.0 ? ` style="transform: scale(${s}); transform-origin: ${origin};"` : '';
    return `<img src="${src}" class="char-img"${styleAttr}>`;
}

const SUPPORT_ROSTER = [
    // =============================================
    // FRIERAN
    // =============================================
    { 
        id: 'frieran', 
        icon: '', 
        imgIdle: 'image_9x16-removebg-preview.png',   
        imgAtk: 'image_9x16-removebg-preview.png',    
        imgSkill: 'image_9x16-removebg-preview.png',  
        name: 'Frieran', 
        baseDmg: 4, 
        cdMax: 4, 
        cdCurrent: 0, 
        skillName: 'Thanh Tẩy Linh Hồn',
        passive: (playerRef) => {
            const debuffs = ['poison', 'stun', 'slow', 'weaken'];
            for (let d of debuffs) {
                if (playerRef.statuses[d] > 0) {
                    playerRef.statuses[d] = 0;
                    spawnPopup('player-sprite-container', 0, 'skill', '🔔 Thanh Tẩy');
                    addLog(`<b style="color:#9c27b0">[Frieran - Chuông Pha Lê]</b> Xóa hiệu ứng <b>${d}</b> cho tổ đội!`);
                    break;
                }
            }
        },
        triggerSkill: (target, playerRef) => { 
            let dmg = 30; 
            target.hp -= dmg; 
            applyStatus(target, 'weaken', 3);
            spawnPopup('monster-sprite', dmg, 'dmg'); 
            triggerShake('monster-sprite');
            addLog(`<b style="color:#9c27b0">[Frieran]</b> "Để tôi giúp các bạn thanh tẩy sự hỗn độn này."`);
            return `tung Thanh Tẩy Linh Hồn! Gây <b style="color:#ff4d4d">${dmg}</b> sát thương phép!`; 
        } 
    },

    // =============================================
    // TAROT
    // =============================================
    { 
        id: 'tarot', 
        icon: '🃏', 
        imgIdle: 'image_9x16__4_-removebg-previewt.png',   
        imgAtk: 'image_9x16__4_-removebg-previewt.png',    
        imgSkill: 'image_9x16__4_-removebg-previewt.png',  
        name: 'Tarot', 
        baseDmg: 6, 
        cdMax: 5, 
        cdCurrent: 0,
        skillName: 'Phán Quyết Vận Mệnh',
        passiveProc: (target) => {
            if (Math.random() < 0.20) {
                applyStatus(target, 'weaken', 1);
                spawnPopup('monster-sprite', 0, 'skill', '🎯 Đánh Dấu!');
                addLog(`<b style="color:#4da3ff">[Tarot - Nhãn Quan]</b> Đánh Dấu! Địch mất 30% DEF trong 1 hiệp!`);
            }
        },
        triggerSkill: (target, playerRef) => { 
            const roll = Math.random();
            if (roll < 0.333) {
                let dmg = 60;
                target.hp -= dmg;
                spawnPopup('monster-sprite', dmg, 'dmg');
                triggerShake('monster-sprite');
                return `rút Lá Đỏ &#x1F7E5; THE TOWER! Gây <b style="color:#ff4d4d">${dmg}</b> sát thương phép!`;
            } else if (roll < 0.666) {
                playerRef._starShield = true;
                spawnPopup('player-sprite-container', 0, 'skill', '🌟 Giáp Ngôi Sao!');
                return `rút Lá Xanh &#x1F7E6; THE STAR! Chặn 1 đòn tấn công tiếp theo!`;
            } else {
                playerRef._chariotBuff = true;
                spawnPopup('player-sprite-container', 0, 'skill', '⚡ CHARIOT!');
                return `rút Lá Vàng &#x1F7E8; THE CHARIOT! Tăng <b style="color:#ffcc00">100% ATK</b> chuỗi kế tiếp!`;
            }
        } 
    },

    // =============================================
    // ELAINE
    // =============================================
    { 
        id: 'elaine', 
        icon: '🌿', 
        imgIdle: 'image_9x16__6_-removebg-preview.png',   
        imgAtk: 'image_9x16__6_-removebg-preview.png',    
        imgSkill: 'image_9x16__6_-removebg-preview.png',  
        name: 'Elaine', 
        baseDmg: 3, 
        cdMax: 4, 
        cdCurrent: 0, 
        skillName: 'Low Cortisol',
        _atkStack: 0,
        passive: (playerRef) => {
            if (playerRef.hp < playerRef.maxHp) {
                let healAmount = Math.floor(playerRef.maxHp * 0.02);
                playerRef.hp = Math.min(playerRef.maxHp, playerRef.hp + healAmount);
                spawnPopup('player-sprite-container', healAmount, 'heal');
            }
        },
        triggerSkill: (target, playerRef) => { 
            let missingHpRatio = 1 - (playerRef.hp / playerRef.maxHp);
            let totalHeal = Math.floor(playerRef.maxHp * 0.15) + Math.floor(Math.floor(playerRef.maxHp * 0.15) * missingHpRatio);
            playerRef.hp = Math.min(playerRef.maxHp, playerRef.hp + totalHeal);
            spawnPopup('player-sprite-container', totalHeal, 'heal');

            let elaine = SUPPORT_ROSTER.find(h => h.id === 'elaine');
            let stackMsg = '';
            if (elaine && elaine._atkStack < 3) {
                elaine._atkStack++;
                playerRef._elaineAtkBuff = elaine._atkStack * 0.20;
                spawnPopup('player-sprite-container', 0, 'skill', `🌱 ATK +${elaine._atkStack * 20}%`);
                stackMsg = `Stack ATK ${elaine._atkStack}/3`;
            } else { stackMsg = `ATK Buff MAX!`; }
            return `tung Low Cortisol! Hồi <b style="color:#4caf50">${totalHeal}</b> HP. ${stackMsg}`; 
        } 
    }
];

// ==============================================
// LOGIC KHỞI TẠO BẢN ĐỒ & DỮ LIỆU
// ==============================================
let gameSpeed = 1; 
let isAutoSkill = false;
const sleep = (ms) => new Promise(res => setTimeout(res, ms / gameSpeed));
const SUPPORT_POSITIONS = [ 
    'left: -20px; top: 70px;',      // Support 1: Dưới bên trái
    'left: 50%; top: 100px; transform: translateX(-50%);', // Support 2: Dưới chính giữa (thấp nhất)
    'right: -20px; top: 70px;'      // Support 3: Dưới bên phải
];
let ACTIVE_TEAM = [SUPPORT_ROSTER[0], null, SUPPORT_ROSTER[2]]; 

const ACTIONS_LIB = {
    'attack': { icon: '⚔️', name: 'Chém', desc: 'Gây 8 sát thương', dmg: 8, heal: 0 },
    'apple': { icon: '🍎', name: 'Ăn táo', desc: 'Hồi 15 máu', dmg: 0, heal: 15 },
    'shield': { icon: '🛡️', name: 'Phòng thủ', desc: 'Gây 3 dmg, hồi 8 HP', dmg: 3, heal: 8 },
    'kick': { icon: '🦶', name: 'Cú đá', desc: 'Gây 15 sát thương', dmg: 15, heal: 0 }
};

let BOARD_TILES = new Array(32);
function generateRandomTile() {
    let r = Math.random() * 100;
    if(r < 40) return { type: 'empty', icon: '🟩', name: 'Đất Trống' }; 
    if(r < 70) return { type: 'monster', icon: '👹', name: 'Quái Vật' }; 
    if(r < 85) return { type: 'event', icon: '❓', name: 'Sự Kiện' }; 
    if(r < 95) return { type: 'trap', icon: '🪤', name: 'Cạm Bẫy' }; 
    return { type: 'forge', icon: '⚒️', name: 'Lò Rèn' }; 
}

function generateBoard() {
    for(let i=0; i<32; i++) {
        if(i===0) BOARD_TILES[0] = { type: 'start', icon: '⛺', name: 'Trại Khởi Đầu', isCorner: true };
        else if(i===8) BOARD_TILES[8] = { type: 'spring', icon: '♨️', name: 'Suối Nước Nóng', isCorner: true };
        else if(i===16) BOARD_TILES[16] = { type: 'gacha', icon: '🎰', name: 'Tế Đàn Xổ Số', isCorner: true };
        else if(i===24) BOARD_TILES[24] = { type: 'boss_gate', icon: '⛩️', name: 'Cổng Boss', isCorner: true };
        else BOARD_TILES[i] = generateRandomTile();
    }
}
generateBoard();

let pendingRewardType = null; 
let isRolling = false;
let bossEnrage = 0; 
const BASE_PLAYER_HP = 120; 

const player = { 
    hp: 120, maxHp: 120, lv: 1, exp: 0, nextExp: 40, gold: 50, boardPos: 0, lap: 1, shrineBuff: 0, 
    shrines: new Array(32).fill(0),
    inventory: { diceLow: 0, diceHigh: 0 },
    sequence: [{id: 'attack', level: 1}], 
    statuses: { poison: 0, stun: 0, slow: 0, weaken: 0 },
    _starShield: false, _chariotBuff: false, _elaineAtkBuff: 0 
};

const BASE_MONSTER = { hp: 60, atk: 15 };
let monster = { hp: 60, maxHp: 60, atk: 15, icon: '👾', currentTileType: 'monster', statuses: { poison: 0, stun: 0, slow: 0, weaken: 0 } };

function applyStatus(target, type, duration) {
    if(duration === -1) { target.statuses[type] = 0; return; } 
    target.statuses[type] = Math.max(target.statuses[type] || 0, duration); 
    let icon = type === 'poison' ? '☠️' : type === 'stun' ? '💫' : type === 'slow' ? '❄️' : '📉';
    spawnPopup(target === monster ? 'monster-sprite' : 'player-sprite-container', 0, 'skill', `${icon}`);
}

function processStatuses(target, targetId) {
    let logs = [];
    if (target.statuses.poison > 0) {
        let poisonDmg = Math.floor(target.maxHp * 0.05) + 3; target.hp -= poisonDmg;
        spawnPopup(targetId, poisonDmg, 'dmg'); target.statuses.poison--; 
        logs.push(`${target === monster ? 'Quái vật' : 'Tổ đội'} mất ${poisonDmg} HP do <b style="color:purple">Trúng Độc</b>.`);
    }
    if (target.statuses.stun > 0) target.statuses.stun--;
    if (target.statuses.slow > 0) target.statuses.slow--;
    if (target.statuses.weaken > 0) target.statuses.weaken--;
    return logs;
}

const SHOP_DATABASE = [
    { id: 'heal',     icon: '💊', name: 'Thuốc Hồi Sinh',  desc: 'Hồi 40% HP tối đa',         price: 30 },
    { id: 'diceLow',  icon: '🎲', name: 'Xúc Xắc Chậm',    desc: 'Đảm bảo đi 2-6 ô',            price: 20 },
    { id: 'diceHigh', icon: '🎯', name: 'Xúc Xắc Nhanh',   desc: 'Đảm bảo đi 7-12 ô',           price: 25 },
    { id: 'skill',    icon: '🃏', name: 'Thẻ Kỹ Năng',      desc: 'Nhận 1 kỹ năng ngẫu nhiên',   price: 40 }
];