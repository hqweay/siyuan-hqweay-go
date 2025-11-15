// swift-tools-version:5.8
import PackageDescription

let package = Package(
    name: "swiftOCR",
    platforms: [
        .macOS(.v13)
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "swiftOCR",
            dependencies: []
        )
    ]
)