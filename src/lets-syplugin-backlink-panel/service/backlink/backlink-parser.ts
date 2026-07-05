/**
 * backlink-parser.ts — Markdown/DOM parsing helpers and anchor extraction
 * extracted from backlink-data.ts to separate concerns.
 */

import { isStrBlank, isStrNotBlank } from "@/lets-syplugin-backlink-panel/utils/string-util";
import { stringToDom } from "@/lets-syplugin-backlink-panel/utils/html-util";
import { NewNodeID } from "@/lets-syplugin-backlink-panel/utils/siyuan-util";
import { isSetNotEmpty } from "@/lets-syplugin-backlink-panel/utils/array-util";


// ─── Block ID extraction from DOM string ──────────────────────────────────────

export function getBacklinkBlockId(dom: string): string {
    if (isStrBlank(dom)) {
        return NewNodeID();
    }
    let backklinkDom = stringToDom(dom);
    if (!backklinkDom) {
        return NewNodeID();
    }
    let id = backklinkDom.getAttribute("data-node-id");
    if (isStrBlank(id)) {
        return NewNodeID();
    }
    return id;
}


// ─── Ref Block ID extraction from Markdown ────────────────────────────────────

export function getRefBlockId(markdown: string): string[] {
    const matches = [];
    if (!markdown) {
        return matches;
    }

    let regex = /\(\((\d{14}-\w{7})\s['"][^'"]+['"]\)\)/g;
    let match;
    while ((match = regex.exec(markdown)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}


// ─── Dynamic/Static Anchor Map Updates ────────────────────────────────────────

export function updateDynamicAnchorMap(map: Map<string, Set<string>>, markdown: string) {
    let regex = /\(\((\d{14}-\w{7})\s'([^']+)'\)\)/g;
    let match;
    while ((match = regex.exec(markdown)) !== null) {
        let id = match[1];
        let anchor = match[2];
        if (id && anchor) {
            let anchorSet = map.get(id);
            anchorSet = anchorSet ? anchorSet : new Set<string>();
            anchorSet.add(anchor);
            map.set(id, anchorSet);
        }
    }
}

export function updateStaticAnchorMap(map: Map<string, Set<string>>, markdown: string) {
    let regex = /\(\((\d{14}-\w{7})\s"([^"]+)"\)\)/g;
    let match;
    while ((match = regex.exec(markdown)) !== null) {
        let id = match[1];
        let anchor = match[2];
        if (id && anchor) {
            let anchorSet = map.get(id);
            anchorSet = anchorSet ? anchorSet : new Set<string>();
            anchorSet.add(anchor);
            map.set(id, anchorSet);
        }
    }
}


// ─── Keyword Formatting ──────────────────────────────────────────────────────

export function formatBacklinkDocApiKeyword(keyword: string): string {
    if (isStrBlank(keyword)) {
        return "";
    }
    let keywordSplitArray = keyword.split("'");
    let longestSubstring = "";
    for (const substring of keywordSplitArray) {
        if (substring.length > longestSubstring.length) {
            longestSubstring = substring;
        }
    }
    longestSubstring = longestSubstring.substring(0, 80);
    return longestSubstring;
}
