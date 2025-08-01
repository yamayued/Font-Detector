let isDetecting = false;

document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleDetection');
  const fontInfo = document.getElementById('fontInfo');

  // ボタンクリックイベント
  toggleButton.addEventListener('click', async function() {
    isDetecting = !isDetecting;
    
    try {
      // 現在のタブを取得
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // chrome:// URLsなどでは動作しない
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        alert('このページでは使用できません。\n通常のウェブページでお試しください。');
        toggleButton.textContent = '検出開始';
        toggleButton.classList.remove('active');
        isDetecting = false;
        return;
      }
      
      if (isDetecting) {
        toggleButton.textContent = '検出停止';
        toggleButton.classList.add('active');
        
        // コンテンツスクリプトが読み込まれているか確認
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
          await chrome.tabs.sendMessage(tab.id, { action: 'startDetection' });
        } catch (e) {
          // コンテンツスクリプトを手動で注入
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content.css']
          });
          // 少し待ってから再度送信
          setTimeout(async () => {
            await chrome.tabs.sendMessage(tab.id, { action: 'startDetection' });
          }, 100);
        }
      } else {
        toggleButton.textContent = '検出開始';
        toggleButton.classList.remove('active');
        
        // 現在のタブに検出停止メッセージを送信
        await chrome.tabs.sendMessage(tab.id, { action: 'stopDetection' });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました。\nページを再読み込みしてからお試しください。');
      toggleButton.textContent = '検出開始';
      toggleButton.classList.remove('active');
      isDetecting = false;
    }
  });

  // コンテンツスクリプトからのメッセージを受信
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fontDetected') {
      // フォント情報を表示
      fontInfo.style.display = 'block';
      document.getElementById('fontName').textContent = request.fontName;
      document.getElementById('fontColor').textContent = request.color || '-';
    }
  });
});