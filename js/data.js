let gameSpeed = 1; 
let isAutoSkill = false;
const sleep = (ms) => new Promise(res => setTimeout(res, ms / gameSpeed));

const SUPPORT_POSITIONS = [ 'left: -5px; top: 15px;', 'left: 50%; top: -25px; transform: translateX(-50%);', 'right: -5px; top: 15px;' ];

const SUPPORT_ROSTER = [
    { id: 'rogue', icon: '🥷', name: 'Đạo Tặc', baseDmg: 5, cdMax: 3, cdCurrent: 0, skillName: 'Tiêu Độc', triggerSkill: (target) => { let dmg = 10; target.hp -= dmg; applyStatus(target, 'poison', 3); spawnPopup('monster-sprite', dmg, 'dmg'); return `ném Tiêu Độc!`; } },
    { id: 'paladin', icon: '🛡️', name: 'Thánh Kỵ', baseDmg: 3, cdMax: 4, cdCurrent: 0, skillName: 'Thánh Quang', triggerSkill: (target, playerRef) => { let heal = 30; playerRef.hp = Math.min(playerRef.maxHp, playerRef.hp + heal); applyStatus(playerRef, 'weaken', -1); spawnPopup('player-sprite-container', heal, 'heal'); return `niệm Thánh Quang!`; } },
    { id: 'berserker', icon: '🪓', name: 'Cuồng Chiến', baseDmg: 8, cdMax: 5, cdCurrent: 0, skillName: 'Bổ Choáng', triggerSkill: (target) => { let dmg = 25; target.hp -= dmg; applyStatus(target, 'stun', 1); spawnPopup('monster-sprite', dmg, 'dmg'); triggerShake('monster-sprite'); return `Bổ Choáng!`; } },
    { id: 'mage', icon: '🧙‍♂️', name: 'Băng Sư', baseDmg: 4, cdMax: 4, cdCurrent: 0, skillName: 'Bão Tuyết', triggerSkill: (target) => { let dmg = 12; target.hp -= dmg; applyStatus(target, 'weaken', 2); applyStatus(target, 'slow', 2); spawnPopup('monster-sprite', dmg, 'dmg'); return `gọi Bão Tuyết!`; } }
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
    statuses: { poison: 0, stun: 0, slow: 0, weaken: 0 } 
};

const SHOP_DATABASE = [
    { id: 'heal', icon: '🥟', name: 'Bánh Bao Tiên', desc: 'Hồi 40% HP', price: 20, type: 'consumable' },
    { id: 'diceLow', icon: '🐢', name: 'Xúc Xắc Chậm', desc: 'Chỉ đổ ra 1-3', price: 30, type: 'item' },
    { id: 'diceHigh', icon: '🐇', name: 'Xúc Xắc Nhanh', desc: 'Chỉ đổ ra 4-6', price: 30, type: 'item' },
    { id: 'skill', icon: '🃏', name: 'Thẻ Kỹ Năng', desc: 'Nhận 1 Thẻ ngẫu nhiên', price: 60, type: 'card' }
];

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
    if (target.statuses.stun > 0) target.statuses.stun--; if (target.statuses.slow > 0) target.statuses.slow--; if (target.statuses.weaken > 0) target.statuses.weaken--;
    return logs;
}