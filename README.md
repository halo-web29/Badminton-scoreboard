# 🏸 Badminton Scoreboard (羽球專業計分板)

符合 BWF（世界羽球聯盟）最新規則的專業羽球計分板網頁應用程式。支援單打與雙打輪轉站位視覺化、發球方與接發球方自動判定、多主題配色切換、深色/淺色模式、即時比賽歷史紀錄以及 CSV 匯出功能。

---

## ✨ 核心特色

- **🎯 嚴謹符合 BWF 規則**：支援 21 分 3 局 2 勝制、加分上限（Deuce 至最高 30 分）、換邊（局間換邊與決勝局 11 分換邊）。
- **👥 雙打站位與發球追蹤**：視覺化呈現雙打球員站位、目前發球者與接發球者、偶數/奇數發球區切換。
- **🎨 多樣化質感主題**：內建多款主題色系（珊瑚橙、深邃夜、青翠綠、紫羅蘭等），支援即時切換深色（Dark Mode）與淺色（Light Mode）。
- **📊 比分歷程與 CSV 匯出**：詳細記錄每一分得失分過程，並支援一鍵匯出比賽紀錄 CSV。
- **📱 響應式跨平台設計**：針對平板、筆電、大螢幕與手機進行視圖最佳化，適合場邊裁判及球友使用。

---

## 🛠 技術堆疊

- **核心框架**：[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **建置工具**：[Vite 6](https://vitejs.dev/)
- **樣式引擎**：[Tailwind CSS v4](https://tailwindcss.com/)
- **圖示庫**：[Lucide React](https://lucide.dev/)
- **CI/CD**：GitHub Actions（自動部署至 GitHub Pages）

---

## 🚀 本地開發與運行

### 1. 環境需求
請確認本地已安裝 [Node.js](https://nodejs.org/)（建議 LTS 20.x 或 24.x 以上）。

### 2. 安裝依賴套件
```bash
npm install
```

### 3. 啟動開發伺服器
```bash
npm run dev
```
啟動成功後，瀏覽器打開 [http://localhost:3000](http://localhost:3000) 即可開始使用。

### 4. 程式碼型別檢查 (Lint)
```bash
npm run lint
```

### 5. 生產環境打包 (Build)
```bash
npm run build
```
打包成品將輸出至 `dist/` 目錄。

### 6. 本地預覽生產打包成品 (Preview)
```bash
npm run preview
```

---

## 🌐 線上自動部署 (GitHub Actions)

本專案已設定自動化 CI/CD Workflow（位於 `.github/workflows/deploy.yml`），只需將程式碼推送至 GitHub 即可一鍵部署至 **GitHub Pages**。

### 啟用 GitHub Pages 設定步驟：

1. 前往你的 GitHub 專案庫頁面（Repository）。
2. 點擊頂部的 **Settings** 標籤。
3. 在左側選單找到 **Pages**。
4. 在 **Build and deployment** 下方的 **Source** 下拉選單中，選擇 **GitHub Actions**。
5. 完成！每次對 `main` 分支執行 `git push` 時，GitHub Actions 便會自動執行建置並發布到你的專屬網址：
   ```
   https://<你的GitHub帳號>.github.io/Badminton-scoreboard/
   ```
6. 亦可在 GitHub 專案頁面的 **Actions** 分頁中，手動點擊 **Run workflow** 進行即時部署。

---

## 📁 專案目錄結構

```text
Badminton-scoreboard/
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions 自動部署工作流
├── src/
│   ├── App.tsx               # 主應用程式介面與計分器元件
│   ├── bwfLogic.ts           # BWF 羽球規則運算與站位推導邏輯
│   ├── theme.ts              # 主題色系配置與樣式定義
│   ├── types.ts              # TypeScript 型別定義
│   ├── index.css             # Tailwind CSS 核心樣式匯入
│   └── main.tsx              # React 根節點渲染入口
├── .env.example              # 環境變數範例檔
├── .gitignore                # Git 忽略設定（保護敏感檔、排除暫存與依賴）
├── index.html                # 網頁入口 HTML
├── package.json              # 專案依賴與執行指令設定
├── tsconfig.json             # TypeScript 編譯器設定
└── vite.config.ts            # Vite 建置與插件設定
```

---

## 🔒 安全與環境變數管理

- 本專案已配置完善的 `.gitignore`，自動排除 `node_modules/`、`dist/`、各類 `.env*` 隱私設定檔及作業系統產生的暫存檔。
- 若未來串接任何後端 API 或自訂金鑰，請建立 `.env` 或 `.env.local` 儲存，**切勿將敏感金鑰上傳至公開版本庫**。
