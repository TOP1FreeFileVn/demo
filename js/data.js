// ==============================================
// 🎨 KHU VỰC THAY ẢNH NHÂN VẬT & QUÁI 
// (Dán link ảnh .png hoặc .gif vào giữa 2 dấu nháy đơn '')
// NẾU BỎ TRỐNG '', GAME SẼ TỰ DÙNG EMOJI MẶC ĐỊNH
// ==============================================
const GAME_IMAGES = {
    mainHub: '',      // Ảnh Main đứng ở Sảnh chính (Ví dụ: 'images/main_idle.gif')
    mainCombat: '',   // Ảnh Main lúc vào trận chiến
    mapPiece: '',     // Ảnh quân cờ chạy tung tăng trên Map 3D
    boss: '',         // Ảnh Trùm Cuối
    monster: '',      // Ảnh Quái thường
    chest: ''         // Ảnh Rương Báu
};

// ĐỂ THAY ẢNH ĐỒNG ĐỘI, dán link vào biến "img: ''" ở bên dưới:
const SUPPORT_ROSTER = [

    // =============================================
    // FRIERAN - Pháp Sư Tiễn Vong (Elf 800+ tuổi)
    // Nội tại: Chuông Pha Lê - tự động xóa 1 debuff cho đồng minh mỗi lượt
    // Skill: Thanh Tẩy Linh Hồn - gây 30 dmg + nguyền Giảm Kháng Phép 3 lượt
    // =============================================
    { 
        id: 'frieran', 
        icon: '🧙‍♀️', 
        img: '', 
        name: 'Frieran', 
        baseDmg: 4, 
        cdMax: 4, 
        cdCurrent: 0, 
        skillName: 'Thanh Tẩy Linh Hồn',

        // Nội tại Chuông Pha Lê: gọi mỗi lượt trong chargeSupportMana()
        passive: (playerRef) => {
            const debuffs = ['poison', 'stun', 'slow', 'weaken'];
            for (let d of debuffs) {
                if (playerRef.statuses[d] > 0) {
                    playerRef.statuses[d] = 0;
                    spawnPopup('player-sprite-container', 0, 'skill', '🔔 Thanh Tẩy');
                    addLog(`<b style="color:#9c27b0">[Frieran - Chuông Pha Lê]</b> Tiếng chuông ngân vang, xóa hiệu ứng <b>${d}</b> cho tổ đội!`);
                    break; // Chỉ xóa 1 debuff mỗi lượt
                }
            }
        },

        triggerSkill: (target, playerRef) => { 
            let dmg = 30; 
            target.hp -= dmg; 
            // weaken đại diện cho Giảm Kháng Phép trong hệ thống hiện tại
            applyStatus(target, 'weaken', 3);
            spawnPopup('monster-sprite', dmg, 'dmg'); 
            triggerShake('monster-sprite');
            addLog(`<b style="color:#9c27b0">[Frieran]</b> "Để tôi giúp các bạn thanh tẩy sự hỗn độn này."`);
            return `tung Thanh Tẩy Linh Hồn! Gây <b style="color:#ff4d4d">${dmg}</b> sát thương phép và nguyền Giảm Kháng Phép 3 lượt!`; 
        } 
    },

    // =============================================
    // TAROT - Pháp Sư Ấn Chính (cựu lính gác kinh đô)
    // Nội tại: Nhãn Quan Chiến Thuật - đòn bồi 20% chance Đánh Dấu, giảm DEF địch 1 lượt
    // Skill: Phán Quyết Vận Mệnh - rút 1 trong 3 lá bài ngẫu nhiên
    //   Lá Đỏ (The Tower):   gây 60 sát thương phép
    //   Lá Xanh (The Star):  tạo Giáp Ngôi Sao chặn 1 đòn tấn công
    //   Lá Vàng (The Chariot): tăng 100% ATK cho chuỗi hành động kế tiếp
    // =============================================
    { 
        id: 'tarot', 
        icon: '🃏', 
        img: '', 
        name: 'Tarot', 
        baseDmg: 6, 
        cdMax: 5, 
        cdCurrent: 0,
        skillName: 'Phán Quyết Vận Mệnh',

        // Nội tại Nhãn Quan Chiến Thuật: gọi trong vòng for support đánh bồi ở gameLoop()
        passiveProc: (target) => {
            if (Math.random() < 0.20) {
                applyStatus(target, 'weaken', 1); // weaken = giảm DEF/ATK 1 lượt
                spawnPopup('monster-sprite', 0, 'skill', '🎯 Đánh Dấu!');
                addLog(`<b style="color:#4da3ff">[Tarot - Nhãn Quan]</b> Đánh Dấu! Địch mất 30% DEF trong 1 hiệp!`);
            }
        },

        triggerSkill: (target, playerRef) => { 
            const roll = Math.random();

            if (roll < 0.333) {
                // 🟥 Lá Đỏ - The Tower: sát thương phép lớn
                let dmg = 60;
                target.hp -= dmg;
                spawnPopup('monster-sprite', dmg, 'dmg');
                triggerShake('monster-sprite');
                addLog(`<b style="color:#d32f2f">🟥 [The Tower]</b> "Sự sụp đổ là không thể tránh khỏi."`);
                return `rút Lá Đỏ &#x1F7E5; THE TOWER! Gây <b style="color:#ff4d4d">${dmg}</b> sát thương phép!`;

            } else if (roll < 0.666) {
                // 🟦 Lá Xanh - The Star: Giáp Ngôi Sao chặn 1 đòn
                playerRef._starShield = true;
                spawnPopup('player-sprite-container', 0, 'skill', '🌟 Giáp Ngôi Sao!');
                addLog(`<b style="color:#4da3ff">🟦 [The Star]</b> "Ngôi sao hy vọng vẫn luôn tỏa sáng." — Mici được bảo vệ bởi Giáp Ngôi Sao!`);
                return `rút Lá Xanh &#x1F7E6; THE STAR! Mici được bảo vệ, chặn 1 đòn tấn công tiếp theo!`;

            } else {
                // 🟨 Lá Vàng - The Chariot: buff x2 ATK lượt kế tiếp
                playerRef._chariotBuff = true;
                spawnPopup('player-sprite-container', 0, 'skill', '⚡ CHARIOT! x2 ATK');
                addLog(`<b style="color:#ffcc00">🟨 [The Chariot]</b> "Tiến lên! Chiến thắng đang ở ngay trước mắt." — Toàn đội tăng 100% ATK lượt kế!`);
                return `rút Lá Vàng &#x1F7E8; THE CHARIOT! Toàn đội tăng <b style="color:#ffcc00">100% ATK</b> cho chuỗi hành động kế tiếp!`;
            }
        } 
    },

    // =============================================
    // ELAINE - Phù Thủy Sự Sống (Hạt Giống Nguyên Thủy của rừng)
    // Nội tại: Healing Forest - hồi 2% HP tối đa cho toàn đội mỗi lượt
    // Skill: Low Cortisol - hồi 15% HP (bonus theo máu đã mất) + tăng 20% ATK (stack tối đa 3)
    // =============================================
    { 
        id: 'elaine', 
        icon: '🌿', 
        img: '', 
        name: 'Elaine', 
        baseDmg: 3, 
        cdMax: 4, 
        cdCurrent: 0, 
        skillName: 'Low Cortisol',
        _atkStack: 0, // Theo dõi số lớp buff ATK hiện tại (tối đa 3)

        // Nội tại Healing Forest: gọi mỗi lượt trong chargeSupportMana()
        passive: (playerRef) => {
            if (playerRef.hp < playerRef.maxHp) {
                let healAmount = Math.floor(playerRef.maxHp * 0.02);
                playerRef.hp = Math.min(playerRef.maxHp, playerRef.hp + healAmount);
                spawnPopup('player-sprite-container', healAmount, 'heal');
            }
        },

        triggerSkill: (target, playerRef) => { 
            // --- Hồi máu: 15% + bonus theo % máu đã mất ---
            let missingHpRatio = 1 - (playerRef.hp / playerRef.maxHp);
            let baseHeal = Math.floor(playerRef.maxHp * 0.15);
            let bonusHeal = Math.floor(baseHeal * missingHpRatio);
            let totalHeal = baseHeal + bonusHeal;
            playerRef.hp = Math.min(playerRef.maxHp, playerRef.hp + totalHeal);
            spawnPopup('player-sprite-container', totalHeal, 'heal');

            // --- Buff ATK stack, tối đa 3 lớp ---
            let elaine = SUPPORT_ROSTER.find(h => h.id === 'elaine');
            let stackMsg = '';
            if (elaine && elaine._atkStack < 3) {
                elaine._atkStack++;
                playerRef._elaineAtkBuff = elaine._atkStack * 0.20; // 20% mỗi stack
                spawnPopup('player-sprite-container', 0, 'skill', `🌱 ATK +${elaine._atkStack * 20}%`);
                stackMsg = `Stack ATK ${elaine._atkStack}/3 (+${elaine._atkStack * 20}% ATK tổng cộng).`;
                addLog(`<b style="color:#4caf50">[Elaine]</b> "Hãy để sức mạnh của thiên nhiên chữa lành." — ${stackMsg}`);
            } else {
                stackMsg = `ATK Buff đã đạt MAX 3 stack (+60% ATK)!`;
                addLog(`<b style="color:#4caf50">[Elaine]</b> ${stackMsg}`);
            }

            return `tung Low Cortisol! Hồi <b style="color:#4caf50">${totalHeal}</b> HP. ${stackMsg}`; 
        } 
    }
];

