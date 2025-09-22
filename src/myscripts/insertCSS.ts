export default class InsertCSS {
  id: string = "";
  cssSnippets: string = "";

  onunload() {
    document.getElementById(this.id).remove()
  }

  onload() {
    let styleElement = document.createElement("style");
    //id使用思源代码片段样式
    styleElement.id = `snippetCSS-hqweay-${this.id}`;
    styleElement.textContent = this.cssSnippets;
    document.head.appendChild(styleElement);
  }
}
