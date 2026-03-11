import AppKit
import Foundation

struct CursorPoint: Codable {
    let x: Double
    let y: Double
}

struct ColorResult: Codable {
    let hex: String
    let source: String
    let cursor: CursorPoint
}

final class ColorSamplerRunner {
    private var sampler: NSColorSampler?
    private var result: ColorResult?

    func run() -> ColorResult? {
        let app = NSApplication.shared
        app.setActivationPolicy(.accessory)
        app.activate(ignoringOtherApps: true)

        sampler = NSColorSampler()
        sampler?.show { [weak self] color in
            defer { CFRunLoopStop(CFRunLoopGetMain()) }
            guard let self else { return }
            guard let color else {
                self.result = nil
                return
            }

            let rgb = color.usingColorSpace(.sRGB) ?? color
            let red = Int(round(rgb.redComponent * 255.0))
            let green = Int(round(rgb.greenComponent * 255.0))
            let blue = Int(round(rgb.blueComponent * 255.0))

            let cursorLocation = NSEvent.mouseLocation
            self.result = ColorResult(
                hex: String(format: "#%02X%02X%02X", red, green, blue),
                source: "interactive",
                cursor: CursorPoint(x: cursorLocation.x, y: cursorLocation.y)
            )
        }

        CFRunLoopRun()
        return result
    }
}

let runner = ColorSamplerRunner()
let encoder = JSONEncoder()

if let result = runner.run() {
    let data = try encoder.encode(result)
    FileHandle.standardOutput.write(data)
} else {
    FileHandle.standardOutput.write(Data("null".utf8))
}
