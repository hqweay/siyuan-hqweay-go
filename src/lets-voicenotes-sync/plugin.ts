export default {
  name: "voiceNotes",
  displayName: "VoiceNotes 同步",
  description: "同步 VoiceNotes 的笔记：https://voicenotes.com",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "textinput",
      title: "Token",
      description: "token",
      key: "token",
      value: ``,
      placeholder: "12345|abcdefgh",
    },
    {
      type: "textinput",
      title: "思源笔记笔记本id",
      description: "思源笔记笔记本id",
      key: "notebook",
      value: `20240330144726-gs2xey6`,
      placeholder: "20240330144726-gs2xey6",
    },
    {
      type: "textinput",
      title: "同步的目录",
      description: "同步的目录",
      key: "syncDirectory",
      value: "voicenotes",
      placeholder: "voicenotes",
    },
    {
      type: "textinput",
      title: "手动同步时获取最新多少页数据（1页10条）",
      description:
        "小于 0 时同步全量，大于 0 时会同步配置的前多少页【建议合理配置】",
      key: "manualSyncPageCount",
      value: "2",
      placeholder: "2",
    },
    {
      type: "textinput",
      title: "全量同步最新多少页数据（1页10条）",
      description: "小于 0 时同步全量，大于 0 时会同步配置的前多少页",
      key: "latestDataCountOfPage",
      value: "-1",
      placeholder: "-1",
    },
    {
      type: "button",
      title: "全量同步一次",
      description: "点击会尝试全量同步一次笔记",
      key: "fullSyncVoiceNotes",
      value: "确认",
    },
    {
      type: "checkbox",
      title: "同步时使用中英文排版优化格式化",
      description: "同步时使用中英文排版优化格式化",
      key: "formatContent",
      value: true,
    },
    {
      type: "checkbox",
      title: "换行是否新建块",
      description: "否则当作行内换行处理",
      key: "newLineNewBlock",
      value: true,
    },
    // {
    //   type: "textinput",
    //   title: "时间格式",
    //   description: "时间格式",
    //   key: "dateFormat",
    //   placeholder: "YYYY-MM-DD HH:mm:ss",
    // },
    {
      type: "textarea",
      title: "排除标签",
      description: "同步时排除该标签下的笔记",
      key: "excludeTags",
      value: `siyuan,done,no`,
      placeholder: "done,no",
    },
    // {
    //   type: "textarea",
    //   title: "frontmatterTemplate",
    //   description: "",
    //   key: "frontmatterTemplate",
    //   value: settings.getBySpace("voiceNotes", "frontmatterTemplate"),
    //   placeholder: "",
    // },
    {
      type: "textarea",
      title: "noteTemplate",
      description: "",
      key: "noteTemplate",
      value: `{% if summary %}
## Summary

{{ summary }}
{% endif %}

{% if points %}
## Main points

{{ points }}
{% endif %}

{% if attachments %}
## Attachments

{{ attachments }}
{% endif %}

{% if tidy %}
## Tidy Transcript

{{ tidy }}

{% else %}
## Transcript

{{ transcript }}
{% endif %}

{% if todo %}
## Todos

{{ todo }}
{% endif %}

{% if email %}
## Email

{{ email }}
{% endif %}

{% if blog %}
## Blog

{{ blog }}
{% endif %}

{% if tweet %}
## Tweet

{{ tweet }}
{% endif %}

{% if custom %}
## Others

{{ custom }}
{% endif %}

{% if teamSummary %}
## Team Summary

{{ teamSummary }}
{% endif %}

{% if related_notes %}
## Related Notes

{{ related_notes }}
{% endif %}
`,
      placeholder: "",
    },
    // {
    //   type: "textarea",
    //   title: "同步过的笔记id，一般别修改",
    //   description: "",
    //   key: "syncedRecordingIds",
    //   value: settings.getBySpace("voiceNotes", "syncedRecordingIds"),
    //   placeholder: "",
    // },
  ],
};
