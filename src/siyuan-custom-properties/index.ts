import InsertCSS from "@/myscripts/insertCSS";
import { settings } from "@/settings";

export default class ShowCustomPropertiesUnderTitle extends InsertCSS {
  id = "show-custom-properties-under-title-hqweay";

  onload() {
    const customProperties = settings.getBySpace(
      "showCustomPropertiesUnderTitleConfig",
      "customProperties"
    );

    const properties = customProperties.trim().split("\n");

    if (properties.length <= 0) {
      return;
    }

    let css = ``;
    let content = "";
    let initContent = "";
    properties.forEach((property) => {
      const [key, value] = property.split("|");

      const label = key.replace("custom-", "").toLowerCase();
      css += `
            .protyle-wysiwyg.protyle-wysiwyg--attr[${key}] {
                --properties-under-title-${label}: " ${
        value ? value : ""
      } " attr(${key});
            }
        `;
      content += ` var(--properties-under-title-${label})`;
      initContent += `--properties-under-title-${label}: var(--empty);\n`;
    });

    css =
      `.protyle-wysiwyg.protyle-wysiwyg--attr {
      --empty: "";
    ${initContent}
  }` + css;
    // 生成合并内容的 ::before 规则
    css += `
        .protyle-wysiwyg.protyle-wysiwyg--attr::before {
            content: ${content}; 
            font-size: small;
            color: brown;
        }
    `;

    let styleElement = document.createElement("style");
    styleElement.id = this.id;
    styleElement.textContent = css;

    document.head.appendChild(styleElement);
  }
}
