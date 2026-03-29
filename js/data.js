// ==========================================
// TẬP TIN: js/data.js
// CHỨC NĂNG: Khởi tạo dữ liệu Game, Đội hình, Kỹ năng và Hệ thống Hiệu ứng (Status Engine)
// ==========================================

// --- CÁC BIẾN TIỆN ÍCH & TRẠNG THÁI GAME ---
let gameSpeed = 1; 
let isAutoSkill = false;

// Hàm chờ (sleep) tự động thay đổi theo tốc độ game
const sleep = (ms) => new Promise(res => setTimeout(res, ms / gameSpeed));

// --- CẤU HÌNH DANH SÁCH TƯỚNG (ROSTER) VÀ VỊ TRÍ ---
// Vị trí CSS tương ứng cho 3 ô Support xung quanh thanh Kiếm (Main)
const SUPPORT_POSITIONS = [
    'left: -10px; top: 40px;',                             // Vị trí 0: Trái
    'left: 50%; top: -15px; transform: translateX(-50%);', // Vị trí 1: Giữa Trên
    'right: -10px; top: 40px;'                             // Vị trí 2: Phải
];

// Danh sách toàn bộ Tướng Hỗ Trợ có thể kéo thả
const SUPPORT_ROSTER = [
    { 
        id: 'rogue', icon: '🥷', name: 'Đạo Tặc', 
        baseDmg: 5, cdMax: 3, cdCurrent: 0, skillName: 'Tiêu Độc', 
        triggerSkill: (target) => { 
            let dmg = 10; 
            target.hp -= dmg; 
            applyStatus(target, 'poison', 3); 
            spawnPopup('monster-sprite', dmg, 'dmg'); 
            return `ném Tiêu Độc (Dính Độc 3 lượt)!`; 
        } 
    },
    { 
        id: 'paladin', icon: '🛡️', name: 'Thánh Kỵ', 
        baseDmg: 3, cdMax: 4, cdCurrent: 0, skillName: 'Thánh Quang', 
        triggerSkill: (target, playerRef) => { 
            let heal = 30; 
            playerRef.hp = Math.min(playerRef.maxHp, playerRef.hp + heal); 
            applyStatus(playerRef, 'weaken', -1); /* Truyền -1 để xóa debuff Suy yếu */ 
            spawnPopup('player-sprite', heal, 'heal'); 
            return `niệm Thánh Quang hồi máu & giải trừ Suy yếu!`; 
        } 
    },
    { 
        id: 'berserker', icon: '🪓', name: 'Cuồng Chiến', 
        baseDmg: 8, cdMax: 5, cdCurrent: 0, skillName: 'Bổ Choáng', 
        triggerSkill: (target) => { 
            let dmg = 25; 
            target.hp -= dmg; 
            applyStatus(target, 'stun', 1); 
            spawnPopup('monster-sprite', dmg, 'dmg'); 
            triggerShake('monster-sprite'); 
            return `Bổ Choáng (Kẻ địch mất 1 lượt phản công)!`; 
        } 
    },
    { 
        id: 'mage', icon: '🧙‍♂️', name: 'Băng Sư', 
        baseDmg: 4, cdMax: 4, cdCurrent: 0, skillName: 'Bão Tuyết', 
        triggerSkill: (target) => { 
            let dmg = 12; 
            target.hp -= dmg; 
            applyStatus(target, 'weaken', 2); 
            applyStatus(target, 'slow', 2); 
            spawnPopup('monster-sprite', dmg, 'dmg'); 
            return `gọi Bão Tuyết (Quái giảm Dmg & Chậm 2 lượt)!`; 
        } 
    }
];

// Mảng chứa 3 vị trí Support đang trang bị (Mặc định cho Đạo Tặc và Cuồng Chiến vào ô Trái và Phải)
let ACTIVE_TEAM = [SUPPORT_ROSTER[0], null, SUPPORT_ROSTER[2]]; 

