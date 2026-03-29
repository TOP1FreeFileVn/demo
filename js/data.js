// --- STATE & UTILS ---
let gameSpeed = 1; 
let isAutoSkill = false;
const sleep = (ms) => new Promise(res => setTimeout(res, ms / gameSpeed));

// --- CẤU HÌNH ĐỘI HÌNH ---
const TEAM = [
    { id: 'main', type: 'main', icon: '🗡️', name: 'Kiếm Thần' },
    { 
        id: 'rogue', type: 'support', icon: '🥷', name: 'Đạo Tặc',
        baseDmg: 5, cdMax: 3, cdCurrent: 0, skillName: 'Phi Tiêu',
        cssPos: 'left: 0px; top: 50px;', 
        triggerSkill: (monster) => { 
            let dmg = 15; monster.hp -= dmg; spawnPopup('monster-sprite', dmg, 'dmg'); return `phóng Phi Tiêu!`;
        }
    },
    { 
        id: 'paladin', type: 'support', icon: '🛡️', name: 'Thánh Kỵ',
        baseDmg: 3, cdMax: 4, cdCurrent: 0, skillName: 'Thánh Quang',
        cssPos: 'left: 50%; top: -10px; transform: translateX(-50%);', 
        triggerSkill: (monster, playerRef) => { 
            let heal = 25; playerRef.hp = Math.min(playerRef.maxHp, playerRef.hp + heal); spawnPopup('player-sprite', heal, 'heal'); return `niệm Thánh Quang!`;
        }
    },
    { 
        id: 'berserker', type: 'support', icon: '🪓', name: 'Cuồng Chiến',
        baseDmg: 8, cdMax: 5, cdCurrent: 0, skillName: 'Bổ Củi',
        cssPos: 'right: 0px; top: 50px;', 
        triggerSkill: (monster) => { 
            let dmg = 30; monster.hp -= dmg; spawnPopup('monster-sprite', dmg, 'dmg'); triggerShake('monster-sprite'); return `dùng Bổ Củi!`;
        }
    }
];

// --- CẤU HÌNH THẺ KỸ NĂNG ---
const ACTIONS_LIB = {
    'attack': { icon: '⚔️', name: 'Chém', desc: 'Gây 8 sát thương', dmg: 8, heal: 0 },
    'apple': { icon: '🍎', name: 'Ăn táo', desc: 'Hồi 15 máu', dmg: 0, heal: 15 },
    'shield': { icon: '🛡️', name: 'Phòng thủ', desc: 'Gây 3 dmg, hồi 8 HP', dmg: 3, heal: 8 },
    'kick': { icon: '🦶', name: 'Cú đá', desc: 'Gây 15 sát thương', dmg: 15, heal: 0 }
};

const player = { hp: 120, maxHp: 120, lv: 1, exp: 0, nextExp: 40, stage: 1, sequence: [{id: 'attack', level: 1}] };
const BASE_MONSTER = { hp: 60, atk: 15 };
let monster = { hp: 60, maxHp: 60, atk: 15, icon: '👾' };

const CHAPTER_LAYOUT = ['normal', 'normal', 'treasure', 'normal', 'boss'];
const STAGES_PER_CHAPTER = CHAPTER_LAYOUT.length;
let pendingRewardType = null;