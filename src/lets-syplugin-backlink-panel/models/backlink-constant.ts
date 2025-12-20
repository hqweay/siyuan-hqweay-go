import { EnvConfig } from "@/lets-syplugin-backlink-panel/config/EnvConfig";

export const DefinitionBlockStatus = {
  SELECTED: "SELECTED",
  EXCLUDED: "EXCLUDED",
  OPTIONAL: "OPTIONAL",
  NOT_OPTIONAL: "NOT_OPTIONAL",
};

export function BACKLINK_BLOCK_SORT_METHOD_ELEMENT(): {
  name: string;
  value: BlockSortMethod;
}[] {
  return [
    {
      name: EnvConfig.ins.i18n.modifiedASC,
      value: "modifiedAsc",
    },
    {
      name: EnvConfig.ins.i18n.modifiedDESC,
      value: "modifiedDesc",
    },
    {
      name: EnvConfig.ins.i18n.createdASC,
      value: "createdAsc",
    },
    {
      name: EnvConfig.ins.i18n.createdDESC,
      value: "createdDesc",
    },
    {
      name: EnvConfig.ins.i18n.fileNameASC,
      value: "alphabeticAsc",
    },
    {
      name: EnvConfig.ins.i18n.fileNameDESC,
      value: "alphabeticDesc",
    },
    {
      name: "文档名称升序",
      value: "documentAlphabeticAsc",
    },
    {
      name: "文档名称降序",
      value: "documentAlphabeticDesc",
    },
  ];
}

export function CUR_DOC_DEF_BLOCK_SORT_METHOD_ELEMENT(): {
  name: string;
  value: BlockSortMethod;
}[] {
  return [
    {
      name: EnvConfig.ins.i18n.type,
      value: "typeAndContent",
    },
    {
      name: EnvConfig.ins.i18n.refCountASC,
      value: "refCountAsc",
    },
    {
      name: EnvConfig.ins.i18n.refCountDESC,
      value: "refCountDesc",
    },
  ];
}

export function CUR_DOC_DEF_BLOCK_TYPE_ELEMENT(): {
  name: string;
  value: string;
}[] {
  return [
    {
      name: "当前文档定义块",
      value: "curDocDefBlock",
    },
    {
      name: "引用其他文档的定义块",
      value: "curDocRefDefBlock",
    },
    {
      name: "上面所有",
      value: "all",
    },
  ];
}

export function RELATED_DEF_BLOCK_TYPE_ELEMENT(): {
  name: string;
  value: string;
}[] {
  return [
    {
      name: "所有",
      value: "all",
    },
    {
      name: "动态锚文本",
      value: "dynamicAnchorText",
    },
    {
      name: "静态锚文本",
      value: "staticAnchorText",
    },
  ];
}

export function RELATED_DEF_BLOCK_SORT_METHOD_ELEMENT(): {
  name: string;
  value: BlockSortMethod;
}[] {
  return [
    {
      name: EnvConfig.ins.i18n.refCountASC,
      value: "refCountAsc",
    },
    {
      name: EnvConfig.ins.i18n.refCountDESC,
      value: "refCountDesc",
    },
    {
      name: EnvConfig.ins.i18n.modifiedASC,
      value: "modifiedAsc",
    },
    {
      name: EnvConfig.ins.i18n.modifiedDESC,
      value: "modifiedDesc",
    },
    {
      name: EnvConfig.ins.i18n.createdASC,
      value: "createdAsc",
    },
    {
      name: EnvConfig.ins.i18n.createdDESC,
      value: "createdDesc",
    },
    {
      name: EnvConfig.ins.i18n.fileNameASC,
      value: "alphabeticAsc",
    },
    {
      name: EnvConfig.ins.i18n.fileNameDESC,
      value: "alphabeticDesc",
    },
  ];
}

export function RELATED_DOCMUMENT_SORT_METHOD_ELEMENT(): {
  name: string;
  value: BlockSortMethod;
}[] {
  return [
    {
      name: EnvConfig.ins.i18n.refCountASC,
      value: "refCountAsc",
    },
    {
      name: EnvConfig.ins.i18n.refCountDESC,
      value: "refCountDesc",
    },
    {
      name: EnvConfig.ins.i18n.modifiedASC,
      value: "modifiedAsc",
    },
    {
      name: EnvConfig.ins.i18n.modifiedDESC,
      value: "modifiedDesc",
    },
    {
      name: EnvConfig.ins.i18n.createdASC,
      value: "createdAsc",
    },
    {
      name: EnvConfig.ins.i18n.createdDESC,
      value: "createdDesc",
    },
    {
      name: EnvConfig.ins.i18n.fileNameASC,
      value: "alphabeticAsc",
    },
    {
      name: EnvConfig.ins.i18n.fileNameDESC,
      value: "alphabeticDesc",
    },
  ];
}
