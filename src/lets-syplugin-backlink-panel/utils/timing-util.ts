export function delayedTwiceRefresh(executeFun: () => void, firstTimeout: number) {
    if (!executeFun) {
        return;
    }
    if (!firstTimeout) {
        firstTimeout = 0;
    }
    let refreshPreviewHighlightTimeout = 140;
    setTimeout(() => {
        executeFun();

        if (
            refreshPreviewHighlightTimeout &&
            refreshPreviewHighlightTimeout > 0
        ) {
            setTimeout(() => {
                executeFun();
            }, refreshPreviewHighlightTimeout);
        }

    }, firstTimeout);
}


