let isDetecting = false;

async function ensureInjectableTab(tab) {
  if (!tab?.url) {
    throw new Error('No active tab');
  }

  if (
    tab.url.startsWith('chrome://') ||
    tab.url.startsWith('chrome-extension://') ||
    tab.url.startsWith('edge://') ||
    tab.url.startsWith('about:')
  ) {
    throw new Error('unsupported-page');
  }
}

async function ensureFontDetectorInjected(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch (error) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content.css']
    });
  }
}

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
      try {
        await ensureInjectableTab(tab);
      } catch (error) {
        alert('このページでは使用できません。\n通常のウェブページでお試しください。');
        toggleButton.textContent = '検出開始';
        toggleButton.classList.remove('active');
        isDetecting = false;
        return;
      }
      
      if (isDetecting) {
        toggleButton.textContent = '検出停止';
        toggleButton.classList.add('active');
        
        await ensureFontDetectorInjected(tab.id);
        await chrome.tabs.sendMessage(tab.id, { action: 'startDetection' });
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
