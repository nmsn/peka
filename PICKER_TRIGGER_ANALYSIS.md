# Pika "选择前景色" 功能触发链分析

本文档详细分析点击"选择前景色"按钮后的完整代码执行流程，为 Electron 复刻提供技术参考。

---

## 一、触发链路概览

```
用户点击按钮
    │
    ▼
EyedropperButton (UI层)
    │  action: eyedropper.type.pickSelector
    ▼
AppDelegate.triggerPickForeground (应用层)
    │  @IBAction + 发送通知
    ▼
NotificationCenter 通知广播
    │
    ├──▶ ContentView 监听 (触发 eyedroppers.foreground.start())
    │
    └──▶ KeyboardShortcutItem 监听 (高亮快捷键提示)
    │
    └──▶ 其他监听者...
    │
Eyedropper.start() (核心取色逻辑)
    │
    ├── 隐藏主窗口 (可选)
    ├── NSColorSampler.show() (系统取色器)
    │
    ▼ 取色完成回调
    │
    ├── 显示取色悬浮窗 (可选)
    ├── 设置颜色 Eyedropper.set()
    ├── 自动复制到剪贴板 (可选)
    └── 显示主窗口 (可选)
```

---

## 二、核心组件详情

### 2.1 触发入口：EyedropperButton

**文件**: `Pika/Views/EyedropperButton.swift`

```swift
// 第 17-18 行：按钮点击事件
Button(action: {
    NSApp.sendAction(eyedropper.type.pickSelector, to: nil, from: nil)
}, label: { ... })
```

**关键点**:
- `eyedropper.type` = `foreground`
- `pickSelector` = `#selector(AppDelegate.triggerPickForeground)`
- 使用 `NSApp.sendAction` 转发到 AppDelegate

---

### 2.2 处理入口：AppDelegate

**文件**: `Pika/AppDelegate.swift`

```swift
// 第 371-373 行
@IBAction func triggerPickForeground(_: Any) {
    notificationCenter.post(
        name: Notification.Name(PikaConstants.ncTriggerPickForeground),
        object: self
    )
}
```

**关键点**:
- 使用 `NotificationCenter` 发布通知
- 通知名称: `ncTriggerPickForeground` = `"triggerPickForeground"`

---

### 2.3 通知监听：ContentView

**文件**: `Pika/Views/ContentView.swift`

ContentView 通过以下方式间接监听（通过 eyedroppers 对象）:

```swift
// eyedroppers 作为 EnvironmentObject 被 ContentView 使用
@EnvironmentObject var eyedroppers: Eyedroppers
```

实际的取色逻辑在 `Eyedropper.start()` 方法中实现。

---

### 2.4 核心取色逻辑：Eyedropper.start()

**文件**: `Pika/Utilities/Eyedroppers.swift`

```swift
// 第 108-152 行
func start() {
    // 1. 如果设置了取色时隐藏应用
    if Defaults[.hidePikaWhilePicking] {
        if NSApp.mainWindow?.isVisible == true {
            forceShow = true
        }
        NSApp.sendAction(#selector(AppDelegate.hidePika), to: nil, from: nil)
    }

    // 2. 延迟后启动系统取色器
    DispatchQueue.main.asyncAfter(deadline: .now()) {
        let sampler = NSColorSampler()
        sampler.show { selectedColor in
            // 3. 取色完成回调
            if let selectedColor = selectedColor {
                
                // 3.1 显示取色悬浮窗（可选）
                if Defaults[.showColorOverlay] {
                    let colorText = selectedColor.toFormat(
                        format: Defaults[.colorFormat],
                        style: Defaults[.copyFormat]
                    )
                    let cursorPosition = NSEvent.mouseLocation
                    self.overlayWindow.show(
                        colorText: colorText,
                        pickedColor: selectedColor,
                        nearCursor: cursorPosition,
                        duration: Defaults[.colorOverlayDuration]
                    )
                }

                // 3.2 设置颜色
                self.set(selectedColor)

                // 3.3 自动复制或显示主窗口
                if Defaults[.copyColorOnPick] {
                    NSApp.sendAction(self.type.copySelector, to: nil, from: nil)
                } else {
                    NSApp.sendAction(#selector(AppDelegate.showPika), to: nil, from: nil)
                }
            }

            // 4. 恢复显示主窗口
            if self.forceShow {
                self.forceShow = false
                NSApp.sendAction(#selector(AppDelegate.showPika), to: nil, from: nil)
            }

            // 5. 打开系统颜色面板（如果可见）
            let panel = NSColorPanel.shared
            if panel.isVisible {
                self.picker()
            }
        }
    }
}
```

**核心步骤**:
| 步骤 | 操作 | 可配置项 |
|------|------|----------|
| 1 | 隐藏主窗口 | `hidePikaWhilePicking` |
| 2 | 启动 NSColorSampler | 系统 API |
| 3.1 | 显示悬浮窗 | `showColorOverlay` |
| 3.2 | 设置颜色 | 内置 |
| 3.3 | 自动复制 | `copyColorOnPick` |
| 4 | 恢复显示 | 内置 |

---

### 2.5 设置颜色：Eyedropper.set()

**文件**: `Pika/Utilities/Eyedroppers.swift`

