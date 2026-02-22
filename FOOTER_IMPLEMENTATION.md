# Footer 底部组件实现指南

本文档详细说明 Pika 项目中底部灰色区域（Footer）的实现细节，包括布局结构、样式规格、组件层级等，为 Electron/React 实现提供参考。

---

## 一、组件结构概览

### 1.1 整体布局

```
┌─────────────────────────────────────────────────────────────────┐
│                         Footer 区域                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌───────────────────────┐   │   ┌───────────────────────────┐ │
│   │   对比度比率区域      │   │   │   合规状态区域            │ │
│   │                      │   │   │                           │ │
│   │  Contrast Ratio      │   │   │   WCAG / APCA            │ │
│   │  21:1                │   │   │   ✓ AA  ✓ AAA            │ │
│   │                      │   │   │   ✓ AA  ✓ AAA            │ │
│   └───────────────────────┘   │   └───────────────────────────┘ │
│                                 │                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 组件层级

```
Footer (主容器)
├── HStack (水平布局)
│   ├── VStack (左侧: 对比度)
│   │   ├── Text (标签: "Contrast Ratio" / "Lightness Contrast")
│   │   └── HStack (比率数值: "21" + ":" + "1")
│   │
│   ├── Divider (垂直分割线)
│   │
│   └── VStack (右侧: 合规状态)
│       ├── Text (标签: "WCAG Compliance" / "APCA Compliance")
│       │
│       └── ComplianceToggleGroup
│           ├── ComplianceToggle (AA)
│           ├── ComplianceToggle (AAA)
│           └── ...
```

---

## 二、样式规格

### 2.1 容器样式

| 属性 | 值 |
|------|-----|
| **高度** | 50px |
| **宽度** | 100% (maxWidth: infinity) |
| **水平内边距** | 12px |
| **背景** | 毛玻璃效果 (NSVisualEffectView.Material.underWindowBackground) |
| **混合模式** | behindWindow |
| **对齐** | leading (左对齐) |

### 2.2 布局间距

| 元素 | 值 |
|------|-----|
| **HStack 间距** | 16px |
| **左侧 VStack 内部间距** | 0px |
| **右侧 VStack 内部间距** | 3px |

### 2.3 对比度比率区域

| 元素 | 字体 | 大小 | 权重 | 颜色 |
|------|------|------|------|------|
| 标签 ("Contrast Ratio") | Caption | 默认 | Semibold | secondary |
| 比率数值 | System | 18px | 默认 | primary |
| ":" 分隔符 | System | 18px | 默认 | secondary |
| "1" | System | 18px | 默认 | secondary |

### 2.4 合规状态区域

| 元素 | 字体 | 大小 | 权重 | 颜色 |
|------|------|------|------|------|
| 标签 ("WCAG") | Caption | 默认 | Semibold | secondary |

---

## 三、ComplianceToggle 组件规格

### 3.1 单个 Toggle 样式

```swift
HStack(spacing: 2.0) {
    IconImage (checkmark.circle.fill / xmark.circle)
    Text (标签)
}
```

| 属性 | Full 模式 | Small 模式 |
|------|-----------|------------|
| **图标尺寸** | 14x14 px | 13x13 px |
| **图标间距** | 2px | 2px |
| **文本样式** | 默认 | 10px |

### 3.2 图标状态

| 状态 | 图标 | 颜色 |
|------|------|------|
| **合规 (isCompliant: true)** | checkmark.circle.fill | primary |
| **不合规 (isCompliant: false)** | xmark.circle | secondary |

---

## 四、WCAG 合规标准

### 4.1 WCAG 模式 (两种主题)

**主题 1: Weight (按权重)**

```
Normal:     [✓ AA] [✓ AAA]
Large Text: [✓ AA] [✓ AAA]
```

**主题 2: Contrast (按对比度)**

```
[✓ AA] [✓ AA/AAA] [✓ AAA]
   3:1      4.5:1       7:1
```

### 4.2 WCAG 对比度标准

| 标准 | 对比度要求 | 适用场景 |
|------|-----------|---------|
| AA Normal | ≥ 4.5:1 | 正常文本 (14pt 常规 或 18pt 粗体) |
| AA Large | ≥ 3:1 | 大文本 (18pt+ 常规 或 14pt+ 粗体) |
| AAA Normal | ≥ 7:1 | 高对比度要求 |
| AAA Large | ≥ 4.5:1 | 大文本高对比度 |

### 4.3 APCA 模式

```
[✓ Baseline] [✓ Headline] [✓ Title] [✓ Body]
    Lc ≥ 30      Lc ≥ 45     Lc ≥ 60   Lc ≥ 75
