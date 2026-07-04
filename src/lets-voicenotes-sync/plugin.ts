export default {
  name: "voiceNotes",
  displayName: "lets-voiceNotes.displayName",
  description: "lets-voiceNotes.description",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "textinput",
      title: "lets-voiceNotes.token",
      description: "token",
      key: "token",
      value: ``,
      placeholder: "12345|abcdefgh",
    },
    {
      type: "textinput",
      title: "lets-voiceNotes.notebook",
      description: "lets-voiceNotes.notebook",
      key: "notebook",
      value: `20240330144726-gs2xey6`,
      placeholder: "20240330144726-gs2xey6",
    },
    {
      type: "textinput",
      title: "lets-voiceNotes.syncDirectory",
      description: "lets-voiceNotes.syncDirectory",
      key: "syncDirectory",
      value: "voicenotes",
      placeholder: "voicenotes",
    },
    {
      type: "textinput",
      title: "lets-voiceNotes.manualSyncPageCount",
      description: "lets-voiceNotes.manualSyncPageCountDesc",
      key: "manualSyncPageCount",
      value: "2",
      placeholder: "2",
    },
    {
      type: "textinput",
      title: "lets-voiceNotes.latestDataCountOfPage",
      description: "lets-voiceNotes.latestDataCountOfPageDesc",
      key: "latestDataCountOfPage",
      value: "-1",
      placeholder: "-1",
    },
    {
      type: "button",
      title: "lets-voiceNotes.fullSyncVoiceNotes",
      description: "lets-voiceNotes.fullSyncVoiceNotesDesc",
      key: "fullSyncVoiceNotes",
      value: "lets-voiceNotes.confirm",
    },
    {
      type: "checkbox",
      title: "lets-voiceNotes.formatContent",
      description: "lets-voiceNotes.formatContentDesc",
      key: "formatContent",
      value: true,
    },
    {
      type: "checkbox",
      title: "lets-voiceNotes.newLineNewBlock",
      description: "lets-voiceNotes.newLineNewBlockDesc",
      key: "newLineNewBlock",
      value: true,
    },
    {
      type: "textarea",
      title: "lets-voiceNotes.excludeTags",
      description: "lets-voiceNotes.excludeTagsDesc",
      key: "excludeTags",
      value: `siyuan,done,no`,
      placeholder: "done,no",
    },
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
  ],
};
