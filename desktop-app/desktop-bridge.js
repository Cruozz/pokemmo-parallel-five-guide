// Loaded only by the native desktop host, before the original guide scripts.
(function () {
  'use strict';
  if (!window.chrome?.webview) return;
  window.chrome.webview.addEventListener('message', async event => {
    if (event.data?.type !== 'save-before-close') return;
    let ok = true;
    try {
      if (window.guideEditor) {
        await window.guideEditor.ready;
        ok = await window.guideEditor.flush();
      }
    } catch (_) { ok = false; }
    window.chrome.webview.postMessage({type:'save-complete', request:event.data.request, ok});
  });
})();
