# Pika 项目分析文档 - Electron 复刻版

## 文档概述

本文档为将 Pika（macOS 原生取色器应用）复刻为 Electron 框架的技术分析文档。文档涵盖项目架构、技术栈、功能模块及核心业务逻辑，为 AI 协助完成复刻工作提供完整的技术参考。

---

## 一、项目整体结构分析

### 1.1 目录组织结构

```
Pika/
├── AppDelegate.swift              # 应用入口，应用生命周期管理
│
├── Assets/                        # 静态资源
│   ├── Assets.xcassets/          # 图片资源集
│   ├── *.lproj/                  # 多语言本地化 (8种语言)
│   └── ColorNames.json           # 颜色名称映射数据
│
├── Constants/                    # 常量定义层
│   ├── Constants.swift           # 应用常量、通知名称、URL
│   └── Defaults.swift            # 用户默认设置定义
│
├── Extensions/                   # 扩展功能层
│   ├── WCAGCompliance.swift      # WCAG 可访问性检测
│   ├── APCACompliance.swift      # APCA 可访问性检测
│   ├── LookUpAPI.swift           # 颜色名称 API
│   ├── Cula.swift                # 颜色命名库封装
│   ├── LatestAppStoreVersion+ShouldUpdate.swift  # 版本检测
│   └── ...                       # 其他工具扩展
│
├── Metal/                        # 图形渲染层
│   ├── MetalShader.metal         # GPU 着色器代码
│   └── MetalShader.swift         # Metal 封装
│
├── Styles/                       # UI 样式层
│   ├── AppearanceButtonStyle.swift
│   ├── CircleButtonStyle.swift
│   ├── EyedropperButtonStyle.swift
│   └── SwapButtonStyle.swift
│
├── TouchBar/                     # Touch Bar 支持
│   ├── PikaTouchBar.swift        # 主窗口 Touch Bar
│   └── SplashTouchBar.swift      # 启动画面 Touch Bar
│
├── Utilities/                    # 工具类层
│   ├── Eyedroppers.swift         # 取色器管理
│   ├── ColorPickOverlayWindow.swift  # 取色悬浮窗
│   ├── Exporter.swift            # 颜色导出
│   ├── LoadColors.swift          # 颜色加载
│   ├── PikaWindow.swift          # 窗口管理
│   └── ClosestVector.swift       # 颜色向量计算
│
└── Views/                        # UI 视图层
    ├── ContentView.swift         # 主内容视图
    ├── ColorPickers.swift        # 颜色选择器容器
    ├── EyedropperItem.swift      # 单个取色器视图
    ├── PreferencesView.swift     # 偏好设置视图
    ├── Visualisation.swift       # 颜色可视化
    └── ...                       # 其他视图组件
```

### 1.2 模块间依赖关系

