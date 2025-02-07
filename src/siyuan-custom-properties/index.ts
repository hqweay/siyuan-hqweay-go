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

    let content = properties
      .map((property) => {
        const [key, value] = property.split("|");
        return `${value ? `" ${value} " attr(${key})` : `attr(${key})`}`;
      })
      .join(``);

    let styleElement = document.createElement("style");
    styleElement.id = this.id;
    styleElement.textContent = `
.protyle-wysiwyg.protyle-wysiwyg--attr::before {
    content: ${content};
    font-size: small;
    color: brown;
}
`;

    document.head.appendChild(styleElement);
  }
}
