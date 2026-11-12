# 🎮 Arras.io 2D Tank Battle Arena (Multiplayer Online)

Game 2D xe tăng bắn súng nhiều người chơi thời gian thực (Real-time Multiplayer) lấy cảm hứng từ **arras.io** và **diep.io**. Hỗ trợ hơn **60 loại xe tăng**, 10 chế độ chơi, bot AI thông minh (từ gà đến pro), cấp độ vô hạn, chat thời gian thực và bảng xếp hạng online!

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
| **U** | Bật / tắt các bảng nâng cấp (bảng chỉ số + bảng tiến hóa xe tăng) |
| **Tab** | Bật / tắt bảng xếp hạng |
| **Enter** | Mở ô chat trò chuyện với người chơi khác |

---

## ✨ Tính năng mới

* **Đạn đụng đạn:** đạn của hai phe đối địch (hoặc của hai người khác nhau trong FFA) chạm nhau sẽ phá vỡ lẫn nhau. Sức mạnh của viên đạn phụ thuộc vào xe tăng đang chọn (sát thương + độ bền của đạn, cộng thêm điểm nâng cấp), nên đạn của xe mạnh sẽ xuyên qua đạn yếu. Đạn cùng đội không va vào nhau.
* **Cấp độ vô hạn:** sau cấp 45 vẫn tiếp tục lên cấp được, mỗi cấp cần nhiều điểm hơn cấp trước (+7% mỗi cấp).
* **Xe to dần theo cấp:** cứ lên 10 cấp, xe tăng to thêm 1.05 lần (nhân dồn). Cấp 10: x1.05, cấp 20: x1.10, cấp 45: x1.22, cấp 100: x1.63... Cả thân xe, nòng súng, viên đạn và vùng va chạm đều to theo, camera tự lùi ra một chút cho dễ nhìn.
* **15 xe tăng mới** lấy cảm hứng từ arras.io:
  * Tier 3: Twin Flank, Hexa Tank, Artillery, Launcher, Minigun, Manager (tàng hình khi đứng yên).
  * Tier 4: Predator, Spread Shot, Cyclone, Mortar, Overtrapper, Gunner Trapper, Swarmer, Carrier, Falcon.
* **Chế độ Zombie dễ hơn:** ít zombie hơn mỗi wave, zombie yếu/chậm/bắn chậm và ngắm kém hơn, đứng xa bắn thay vì lao vào đâm, đâm yếu hơn, boss xuất hiện thưa hơn và ít máu hơn.

---

## 🛡️ 10 Bản đồ & Chế độ chơi

1. **Free For All (FFA)**: Đấu trường tự do sinh tồn, tranh giành tổ Pentagon ở trung tâm.
2. **2-Team Deathmatch (2-TDM)**: Phe Xanh vs Phe Đỏ, căn cứ an toàn có siêu Drone bảo vệ.
3. **4-Team Conquest (4-TDM)**: Hỗn chiến 4 góc màu (Xanh dương, Đỏ, Xanh lá, Vàng).
4. **Domination**: Tranh giành và kiểm soát 4 Siêu Pháo Đài Dominator ở 4 góc chiến lược.
5. **Survival (Battle Royale)**: Vòng Bo Đỏ (Storm Barrier) thu hẹp liên tục, ép tất cả vào tử chiến.
6. **Juggernaut Hunt**: 1 Siêu Xe Tăng Juggernaut (máu siêu trâu) đối đầu với toàn bộ người chơi trong phòng.
7. **Labyrinth Maze**: Mê cung tường đá hẹp, chuyên phục kích và bắn lén.
8. **Boss Siege**: Hợp tác toàn server raid Siêu Boss khổng lồ cực trâu.
9. **Sandbox Arena**: Cấp 45 ngay lập tức, tự do đổi sang bất kỳ xe tăng nào trong 60+ loại, spawn Boss và Bot tùy ý.
10. **Zombie Wave**: Hợp tác chống từng đợt zombie, mỗi wave đông và mạnh hơn.
