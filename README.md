# 🎮 Arras.io 2D Tank Battle Arena (Multiplayer Online)

Game 2D xe tăng bắn súng nhiều người chơi thời gian thực (Real-time Multiplayer) lấy cảm hứng từ **arras.io** và **diep.io**. Hỗ trợ hơn **40 loại xe tăng**, 9 chế độ chơi, bot AI thông minh (từ gà đến pro), bảng mã **Cheat Code**, chat thời gian thực và bảng xếp hạng online!

---

## 🌐 CÁCH ĐƯA LÊN GITHUB ĐỂ BẠN BÈ CÙNG CHƠI & CHAT ONLINE

### Cách 1: Đưa lên GitHub Pages (Đơn giản nhất - Miễn phí 100%)
*GitHub Pages chỉ cần 1 file HTML là bạn và bạn bè có thể vào chơi chung ngay lập tức!*

1. **Lấy file HTML:**
   - Trong thư mục dự án có sẵn file `arras-io-online.html` (hoặc tải trực tiếp tại nút tải file HTML trong sảnh chờ).
   - Đổi tên file `arras-io-online.html` thành `index.html`.
2. **Tạo GitHub Repository:**
   - Vào [GitHub.com](https://github.com), bấm **New repository**.
   - Đặt tên repo (ví dụ: `arras-io-game`), chọn chế độ **Public**.
   - Bấm **Create repository**.
3. **Upload file:**
   - Nhấn **Upload an existing file** -> Kéo thả file `index.html` vào -> Nhấn **Commit changes**.
4. **Bật GitHub Pages:**
   - Vào tab **Settings** của repo -> Chọn mục **Pages** ở danh mục bên trái.
   - Tại phần **Build and deployment**, mục **Branch**: chọn `main` và thư mục `/ (root)` -> Bấm **Save**.
5. **Chơi Online:**
   - Sau khoảng 1 phút, GitHub sẽ hiển thị link website của bạn:
     ```text
     https://<ten-user-cua-ban>.github.io/arras-io-game/
     ```
   - **Gửi link này cho bạn bè:** Tất cả mọi người cùng vào link sẽ tự động kết nối chung vào máy chủ Cloud Online, nhìn thấy nhau di chuyển, bắn nhau, chat trực tiếp và tranh top 1 leaderboard!

---

### Cách 2: Deploy toàn bộ Server Full-Stack lên Render.com (Máy chủ riêng 24/7)
*Nếu bạn muốn làm chủ hoàn toàn 1 máy chủ riêng biệt không chung với ai:*

1. Đẩy toàn bộ source code này lên GitHub repo của bạn.
2. Đăng ký tài khoản miễn phí tại [Render.com](https://render.com).
3. Bấm **New +** -> Chọn **Web Service**.
4. Chọn repository GitHub vừa tạo.
5. Cấu hình:
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
6. Bấm **Deploy Web Service**.
7. Render sẽ cấp cho bạn một domain riêng dạng `https://ten-may-chu-cua-ban.onrender.com`.
8. Mọi người mở game, bấm nút **⚙️ Cài đặt Server** ở sảnh chờ và nhập:
   ```text
   wss://ten-may-chu-cua-ban.onrender.com
   ```
   Là toàn bộ người chơi sẽ cùng kết nối vào server riêng của bạn!

---

### Cách 3: Chơi Offline hoặc Localhost trên máy tính
1. Cài đặt **Node.js** (v18+ hoặc v20+).
2. Mở thư mục dự án và chạy:
   ```bash
   npm install
   npm run dev
   ```
3. Mở trình duyệt vào `http://localhost:3000`.
4. Hoặc tải file `.exe` chạy độc lập 1 click không cần cài Node.js.

---

## 🎯 Phím điều khiển trong game

| Phím | Chức năng |
|---|---|
| **W, A, S, D** hoặc **Mũi tên** | Di chuyển xe tăng |
| **Chuột** | Ngắm bắn |
| **Chuột trái** hoặc **Space** | Bắn đạn |
| **Chuột phải** hoặc **Shift** | Đẩy Drone đi xa / Điều khiển Drone |
| **E** | Bật / tắt Tự động bắn (Auto-Fire) |
| **C** | Bật / tắt Tự động xoay nòng (Auto-Spin) |
| **1 đến 8** | Nâng cấp 8 chỉ số kỹ năng |
| **Giữ M + 1-8** | Nâng max chỉ số ngay lập tức |
| **U** | Bật / tắt xem bảng chỉ số (tự động ẩn khi đã hết điểm) |
| **/** hoặc **K** | Mở bảng mã gian lận (Cheat Menu) |
| **Enter** | Mở ô chat trò chuyện với người chơi khác |

---

## ⚡ Danh sách mã Cheat Code (Gõ vào bảng cheat hoặc ô chat)

* **`god`** hoặc **`bat_tu`**: Bật/tắt chế độ Bất tử 100% (không dính sát thương).
* **`max`** hoặc **`cap45`**: Lên thẳng Cấp 45 và nhận 33 điểm nâng cấp kỹ năng.
* **`nuke`**: Kích hoạt bom nguyên tử quét sạch mọi kẻ địch và quái trong bán kính 950px.
* **`closer`**: Biến hình thành Thần **Arena Closer** kinh điển với kích thước khổng lồ và đạn siêu mạnh.
* **`dominator`**: Biến hình thành **Pháo Đài Dominator** 3000 máu.
* **`mothership`**: Biến hình thành **Tàu Mẹ Mothership** điều khiển cùng lúc 32 siêu Drone.
* **`speed`**: Siêu tốc độ di chuyển Turbo x3.
* **`score`**: Nhận ngay **+50,000 XP**.
* **`rainbow`**: Kích hoạt skin cầu vồng 7 màu nhấp nháy ảo diệu.
* **`heal`**: Hồi đầy 100% thanh máu lập tức.
* **`boss`**: Triệu hồi Siêu Boss Guardian để săn lùng.

---

## 🛡️ 9 Bản đồ & Chế độ chơi

1. **Free For All (FFA)**: Đấu trường tự do sinh tồn, tranh giành tổ Pentagon ở trung tâm.
2. **2-Team Deathmatch (2-TDM)**: Phe Xanh vs Phe Đỏ, căn cứ an toàn có siêu Drone bảo vệ.
3. **4-Team Conquest (4-TDM)**: Hỗn chiến 4 góc màu (Xanh dương, Đỏ, Xanh lá, Vàng).
4. **Domination**: Tranh giành và kiểm soát 4 Siêu Pháo Đài Dominator ở 4 góc chiến lược.
5. **Survival (Battle Royale)**: Vòng Bo Đỏ (Storm Barrier) thu hẹp liên tục, ép tất cả vào tử chiến.
6. **Juggernaut Hunt**: 1 Siêu Xe Tăng Juggernaut (máu siêu trâu) đối đầu với toàn bộ người chơi trong phòng.
7. **Labyrinth Maze**: Mê cung tường đá hẹp, chuyên phục kích và bắn lén.
8. **Boss Siege**: Hợp tác toàn server raid Siêu Boss khổng lồ cực trâu.
9. **Sandbox Arena**: Cấp 45 ngay lập tức, tự do đổi sang bất kỳ xe tăng nào trong 40+ loại, spawn Boss và Bot tùy ý.
