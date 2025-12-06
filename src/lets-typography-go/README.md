更新：
- 支持选中、多选内容块格式化
- 支持全文格式化
- 链接、粗体、标注等转文本可以使用插件 [一键行内元素转换（引用、链接、标注等）](https://github.com/hqweay/siyuan-href-to-ref/tree/main)

说明：仅会对 p（段落）、b（文档块）、l（列表块）、h（标题块）内容块进行格式化。

规则：

- 中文使用全角符号
- 英文使用半角符号
- 清除空文档块
- 标准命名或自定义转换（如 mysql ➡️ MySQL，详细列表见 `standardName/config.txt`）
- ……
- 中英文插入空格请使用官方的「优化排版」

**排版规则有个人偏好，有损坏数据的风险。使用前建议做好备份**，简单效果如下：

```
* In the words of Richelle E.Goodrich:「Easter is joy, hope, love, and renewal. Easter is proof that we can begin again。」
* E.Goodrich：「Easter is joy, hope, love, and renewal. Easter is proof that we can begin again。」
* 今天是星期一,我和我的朋友小明约好了一起去爬"勇者山"。“勇者山”是我的家乡最高的山.
* 最高的山(之一)。。。

你有freestyle吗?我有「freestyle".

（one of）the highest mountains




呵呵？？
```

```
* In the words of Richelle E.Goodrich: “Easter is joy, hope, love, and renewal. Easter is proof that we can begin again。”
* E.Goodrich: “Easter is joy, hope, love, and renewal. Easter is proof that we can begin again。”
* 今天是星期一，我和我的朋友小明约好了一起去爬「勇者山」。「勇者山」是我的家乡最高的山。
* 最高的山（之一）……

你有freestyle吗？我有 “freestyle”.

(one of) the highest mountains

呵呵？
```

## 参考排版规范（包括但不限于）

- [yikeke/zh-style-guide: An open-source style guide for writing Chinese technical documents: https://zh-style-guide.readthedocs.io](https://github.com/yikeke/zh-style-guide/)
- [ruanyf/document-style-guide: 中文技术文档的写作规范](https://github.com/ruanyf/document-style-guide)
- [mzlogin/chinese-copywriting-guidelines: Chinese Copywriting Guidelines：中文文案排版指北（简体中文版）](https://github.com/mzlogin/chinese-copywriting-guidelines)
- 《GBT 15834-2011 标点符号用法》

## 说明

主要规则取自 https://github.com/Natumsol/obsidian-pangu 「统一文本内标点的使用」。插件有任何可取之处皆归功于它。