// ==============================================
// LOGIC GAME (KHÔNG CẦN CHỈNH SỬA BÊN DƯỚI)
// ==============================================
let gameSpeed = 1; 
let isAutoSkill = false;
const sleep = (ms) => new Promise(res => setTimeout(res, ms / gameSpeed));

const SUPPORT_POSITIONS = [ 'left: -5px; top: 15px;', 'left: 50%; top: -25px; transform: translateX(-50%);', 'right: -5px; top: 15px;' ];

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
    // --- FLAGS CHO SKILL TAROT VÀ ELAINE ---
    _starShield: false,      // Giáp Ngôi Sao (The Star): chặn 1 đòn địch
    _chariotBuff: false,     // Chariot: x2 ATK chuỗi kế tiếp
    _elaineAtkBuff: 0        // Elaine buff: +20%/40%/60% ATK tích lũy
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

// ==============================================
// SHOP DATABASE
// ==============================================
const SHOP_DATABASE = [
    { id: 'heal',     icon: '💊', name: 'Thuốc Hồi Sinh',  desc: 'Hồi 40% HP tối đa',          price: 30 },
    { id: 'diceLow',  icon: '🎲', name: 'Xúc Xắc Chậm',    desc: 'Đảm bảo đi 2-6 ô',            price: 20 },
    { id: 'diceHigh', icon: '🎯', name: 'Xúc Xắc Nhanh',   desc: 'Đảm bảo đi 7-12 ô',           price: 25 },
    { id: 'skill',    icon: '🃏', name: 'Thẻ Kỹ Năng',      desc: 'Nhận 1 kỹ năng ngẫu nhiên',   price: 40 }
];