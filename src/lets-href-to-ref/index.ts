import { settings } from "@/settings";
import { SubPluginBase } from "@/libs/sub-plugin-base";
import { getLogger } from "@/libs/logger";
import { registerCommands } from "./commands";
import {
  buildBlockGroups,
  buildPageGroups,
  getActiveDocId,
  refToLink,
  linkToRef,
  inlineToText,
  cleanSelfRef,
  cleanStarRef,
  ALL_INLINE_SELECTORS,
} from "./converters";

const log = getLogger("lets-href-to-ref");

// ─── Scope definitions for page-level (editortitleicon) sub-menu ──────────────

const PAGE_SCOPES = [
  { key: "lets-href-to-ref.headingBlocks", availableBlocks: ["NodeHeading"] },
  {
    key: "lets-href-to-ref.paragraphBlocks",
    availableBlocks: ["NodeParagraph"],
  },
  {
    key: "lets-href-to-ref.allBlocks",
    availableBlocks: ["NodeParagraph", "NodeHeading"],
  },
] as const;

// ─── Plugin class ─────────────────────────────────────────────────────────────

export default class HrefToRef extends SubPluginBase {
  /** Block types searched when iterating the document. */
  availableBlocks = ["NodeParagraph", "NodeHeading"];

  override onload(): void {
    registerCommands(this.availableBlocks);
  }

  override onunload(): void {}

  // ─── Doc title icon menu (page scope with sub-menu scope selection) ─────────

  public editortitleiconEvent({ detail }: { detail: any }): void {
    const styleNesting = settings.getBySpace("convert", "styleNesting") as boolean;

    // ── Clean self-reference ──────────────────────────────────────────────────
    detail.menu.addItem({
      iconHTML: "🧹",
      label: this.t("lets-href-to-ref.cleanRefSelf"),
      click: () => {
        const docId = getActiveDocId();
        if (!docId) return;
        const groups = buildPageGroups(detail.protyle, this.availableBlocks);
        const ops = cleanSelfRef(groups, docId);
        if (ops.length > 0) detail.protyle.getInstance().transaction(ops);
      },
    });

    // ── Clean * references ────────────────────────────────────────────────────
    detail.menu.addItem({
      iconHTML: "",
      label: this.t("lets-href-to-ref.cleanStarRef"),
      click: () => {
        const groups = buildPageGroups(detail.protyle, this.availableBlocks);
        const ops = cleanStarRef(groups);
        if (ops.length > 0) detail.protyle.getInstance().transaction(ops);
      },
    });

    // ── Convert menu (3-level: menu → scope → action) ─────────────────────────
    detail.menu.addItem({
      iconHTML: "",
      label: this.t("lets-href-to-ref.convertMenu"),
      submenu: PAGE_SCOPES.map((scope) => ({
        iconHTML: "",
        label: this.t(scope.key),
        submenu: this.buildPageActionItems(detail, scope.availableBlocks, styleNesting),
      })),
    });
  }

  // ─── Block icon menu (flat, scope = selected blocks) ─────────────────────────

