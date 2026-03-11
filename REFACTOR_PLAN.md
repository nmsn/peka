# Peka 项目重构计划：Electron → Electrobun（功能对齐版）

## 一、结论先行

本次迁移目标是：使用 Electrobun 技术栈重新实现 `app/electron` 下 Peka 的**全部功能**，并尽可能保持原有技术栈一致性；若 Electrobun 无对应能力或生态不可用，则采用 Electrobun 兼容的替代实现。

核心原则：

- 对齐基准以 `app/electron` 现有功能为准
- 以功能一致性优先于“可行性验证”
- 先构建等价能力，再进行 UI/体验微调

## 二、迁移动机与边界

### 2.1 迁移动机

- 降低安装包体积
- 缩短冷启动时间
- 减少运行时内存占用
- 简化部分运行时分发链路

### 2.2 边界

- 本次目标是完整功能对齐，不再以 PoC 验证为前置阶段
- 平台优先级以 macOS 为主，但功能对齐标准以 Electron 实现为准

## 三、功能对齐基准

对齐基准：`app/electron` 现有完整功能。

对齐要求：

- 所有可见功能与交互尽量保持一致
- 主进程、渲染层、快捷键、托盘、设置等能力必须等价可用
- 如果 Electrobun 无直接能力，必须在文档中标注替代方案

## 四、技术栈对齐原则

优先保持与 Electron 版一致的技术栈与习惯：

- 渲染层使用 React 组件
- UI 样式使用全局 CSS 文件
- 不使用 TailwindCSS
- 复用 Electron 版的 CSS 结构与样式语义

如 Electrobun 不支持等价工具链：

- 采用 Electrobun 兼容方案替代
- 在文档记录技术栈偏差与原因

## 五、架构映射

### 5.1 当前 Electron 架构

```text
Electron:
┌──────────────────────┐
│ Main Process         │
│ - src/main/index.ts  │
│ - modules/ipc.ts     │
│ - modules/store.ts   │
│ - modules/eyedropper │
└──────────┬───────────┘
           │
           │ IPC + events
           │
┌──────────▼───────────┐
│ Preload Bridge       │
│ - src/preload/index  │
└──────────┬───────────┘
           │
           │ window.api
           │
┌──────────▼───────────┐
│ Renderer (React)     │
│ - TitleBar           │
│ - ColorDisplay       │
│ - AccessibilityPanel │
└──────────────────────┘
```

### 5.2 目标 Electrobun 架构

```text
Electrobun:
┌──────────────────────────┐
│ Bun Main Runtime         │
│ - window manager         │
│ - tray manager           │
│ - settings store         │
│ - native color module    │
│ - event bridge           │
└────────────┬─────────────┘
             │
             │ RPC + event bridge
             │
┌────────────▼─────────────┐
│ WebView (React)          │
│ - UI state               │
│ - window.api adapter     │
└──────────────────────────┘
```

## 六、功能对齐检查维度

对齐检查以 Electron 版为标准，至少覆盖：

- 取色主流程与返回值
- 颜色格式化与复制
- 设置持久化与设置项行为
- 自定义标题栏与拖拽区
- 全局快捷键与事件分发
- 托盘与 menubar 行为
- 多窗口设置页与 About
- i18n 与语言切换
- UI 结构与交互细节

## 七、实施阶段

### 阶段 1：运行时与桥接层对齐

- Electrobun 主进程能力对齐 Electron（窗口、托盘、快捷键、设置、事件推送）
- 建立等价的 `window.api` 接口层

### 阶段 2：渲染层 React 重建

- 重建 React 渲染层结构
- 接入全局 CSS
- 复用 Electron 的 UI 语义与交互

### 阶段 3：功能模块对齐

- 取色、复制、格式切换
- Accessibility 面板
- 设置与 About 窗口
- i18n

### 阶段 4：细节一致性与回归对齐

- 快捷键全覆盖
- menubar 模式逻辑
- 视觉与交互回归对齐

## 八、风险与应对

- Electrobun 能力缺失
  - 采用兼容方案替代并记录
- WebView 与 Chromium 差异
  - 以 Electron UI 为基准逐项修正
- 原生能力差异
  - 优先 macOS 完整对齐，再扩展 Windows

## 九、验收标准

迁移完成时必须满足：

- 与 Electron 版功能一致
- 关键交互路径无降级
- macOS 下主流程稳定可用

---

**执行建议：以 Electrobun 完整重建 Electron 现有功能为目标，不再以 PoC 验证为主线。**

## 十、当前差异与替代方案（持续更新）

- **自动更新检查**：Electron 版使用 `autoUpdater`，Electrobun 暂无等价能力，`checkForUpdates` 目前为占位实现（可后续接入自研更新或外部升级机制）。
- **启动时自启**：Electron 版用系统 `openAtLogin`，Electrobun 采用 macOS `LaunchAgent` 写入方案进行对齐。
- **menubar 模式隐藏 Dock**：Electron 版可隐藏 Dock 并 `skipTaskbar`，Electrobun 暂无对应 API，当前仅实现托盘切换（Dock 隐藏能力待确认或替代实现）。
- **About**：Electron 版可弹出系统 About 面板，Electrobun 使用自定义 About 弹层并支持通过 API 触发。
- **Dock 图标设置**：Electron 版可显式设置 Dock 图标，Electrobun 目前依赖应用包图标，暂无明确 API。