```

---

## 五、Electron/React 实现

### 5.1 组件结构建议

```tsx
// Footer.tsx
export const Footer = ({ foreground, background }) => {
  const contrastRatio = calculateContrastRatio(foreground, background);
  const wcagCompliance = calculateWCAG(foreground, background);
  const apcaCompliance = calculateAPCA(foreground, background);
  const contrastStandard = useSettings('contrastStandard');

  return (
    <footer className="footer">
      {/* 左侧: 对比度 */}
      <div className="contrast-section">
        <span className="label">
          {contrastStandard === 'wcag' ? 'Contrast Ratio' : 'Lightness Contrast'}
        </span>
        <div className="ratio-value">
          <span className="number">{contrastRatio}</span>
          {contrastStandard === 'wcag' && (
            <>
              <span className="separator">:</span>
              <span className="one">1</span>
            </>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* 右侧: 合规状态 */}
      <div className="compliance-section">
        <span className="label">
          {contrastStandard === 'wcag' ? 'WCAG Compliance' : 'APCA Compliance'}
        </span>
        <ComplianceToggleGroup
          compliance={contrastStandard === 'wcag' ? wcagCompliance : apcaCompliance}
          type={contrastStandard}
        />
      </div>
    </footer>
  );
};
```

### 5.2 CSS 样式

```css
/* Footer 容器 */
.footer {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  height: 50px;
  padding: 0 12px;
  background: rgba(..., 0.5);  /* 毛玻璃效果 */
  backdrop-filter: blur(20px);
  -webkit-app-region: no-drag;
}

/* 左侧对比度区域 */
.contrast-section {
  display: flex;
  flex-direction: column;
  gap: 0px;
}

.contrast-section .label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.ratio-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.ratio-value .number {
  font-size: 18px;
  color: var(--text-primary);
}

.ratio-value .separator,
.ratio-value .one {
  font-size: 18px;
  color: var(--text-secondary);
}

/* 分割线 */
.divider {
  width: 1px;
  height: 100%;
  background: var(--divider);
}

/* 右侧合规区域 */
.compliance-section {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.compliance-section .label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* 合规 Toggle */
.compliance-toggle {
  display: flex;
  align-items: center;
  gap: 2px;
}

.compliance-toggle .icon {
  width: 14px;
  height: 14px;
}

.compliance-toggle.compliant .icon,
.compliance-toggle.compliant .text {
  color: var(--text-primary);
}

.compliance-toggle:not(.compliant) .icon,
.compliance-toggle:not(.compliant) .text {
  color: var(--text-secondary);
}
```

### 5.3 对比度计算实现

```typescript
// utils/contrast.ts

// WCAG 对比度计算
export function calculateContrastRatio(foreground: string, background: string): number {
  const fg = hexToRGB(foreground);
  const bg = hexToRGB(background);

  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// 相对亮度计算 (WCAG 公式)
function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// APCA 对比度计算
export function calculateAPCA(foreground: string, background: string): number {
  const fg = hexToRGB(foreground);
  const bg = hexToRGB(background);

  const lcFg = getAPCALuminance(fg);
  const lcBg = getAPCALuminance(bg);

  return lcBg - lcFg;
}

// APCA 亮度计算
function getAPCA luminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.40445 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG 合规判断
export function getWCAGCompliance(ratio: number) {
  return {
    ratio30: ratio >= 3.0,    // AA Large
    ratio45: ratio >= 4.5,    // AA Normal
    ratio70: ratio >= 7.0     // AAA
  };
}

// APCA 合规判断
export function getAPCACompliance(value: number) {
  const absValue = Math.abs(value);
  return {
    value,
    baseline: absValue >= 30,
    headline: absValue >= 45,
    title: absValue >= 60,
    body: absValue >= 75
  };
}
```

---

## 六、相关文件索引

| 文件 | 功能 |
|------|------|
| `Pika/Views/Footer.swift` | Footer 主组件 |
| `Pika/Views/ComplianceToggleGroup.swift` | 合规 Toggle 组 |
| `Pika/Views/ComplianceToggle.swift` | 单个合规 Toggle |
| `Pika/Views/ComplianceButtons.swift` | 预览按钮 (偏好设置页) |
| `Pika/Extensions/WCAGCompliance.swift` | WCAG 计算扩展 |
| `Pika/Extensions/APCACompliance.swift` | APCA 计算扩展 |

---

## 七、核心 Swift 代码参考

### 7.1 Footer 主组件

```swift
struct Footer: View {
    @ObservedObject var foreground: Eyedropper
    @ObservedObject var background: Eyedropper

    var body: some View {
        HStack(spacing: 16.0) {
            // 对比度区域
            VStack(alignment: .leading, spacing: 0.0) {
                Text(contrastHeader)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                Text("\(colorContrastRatio)")
                    .font(.system(size: 18))
            }

            Divider()

            // 合规区域
            VStack(alignment: .leading, spacing: 3.0) {
                Text(complianceLabel)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                ComplianceToggleGroup(...)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: 50.0)
        .padding(.horizontal, 12.0)
        .background(VisualEffect(
            material: .underWindowBackground,
            blendingMode: .behindWindow
        ))
    }
}
```

### 7.2 VisualEffect 封装

```swift
struct VisualEffect: NSViewRepresentable {
    let material: NSVisualEffectView.Material
    let blendingMode: NSVisualEffectView.BlendingMode

    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = material
        view.blendingMode = blendingMode
        return view
    }

    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {}
}
```