```
┌─────────────────────────────────────────────────────────────┐
│                    AppDelegate (入口层)                      │
│  - 应用生命周期管理                                          │
│  - 窗口创建与展示                                            │
│  - URL Scheme 处理                                           │
│  - 全局快捷键注册                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Views (UI 视图层)                         │
│  - ContentView: 主界面                                       │
│  - PreferencesView: 偏好设置                                 │
│  - ColorPickers: 颜色选择器                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Utilities (工具类层)                        │
│  - Eyedroppers: 取色器核心逻辑                              │
│  - Exporter: 颜色导出                                        │
│  - ColorPickOverlayWindow: 悬浮窗                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Extensions (扩展功能层)                        │
│  - WCAGCompliance: 可访问性检测                             │
│  - APCACompliance: APCA 标准检测                            │
│  - 颜色格式转换                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Constants (常量定义层)                         │
│  - Defaults: 用户设置                                        │
│  - PikaConstants: 应用常量                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、技术栈详细说明

### 2.1 原技术栈

| 层级     | 技术                  | 说明                                  |
| -------- | --------------------- | ------------------------------------- |
| UI 框架  | SwiftUI + AppKit      | SwiftUI 用于界面，AppKit 用于系统集成 |
| 图形渲染 | Metal                 | GPU 加速的颜色可视化                  |
| 状态管理 | @Published + @Default | SwiftUI 原生状态 + Defaults 库        |
| 本地存储 | Defaults 库           | 基于 UserDefaults 的类型安全存储      |
| 系统集成 | Cocoa                 | NSColorSampler 取色、NSColorPanel     |
| 自动化   | KeyboardShortcuts 库  | 全局快捷键                            |

### 2.2 Electron 复刻技术建议

| 层级         | 原技术            | Electron 建议方案                    |
| ------------ | ----------------- | ------------------------------------ |
| UI 框架      | SwiftUI           | React + TypeScript                   |
| 状态管理     | @Published        | React Context / Zustand              |
| 本地存储     | Defaults          | electron-store                       |
| 取色功能     | NSColorSampler    | screen采样 / node-native-screenshots |
| 图形渲染     | Metal             | Canvas 2D / WebGL / Three.js         |
| 全局快捷键   | KeyboardShortcuts | electron-globalshortcut              |
| 系统颜色面板 | NSColorPanel      | react-colorful + 自定义              |
| 窗口管理     | NSWindow          | Electron BrowserWindow API           |
| 悬浮窗       | NSWindow          | frameless window + transparent       |

### 2.3 第三方依赖

```json
{
  "dependencies": {
    "electron-store": "^8.1.0",
    "electron-log": "^5.0.0",
    "screenshot-desktop": "^1.15.0",
    "robotjs": "^0.6.0",
    "electron-updater": "^6.1.0"
  },
  "devDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "electron": "^28.0.0",
    "zustand": "^4.4.0"
  }
}
```

---

## 三、功能模块全面解析

### 3.1 核心功能点

#### 3.1.1 屏幕取色功能

**文件位置**: `Utilities/Eyedroppers.swift`

```swift
class Eyedropper: ObservableObject {
    // 核心属性
    let type: Types  // foreground | background
    @Published var color: NSColor

    // 核心方法
    func start()           // 启动取色器
    func picker()          // 打开系统颜色面板
    func set(_ color:)    // 设置颜色（支持撤销）
}
```

**Electron 实现要点**:
1. 使用 `robotjs` 或 `screenshot-desktop` 获取屏幕像素颜色
2. 实现全局鼠标事件监听捕获光标位置
3. 创建透明悬浮窗显示实时预览

#### 3.1.2 颜色格式转换

**文件位置**: `Constants/Defaults.swift`

```swift
enum ColorFormat: String, Codable {
    case hex = "Hex"
    case rgb = "RGB"
    case hsb = "HSB"
    case hsl = "HSL"
    case lab = "LAB"
    case opengl = "OpenGL"
}
```

**支持格式**:
- **Hex**: `#RRGGBB` / `#RGB`
- **RGB**: `rgb(r, g, b)` / `r, g, b`
- **HSB**: `hsb(h, s, b)` / `h, s, b`
- **HSL**: `hsl(h, s, l)` / `h, s, l`
- **LAB**: `lab(l, a, b)` / CIELAB 色彩空间
- **OpenGL**: `glColor4f(r, g, b, a)`

#### 3.1.3 颜色导出

**文件位置**: `Utilities/Exporter.swift`

```swift
class Exporter {
    // 导出为纯文本格式
    static func toText(foreground:, background:, style:) -> String

    // 导出为 JSON 格式
    static func toJSON(foreground:, background:, style:) -> String
}
```

**导出格式风格** (`CopyFormat`):
- `css`: `rgb(255, 0, 0)`
- `design`: `R:255 G:0 B:0`
- `swiftUI`: `Color(red: 1.0, green: 0.0, blue: 0.0)`
- `unformatted`: `255, 0, 0`

#### 3.1.4 可访问性检测

**文件位置**: `Extensions/WCAGCompliance.swift`, `Extensions/APCACompliance.swift`

**WCAG 标准**:
| 等级     | 对比度要求 | 适用场景                      |
| -------- | ---------- | ----------------------------- |
| AA Large | ≥ 3:1      | 大号文本 (18pt+ 或 14pt 粗体) |
| AA       | ≥ 4.5:1    | 正常文本                      |
| AAA      | ≥ 7:1      | 高对比度要求                  |

**APCA 标准**:
- 基础文本 (Lc ≥ 30)
- 大文本 (Lc ≥ 45)
- 标题 (Lc ≥ 60)
- 图形 (Lc ≥ 75)

