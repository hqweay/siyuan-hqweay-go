import Foundation
import Vision
import AppKit

// 检查参数
guard CommandLine.arguments.count > 1 else {
    print("Usage: swiftOCR /path/to/image.png")
    exit(1)
}

let imagePath = CommandLine.arguments[1]
guard let nsImage = NSImage(contentsOfFile: imagePath),
    let tiffData = nsImage.tiffRepresentation else {
    print("Failed to load image")
    exit(1)
}
 
// 设置 OCR 请求
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate

request.recognitionLanguages = ["zh-Hans", "en"]

request.usesLanguageCorrection = true

let requestHandler = VNImageRequestHandler(data: tiffData, options: [:])

do {
    try requestHandler.perform([request])
    
    var results: [String] = []
    if let observations = request.results as? [VNRecognizedTextObservation] {
        for obs in observations {
            if let candidate = obs.topCandidates(1).first {
                results.append(candidate.string)
            }
        }
    }
    
    // 输出 UTF-8 文本
    let output = results.joined(separator: "\n")
    if let data = output.data(using: .utf8) {
        FileHandle.standardOutput.write(data)
    }
    
} catch {
    print("OCR failed: \(error.localizedDescription)")
    exit(1)
}