use framework "AppKit"
use framework "Foundation"
use framework "Vision"
use scripting additions

-- 从命令行参数获取图片路径
on run argv
    set imagePath to item 1 of argv
    return getImageText(imagePath)
end run

on getImageText(imagePath)
    -- 加载图片
    set theImage to current application's NSImage's alloc()'s initWithContentsOfFile:imagePath
    
    -- 创建请求处理器
    set requestHandler to current application's VNImageRequestHandler's alloc()'s initWithData:(theImage's TIFFRepresentation()) options:(current application's NSDictionary's alloc()'s init())
    
    set theRequest to current application's VNRecognizeTextRequest's alloc()'s init()
    -- 设置识别精度
    theRequest's recognitionLevel = current application's VNRequestTextRecognitionLevelAccurate

    -- 设置识别语言
    -- set langArray to current application's NSArray's arrayWithObjects: ("zh-Hans", "en", missing value)
    set theRequest's recognitionLanguages to ("zh-Hans", "en")

    -- 是否开启语言校正
    theRequest's usesLanguageCorrection = true
    
    -- 执行请求
    requestHandler's performRequests:(current application's NSArray's arrayWithObject:(theRequest)) |error|:(missing value)
    set theResults to theRequest's results()
    
    -- 处理结果
    set theText to ""
    repeat with observation in theResults
        set theText to theText & ((first item in (observation's topCandidates:1))'s |string|() as text) & linefeed
    end repeat
    
    -- 返回文本，AppleScript 列表转换成字符串
    return (theText as string)
end getImageText