// --- CẤU HÌNH THẺ KỸ NĂNG CỦA VŨ KHÍ CHÍNH ---
const ACTIONS_LIB = {
    'attack': { icon: '⚔️', name: 'Chém', desc: 'Gây 8 sát thương', dmg: 8, heal: 0 },
    'apple': { icon: '🍎', name: 'Ăn táo', desc: 'Hồi 15 máu', dmg: 0, heal: 15 },
    'shield': { icon: '🛡️', name: 'Phòng thủ', desc: 'Gây 3 dmg, hồi 8 HP', dmg: 3, heal: 8 },
    'kick': { icon: '🦶', name: 'Cú đá', desc: 'Gây 15 sát thương', dmg: 15, heal: 0 }
};

// --- CHỈ SỐ NHÂN VẬT & QUÁI VẬT ---
const player = { 
    hp: 120, 
    maxHp: 120, 
    lv: 1, 
    exp: 0, 
    nextExp: 40, 
    stage: 1, 
    sequence: [{id: 'attack', level: 1}], 
    statuses: { poison: 0, stun: 0, slow: 0, weaken: 0 } 
};

const BASE_MONSTER = { hp: 60, atk: 15 };

let monster = { 
    hp: 60, 
    maxHp: 60, 
    atk: 15, 
    icon: '👾', 
    statuses: { poison: 0, stun: 0, slow: 0, weaken: 0 } 
};

// --- CẤU HÌNH MÀN CHƠI (CHAPTER) ---
let pendingRewardType = null;
// Một Chapter có 5 Stage: 3 Thường, 1 Rương Báu, 1 Boss
const CHAPTER_LAYOUT = ['normal', 'normal', 'treasure', 'normal', 'boss'];
const STAGES_PER_CHAPTER = CHAPTER_LAYOUT.length;

// ==========================================
// BỘ PHẬN XỬ LÝ HIỆU ỨNG (STATUS ENGINE)
// ==========================================

/**
 * Hàm áp dụng một hiệu ứng lên mục tiêu
 * @param {Object} target - Mục tiêu nhận hiệu ứng (player hoặc monster)
 * @param {String} type - Loại hiệu ứng (poison, stun, slow, weaken)
 * @param {Number} duration - Số lượt tồn tại (Nếu là -1 thì sẽ xóa hiệu ứng đó)
 */
function applyStatus(target, type, duration) {
    // Nếu duration là -1, tiến hành giải trừ hiệu ứng
    if(duration === -1) { 
        target.statuses[type] = 0; 
        return; 
    } 
    
    // Nếu đang bị hiệu ứng đó rồi thì cộng dồn số lượt lớn nhất
    target.statuses[type] = Math.max(target.statuses[type] || 0, duration); 
    
    // Kích hoạt icon bay lên để báo hiệu
    let icon = type === 'poison' ? '☠️' : type === 'stun' ? '💫' : type === 'slow' ? '❄️' : '📉';
    spawnPopup(target === monster ? 'monster-sprite' : 'player-sprite', 0, 'skill', `${icon}`);
}

/**
 * Hàm xử lý các hiệu ứng vào ĐẦU MỖI HIỆP ĐÁNH
 * @param {Object} target - Mục tiêu bị xử lý
 * @param {String} targetId - ID của HTML Element để bắn Popup sát thương
 * @returns {Array} - Trả về danh sách các chuỗi Log để in ra màn hình
 */
function processStatuses(target, targetId) {
    let logs = [];
    
    // 1. Xử lý Độc (Poison): Trừ 5% Máu Tối Đa + 3 HP mỗi hiệp
    if (target.statuses.poison > 0) {
        let poisonDmg = Math.floor(target.maxHp * 0.05) + 3; 
        target.hp -= poisonDmg;
        spawnPopup(targetId, poisonDmg, 'dmg');
        target.statuses.poison--; // Giảm đi 1 lượt
        
        let targetName = target === monster ? 'Quái vật' : 'Tổ đội';
        logs.push(`${targetName} mất ${poisonDmg} HP do <b style="color:purple">Trúng Độc</b>.`);
    }
    
    // 2. Xử lý trừ dần thời gian của các hiệu ứng khác
    if (target.statuses.stun > 0) target.statuses.stun--;
    if (target.statuses.slow > 0) target.statuses.slow--;
    if (target.statuses.weaken > 0) target.statuses.weaken--;
    
    return logs;
}