### 3.2 用户交互流程

```
┌──────────────────────────────────────────────────────────────┐
│                      用户交互流程图                            │
└──────────────────────────────────────────────────────────────┘

1. 启动应用
   │
   ├── [首次启动] → 显示 Splash 欢迎窗口
   │                ├── 设置全局快捷键
   │                ├── 启动登录项设置
   │                └── "Get Started" 关闭
   │
   └── [后续启动] → 显示主窗口 / 隐藏到状态栏

2. 取色操作
   │
   ├── 快捷键触发 (⌘D / ⌘⇧D)
   │    │
   │    └── 隐藏主窗口 → 显示取色光标 → 拾取颜色
   │         │
   │         ├── [启用] 显示取色悬浮窗 → 显示颜色值
   │         ├── [启用] 自动复制到剪贴板
   │         └── 显示主窗口
   │
   └── 状态栏点击 → 切换主窗口显示/隐藏

3. 颜色操作
   │
   ├── 复制颜色 (⌘C / ⌘⇧C)
   │    └── 复制当前格式颜色值到剪贴板
   │
   ├── 切换格式 (⌘1-6)
   │    └── 切换显示的颜色格式
   │
   ├── 交换颜色 (X)
   │    └── 前景色 ↔ 背景色
   │
   └── 撤销/重做 (⌘Z / ⌘⇧Z)
        └── 撤销/重做颜色变更

4. 偏好设置
   │
   └── ⌘, 打开设置窗口
        ├── 通用设置 (启动项、beta更新)
        ├── 选取设置 (取色时隐藏、悬浮窗)
        ├── 应用模式 (菜单栏/Dock/隐藏)
        ├── 外观设置 (WCAG/APCA 标准切换)
        ├── 复制设置 (导出格式)
        ├── 颜色格式 (颜色空间选择)
        └── 全局快捷键
```

### 3.3 数据处理逻辑

#### 3.3.1 颜色状态管理

```swift
// 核心状态 - Eyedroppers
class Eyedroppers: ObservableObject {
    @Published var foreground = Eyedropper(...)  // 前景色
    @Published var background = Eyedropper(...) // 背景色
}

// 单个取色器状态
class Eyedropper: ObservableObject {
    @Published var color: NSColor           // 当前颜色
    var undoManager: UndoManager?            // 撤销管理器
    var closestVector: ClosestVector!         // 最近颜色查找
}
```

#### 3.3.2 用户设置存储

```swift
// Defaults.swift 中的所有设置项
extension Defaults.Keys {
    static let colorFormat = Key<ColorFormat>("colorFormat", default: .hex)
    static let copyFormat = Key<CopyFormat>("copyFormat", default: .css)
    static let appMode = Key<AppMode>("appMode", default: .menubar)
    static let appFloating = Key<Bool>("appFloating", default: true)
    static let hidePikaWhilePicking = Key<Bool>("hidePikaWhilePicking", default: false)
    static let copyColorOnPick = Key<Bool>("copyColorOnPick", default: false)
    static let showColorOverlay = Key<Bool>("showColorOverlay", default: true)
    static let colorOverlayDuration = Key<Double>("colorOverlayDuration", default: 2.0)
    static let contrastStandard = Key<ContrastStandard>("contrastStandard", default: .wcag)
    static let colorSpace = NSSecureCodingKey<NSColorSpace>(...)
    // ... 更多设置
}
```

**Electron 实现对应**:
```typescript
// 使用 electron-store 存储
interface UserSettings {
  colorFormat: 'hex' | 'rgb' | 'hsb' | 'hsl' | 'lab' | 'opengl';
  copyFormat: 'css' | 'design' | 'swiftui' | 'unformatted';
  appMode: 'menubar' | 'regular' | 'hidden';
  appFloating: boolean;
  hidePikaWhilePicking: boolean;
  copyColorOnPick: boolean;
  showColorOverlay: boolean;
  colorOverlayDuration: number;
  contrastStandard: 'wcag' | 'apca';
  colorSpace: string;
  // ... 更多
}
```

#### 3.3.3 颜色名称匹配

**文件位置**: `Utilities/ClosestVector.swift`, `Utilities/LoadColors.swift`

