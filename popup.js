let isDetecting = false;

document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleDetection');
  const fontInfo = document.getElementById('fontInfo');

  // ボタンクリックイベント
  toggleButton.addEventListener('click', async function() {
    isDetecting = !isDetecting;
    
    if (isDetecting) {
      toggleButton.textContent = '検出停止';
      toggleButton.classList.add('active');
      
      // 現在のタブに検出開始メッセージを送信
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'startDetection' });
    } else {
      toggleButton.textContent = '検出開始';
      toggleButton.classList.remove('active');
      
      // 現在のタブに検出停止メッセージを送信
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'stopDetection' });
    }
  });

  // コンテンツスクリプトからのメッセージを受信
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fontDetected') {
      // フォント情報を表示
      fontInfo.style.display = 'block';
      document.getElementById('fontName').textContent = request.fontName;
    }
  });
});