(function () {
    // @ts-ignore - acquireVsCodeApi is provided by the webview host
    const vscode = acquireVsCodeApi();

    // Restore previous state if available
    const previousState = vscode.getState();
    if (previousState) {
        restoreState(previousState);
    }

    // Notify extension that webview is ready
    vscode.postMessage({ type: 'ready' });

    // Listen for messages from the extension
    window.addEventListener('message', (event: MessageEvent) => {
        const message = event.data;
        switch (message.type) {
            case 'update': {
                const container = document.querySelector('.placeholder');
                if (container && message.payload?.content) {
                    container.innerHTML = `<p>${message.payload.content}</p>`;
                }
                // Persist state
                vscode.setState({ content: message.payload?.content });
                break;
            }
        }
    });

    function restoreState(state: { content?: string }): void {
        if (state.content) {
            const container = document.querySelector('.placeholder');
            if (container) {
                container.innerHTML = `<p>${state.content}</p>`;
            }
        }
    }
}());
