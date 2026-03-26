import 'dotenv/config';
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

// --- THUẬT TOÁN SINH LEVEL NGẪU NHIÊN & CHẮC CHẮN GIẢI ĐƯỢC ---
function generateSolvableLevel(colorsCount: number, emptyCount: number, capacity: number, shuffles: number) {
    let tubes: number[][] = [];
    
    // 1. Khởi tạo trạng thái CHIẾN THẮNG
    for (let i = 0; i < colorsCount; i++) {
        let tube = [];
        for (let j = 0; j < capacity; j++) tube.push(i);
        tubes.push(tube);
    }
    for (let i = 0; i < emptyCount; i++) {
        tubes.push([]);
    }

    // 2. Xáo trộn ngược (Reverse Shuffle)
    for (let s = 0; s < shuffles; s++) {
        let nonEmpty = tubes.map((t, idx) => ({ t, idx })).filter(x => x.t.length > 0);
        if (nonEmpty.length === 0) continue;
        let src = nonEmpty[Math.floor(Math.random() * nonEmpty.length)].idx;

        let nonFull = tubes.map((t, idx) => ({ t, idx })).filter(x => x.t.length < capacity && x.idx !== src);
        if (nonFull.length === 0) continue;
        let tgt = nonFull[Math.floor(Math.random() * nonFull.length)].idx;

        let wool = tubes[src].pop()!;
        tubes[tgt].push(wool);
    }
    return tubes;
}

async function main() {
    console.log("Bắt đầu gieo dữ liệu (Seeding)...");

    // 1. TẠO TÀI KHOẢN ADMIN (Giữ nguyên để bạn đăng nhập)
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@gamemaster.com' },
        update: {},
        create: {
            email: 'admin@gamemaster.com',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log("✅ Khởi tạo tài khoản Admin: admin@gamemaster.com / admin123");

    // 2. TẠO GAME "COZY TAILOR SHOP"
    let game = await prisma.game.findFirst({ where: { title: 'Cozy Tailor Shop' } });
    if (!game) {
        game = await prisma.game.create({
            data: {
                title: 'Cozy Tailor Shop',
                genre: 'Puzzle',
                status: 'ACTIVE',
                settings: {
                    monetization: { interstitial_cooldown: 45, enable_rewarded: true },
                    tools: { daily_gift_enabled: true, max_undo_per_day: 10 }
                }
            }
        });
        console.log("✅ Khởi tạo Game: Cozy Tailor Shop");
    }

    // 3. XÓA CÁC LEVEL CŨ CỦA GAME NÀY (Để không bị trùng lặp khi chạy seed nhiều lần)
    await prisma.level.deleteMany({ where: { gameId: game.id } });

    // 4. SINH TỰ ĐỘNG 10 LEVEL VỚI ĐỘ KHÓ TĂNG DẦN
    for (let i = 1; i <= 10; i++) {
        // Công thức tính độ khó: 
        // Lvl 1-3: 2 màu | Lvl 4-6: 3 màu | Lvl 7-9: 4 màu | Lvl 10: 5 màu
        const colors = Math.min(2 + Math.floor((i - 1) / 3), 5); 
        const empty = 2;
        const capacity = 4;
        const shuffles = i * 20; // Càng lên level cao, len xáo trộn càng nát

        const rawTubes = generateSolvableLevel(colors, empty, capacity, shuffles);
        
        // Format lại dữ liệu cho chuẩn JSON mà Client Unity mong đợi
        const formattedTubes = rawTubes.map(t => ({ wools: t }));

        let difficulty = 'Easy';
        if (i > 3) difficulty = 'Medium';
        if (i > 7) difficulty = 'Hard';

        await prisma.level.create({
            data: {
                gameId: game.id,
                levelNumber: i,
                config: { tubes: formattedTubes },
                settings: {
                    tubeCapacity: capacity,
                    undoLimit: 5,
                    difficulty: difficulty,
                    heuristicScore: shuffles
                }
            }
        });
        console.log(`✅ Đã sinh Level ${i} (${difficulty} - Cột: ${colors + empty} - Màu: ${colors})`);
    }

    console.log("🎉 Hoàn tất gieo dữ liệu thành công!");
}

main()
    .catch((e) => {
        console.error("❌ Lỗi khi gieo dữ liệu:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });