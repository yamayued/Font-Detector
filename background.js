// 拡張機能のインストール時の処理
chrome.runtime.onInstalled.addListener(() => {
  console.log('Font Detector Extension installed');
});

// メッセージの中継（content script -> popup）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fontDetected') {
    // ポップアップにメッセージを転送
    chrome.runtime.sendMessage({
      action: 'fontDetected',
      fontName: request.fontName
    }).catch(error => {
      // ポップアップが閉じられている場合のエラーを無視
      console.log('Popup is not open, ignoring message');
    });
  }
});