```swift
// 第 74-81 行
func set(_ selectedColor: NSColor) {
    // 注册撤销操作
    let previousColor = color
    undoManager?.registerUndo(withTarget: self) { _ in
        self.set(previousColor)
    }

    // 应用颜色空间转换并设置颜色
    color = selectedColor.usingColorSpace(Defaults[.colorSpace])!
}
```

---

### 2.6 取色悬浮窗：ColorPickOverlayWindow

**文件**: `Pika/Utilities/ColorPickOverlayWindow.swift`

```swift
// 第 10-121 行
func show(colorText: String, pickedColor: NSColor, nearCursor cursorPosition: NSPoint, duration: Double) {
    // 1. 创建信息面板 (显示颜色值)
    // 2. 创建十字准星面板
    // 3. 定位到鼠标位置附近
    // 4. 设置自动消失计时器
}
```

**显示内容**:
- 颜色文本（如 `#FF0000`）
- 颜色预览圆圈
- 十字准星

---

## 三、相关设置项

**文件**: `Pika/Constants/Defaults.swift`

| 设置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `hidePikaWhilePicking` | Bool | false | 取色时隐藏主窗口 |
| `showColorOverlay` | Bool | true | 显示取色悬浮窗 |
| `colorOverlayDuration` | Double | 2.0 | 悬浮窗显示时长(秒) |
| `copyColorOnPick` | Bool | false | 取色后自动复制 |
| `colorFormat` | ColorFormat | .hex | 默认颜色格式 |

---

## 四、Electron 复刻实现要点

### 4.1 核心流程映射

| Swift 原实现 | Electron 实现建议 |
|--------------|------------------|
| NSApp.sendAction | IPC 通信 (ipcRenderer.invoke) |
| NotificationCenter | EventEmitter / 自定义事件 |
| NSColorSampler | screen.getPixelColor / screenshot |
| NSColorPanel | react-colorful 或自定义颜色面板 |
| ColorPickOverlayWindow | 透明浮层 + HTML/CSS |
| NSWindow | BrowserWindow (frameless) |
| UndoManager | 历史栈 (history array) |

### 4.2 伪代码实现

```typescript
// 主进程
ipcMain.handle('pick-color', async (event, type: 'foreground' | 'background') => {
  // 1. 可选：隐藏主窗口
  if (settings.hidePikaWhilePicking) {
    mainWindow.hide();
  }

  // 2. 使用 screen capture 获取鼠标位置颜色
  const color = await screenColorPicker.start();

  // 3. 发送颜色到渲染进程
  mainWindow.webContents.send('color-picked', { type, color });

  // 4. 显示悬浮窗
  if (settings.showColorOverlay) {
    overlayWindow.show(color);
  }

  // 5. 自动复制
  if (settings.copyColorOnPick) {
    clipboard.writeText(color.format(settings.colorFormat));
  }
});

// 渲染进程
function onPickForeground() {
  ipcRenderer.invoke('pick-color', 'foreground');
}

ipcRenderer.on('color-picked', (event, { type, color }) => {
  if (type === 'foreground') {
    foregroundColor = color;
  } else {
    backgroundColor = color;
  }
});
```

### 4.3 取色关键 API

```typescript
// 方案1: 使用 robotjs
import robot from 'robotjs';
const color = robot.getPixelColor(mouse.x, mouse.y);
// 返回 hex 格式

// 方案2: 使用 screenshot-desktop
import screenshot from 'screenshot-desktop';
const img = await screenshot({ format: 'raw' });
const pixel = img.getPixel(x, y);

// 方案3: 使用 native-screenshots (推荐)
import { captureScreen } from 'native-screenshots';
const image = await captureScreen();
const color = image.getPixelAt(x, y);
```

---

## 五、完整流程时序图

```
用户点击按钮
      │
      ▼
┌─────────────────────────────────────────┐
│         EyedropperButton                 │
│  NSApp.sendAction(pickSelector)         │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│         AppDelegate                      │
│  triggerPickForeground()                 │
│  NotificationCenter.post()              │
└─────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│         Notification 广播                 │
│  ncTriggerPickForeground                │
└─────────────────────────────────────────┘
      │
      ├──────────────────┬──────────────────┐
      ▼                  ▼                  ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
│ Eyedropper  │  │ Shortcut    │  │ (其他监听者)     │
│ .start()    │  │ 快捷键高亮  │  │                 │
└─────────────┘  └─────────────┘  └─────────────────┘
      │
      ▼
┌─────────────────────────────────────────┐
│         NSColorSampler.show()           │
│  系统取色器启动                          │
└─────────────────────────────────────────┘
      │
      ▼ (用户选择颜色)
┌─────────────────────────────────────────┐
│         取色完成回调                     │
│  1. overlayWindow.show()                │
│  2. eyedropper.set(color)               │
│  3. clipboard.copy()                   │
└─────────────────────────────────────────┘
```

---

## 六、相关文件索引

| 文件路径 | 功能 |
|----------|------|
| `Pika/Views/EyedropperButton.swift` | 取色按钮 UI |
| `Pika/Utilities/Eyedroppers.swift` | 取色器核心逻辑 |
| `Pika/Utilities/ColorPickOverlayWindow.swift` | 悬浮窗管理 |
| `Pika/Views/ColorPickOverlay.swift` | 悬浮窗视图 |
| `Pika/AppDelegate.swift` | 应用入口处理 |
| `Pika/Constants/Constants.swift` | 通知名称常量 |
| `Pika/Constants/Defaults.swift` | 设置项定义 |