- 加载 `ColorNames.json` 中的颜色名称库
- 使用向量计算找到最接近的颜色名称
- 支持最近颜色自动补全

### 3.4 关键业务规则

#### 3.4.1 应用模式

```swift
enum AppMode: String, Codable {
    case menubar = "菜单栏模式"      // 显示在状态栏
    case regular = "标准模式"        // 显示在 Dock
    case hidden = "隐藏模式"        // 完全隐藏
}
```

#### 3.4.2 URL Scheme 协议

支持 `pika://` 协议触发操作:

```
# 取色
pika://pick/foreground
pika://pick/background
pika://pick/foreground/hex

# 复制
pika://copy/foreground
pika://copy/background
pika://copy/text
pika://copy/json

# 格式切换
pika://format/hex
pika://format/rgb
pika://format/hsb

# 操作
pika://swap
pika://undo
pika://redo
```

#### 3.4.3 键盘快捷键

| 操作       | 快捷键      |
| ---------- | ----------- |
| 取色-前景  | ⌘ D         |
| 取色-背景  | ⌘ ⇧ D       |
| 复制-前景  | ⌘ C         |
| 复制-背景  | ⌘ ⇧ C       |
| 系统取色器 | ⌘ S / ⌘ ⇧ S |
| 切换格式   | ⌘ 1-6       |
| 交换颜色   | X           |
| 撤销/重做  | ⌘ Z / ⌘ ⇧ Z |

---

## 四、Electron 复刻架构建议

### 4.1 项目结构

```
pika-electron/
├── src/
│   ├── main/                    # 主进程
│   │   ├── index.ts            # 入口
│   │   ├── window.ts           # 窗口管理
│   │   ├── ipc.ts              # IPC 通信
│   │   ├── shortcuts.ts        # 全局快捷键
│   │   ├── eyedropper.ts       # 取色功能
│   │   ├── store.ts            # 持久化存储
│   │   └── updater.ts          # 自动更新
│   │
│   ├── renderer/                # 渲染进程 (React)
│   │   ├── App.tsx             # 根组件
│   │   ├── components/          # UI 组件
│   │   │   ├── ColorPicker/
│   │   │   ├── ColorDisplay/
│   │   │   ├── Preferences/
│   │   │   ├── Visualization/
│   │   │   └── ...
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── stores/             # 状态管理
│   │   ├── utils/              # 工具函数
│   │   │   ├── color.ts        # 颜色转换
│   │   │   ├── wcag.ts         # WCAG 检测
│   │   │   └── apca.ts         # APCA 检测
│   │   └── styles/             # 样式
│   │
│   └── preload/                 # 预加载脚本
│       └── index.ts
│
├── public/                     # 静态资源
├── assets/                     # 资源文件
├── package.json
├── electron-builder.yml
└── tsconfig.json
```

### 4.2 核心模块映射

| 原 Swift 模块     | Electron 实现                     |
| ----------------- | --------------------------------- |
| AppDelegate       | main/index.ts                     |
| Eyedroppers       | main/eyedropper.ts                |
| ContentView       | renderer/App.tsx                  |
| ColorPickers      | renderer/components/ColorPicker   |
| PreferencesView   | renderer/components/Preferences   |
| WCAGCompliance    | renderer/utils/wcag.ts            |
| Visualisation     | renderer/components/Visualization |
| PikaWindow        | main/window.ts                    |
| KeyboardShortcuts | main/shortcuts.ts                 |
| Defaults          | main/store.ts                     |

---

## 五、总结

Pika 是一款功能完整的 macOS 原生取色器，其核心价值在于：

1. **简洁的 UI 设计**: 前后景双颜色显示 + 底部操作栏
2. **丰富的格式支持**: 6 种颜色格式 + 4 种导出风格
3. **强大的可访问性**: WCAG + APCA 双重标准检测
4. **高效的交互**: 全局快捷键 + URL Scheme 自动化
5. **美观的视觉**: Metal GPU 加速的颜色可视化

复刻为 Electron 时，建议保持核心交互逻辑不变，使用 React + TypeScript 重构 UI 层，主进程处理系统级功能（取色、快捷键、全局窗口）。