  public blockIconEvent({ detail }: { detail: any }): void {
    const styleNesting = settings.getBySpace("convert", "styleNesting") as boolean;

    detail.menu.addItem({
      iconHTML: "",
      label: this.t("lets-href-to-ref.convertMenu"),
      submenu: [
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.wikiToLink"),
          click: () => {
            const groups = buildBlockGroups(
              detail.blockElements,
              this.availableBlocks
            );
            detail.protyle.getInstance().transaction(refToLink(groups));
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.linkToWiki"),
          click: () => {
            const groups = buildBlockGroups(
              detail.blockElements,
              this.availableBlocks
            );
            detail.protyle.getInstance().transaction(linkToRef(groups));
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.allInlineToText"),
          click: () => {
            this.blockInlineToTextBatch(detail, styleNesting, ALL_INLINE_SELECTORS);
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.hrefToText"),
          click: () => {
            this.blockInlineToTextBatch(detail, styleNesting, [
              '[data-type~="a"][data-href^="siyuan://"]',
              '[data-type~="block-ref"]',
            ]);
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.hrefToTextIncludeA"),
          click: () => {
            this.blockInlineToTextBatch(detail, styleNesting, [
              '[data-type~="a"]',
              '[data-type~="block-ref"]',
            ]);
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.strongToText"),
          click: () => {
            this.blockInlineToText(detail, styleNesting, '[data-type~="strong"]');
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.markToText"),
          click: () => {
            this.blockInlineToText(detail, styleNesting, '[data-type~="mark"]');
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.tagToText"),
          click: () => {
            this.blockInlineToText(detail, styleNesting, '[data-type~="tag"]');
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.italicToText"),
          click: () => {
            this.blockInlineToText(detail, styleNesting, '[data-type~="em"]');
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.uToText"),
          click: () => {
            this.blockInlineToText(detail, styleNesting, '[data-type~="u"]');
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.sToText"),
          click: () => {
            this.blockInlineToText(detail, styleNesting, '[data-type~="s"]');
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.supToText"),
          click: () => {
            this.blockInlineToText(detail, styleNesting, '[data-type~="sup"]');
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.subToText"),
          click: () => {
            this.blockInlineToText(detail, styleNesting, '[data-type~="sub"]');
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.cleanRefSelf"),
          click: () => {
            const docId = getActiveDocId();
            if (!docId) return;
            const groups = buildBlockGroups(
              detail.blockElements,
              this.availableBlocks
            );
            const ops = cleanSelfRef(groups, docId);
            if (ops.length > 0)
              detail.protyle.getInstance().transaction(ops);
          },
        },
        {
          iconHTML: "",
          label: this.t("lets-href-to-ref.cleanStarRefSimple"),
          click: () => {
            const groups = buildBlockGroups(
              detail.blockElements,
              this.availableBlocks
            );
            const ops = cleanStarRef(groups);
            if (ops.length > 0)
              detail.protyle.getInstance().transaction(ops);
          },
        },
      ],
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Build the action submenu items for the page (editortitleicon) scope menus.
   * Called once per scope entry in PAGE_SCOPES.
   */
  private buildPageActionItems(
    detail: any,
    scopeBlocks: readonly string[],
    styleNesting: boolean
  ) {
    const blocks = [...scopeBlocks];
    const pageGroups = () => buildPageGroups(detail.protyle, blocks);
    const commit = (ops: ReturnType<typeof refToLink>) => {
      if (ops.length > 0) detail.protyle.getInstance().transaction(ops);
    };

    return [
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.wikiToLink"),
        click: () => commit(refToLink(pageGroups())),
      },
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.linkToWiki"),
        click: () => commit(linkToRef(pageGroups())),
      },
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.allInlineToText"),
        click: () => {
          const groups = pageGroups();
          for (const sel of ALL_INLINE_SELECTORS) {
            commit(inlineToText(groups, sel, styleNesting));
          }
        },
      },
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.hrefToText"),
        click: () => {
          const groups = pageGroups();
          commit(
            inlineToText(
              groups,
              '[data-type~="a"][data-href^="siyuan://"]',
              styleNesting
            )
          );
          commit(inlineToText(groups, '[data-type~="block-ref"]', styleNesting));
        },
      },
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.hrefToTextIncludeA"),
        click: () => {
          const groups = pageGroups();
          commit(inlineToText(groups, '[data-type~="a"]', styleNesting));
          commit(inlineToText(groups, '[data-type~="block-ref"]', styleNesting));
        },
      },
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.strongToText"),
        click: () =>
          commit(inlineToText(pageGroups(), '[data-type~="strong"]', styleNesting)),
      },
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.markToText"),
        click: () =>
          commit(inlineToText(pageGroups(), '[data-type~="mark"]', styleNesting)),
      },
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.tagToText"),
        click: () =>
          commit(inlineToText(pageGroups(), '[data-type~="tag"]', styleNesting)),
      },
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.italicToText"),
        click: () =>
          commit(inlineToText(pageGroups(), '[data-type~="em"]', styleNesting)),
      },
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.uToText"),
        click: () =>
          commit(inlineToText(pageGroups(), '[data-type~="u"]', styleNesting)),
      },
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.sToText"),
        click: () =>
          commit(inlineToText(pageGroups(), '[data-type~="s"]', styleNesting)),
      },
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.supToText"),
        click: () =>
          commit(inlineToText(pageGroups(), '[data-type~="sup"]', styleNesting)),
      },
      {
        iconHTML: "",
        label: this.t("lets-href-to-ref.subToText"),
        click: () =>
          commit(inlineToText(pageGroups(), '[data-type~="sub"]', styleNesting)),
      },
    ];
  }

  /** Single-selector inlineToText for block context. */
  private blockInlineToText(
    detail: any,
    styleNesting: boolean,
    selector: string
  ): void {
    const groups = buildBlockGroups(detail.blockElements, this.availableBlocks);
    const ops = inlineToText(groups, selector, styleNesting);
    if (ops.length > 0) detail.protyle.getInstance().transaction(ops);
  }

  /** Multi-selector inlineToText for block context (each selector is one pass). */
  private blockInlineToTextBatch(
    detail: any,
    styleNesting: boolean,
    selectors: string[]
  ): void {
    const groups = buildBlockGroups(detail.blockElements, this.availableBlocks);
    const allOps = selectors.flatMap((sel) =>
      inlineToText(groups, sel, styleNesting)
    );
    if (allOps.length > 0) detail.protyle.getInstance().transaction(allOps);
  }
}
