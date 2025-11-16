export function cleanSpacesBetweenChineseCharacters(text) {
  return (
    text
      // 只合并连续的空格和制表符，不影响换行
      // 第一行：移除中文字符之间的空格
      .replace(/(?<=[\u4e00-\u9fa5])[ \t]+(?=[\u4e00-\u9fa5])/g, "")

      // 第二行：将多个连续空格合并为单个空格
      .replace(/ +/g, " ")
  );
}
