let isDetecting = false;
let highlightedElement = null;
let infoBox = null;

// ポップアップからのメッセージを受信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startDetection') {
    startDetection();
  } else if (request.action === 'stopDetection') {
    stopDetection();
  }
});

function startDetection() {
  isDetecting = true;
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick);
  document.body.style.cursor = 'crosshair';
}

function stopDetection() {
  isDetecting = false;
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick);
  document.body.style.cursor = 'auto';
  
  // ハイライトを削除
  if (highlightedElement) {
    highlightedElement.classList.remove('font-detector-highlight');
    highlightedElement = null;
  }
  
  // 情報ボックスを削除
  if (infoBox) {
    infoBox.remove();
    infoBox = null;
  }
}

function handleMouseOver(e) {
  if (!isDetecting) return;
  
  // 前のハイライトを削除
  if (highlightedElement) {
    highlightedElement.classList.remove('font-detector-highlight');
  }
  
  // 新しい要素をハイライト
  e.target.classList.add('font-detector-highlight');
  highlightedElement = e.target;
}

function handleMouseOut(e) {
  if (!isDetecting) return;
  
  e.target.classList.remove('font-detector-highlight');
}

function handleClick(e) {
  if (!isDetecting) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  // コンピューテッドスタイルを取得
  const computedStyle = window.getComputedStyle(e.target);
  
  const fontInfo = {
    fontFamily: computedStyle.fontFamily,
    fontSize: computedStyle.fontSize,
    fontWeight: computedStyle.fontWeight,
    lineHeight: computedStyle.lineHeight,
    color: computedStyle.color
  };
  
  // ポップアップにフォント情報を送信
  chrome.runtime.sendMessage({
    action: 'fontDetected',
    fontInfo: fontInfo
  });
  
  // 情報ボックスを表示
  showInfoBox(e.target, fontInfo);
}

function showInfoBox(element, fontInfo) {
  // 既存の情報ボックスを削除
  if (infoBox) {
    infoBox.remove();
  }
  
  // 新しい情報ボックスを作成
  infoBox = document.createElement('div');
  infoBox.className = 'font-detector-info-box';
  infoBox.innerHTML = `
    <div class="font-detector-info-header">フォント情報</div>
    <div class="font-detector-info-item">
      <span class="font-detector-info-label">Font Family:</span>
      <span class="font-detector-info-value">${fontInfo.fontFamily}</span>
    </div>
    <div class="font-detector-info-item">
      <span class="font-detector-info-label">Font Size:</span>
      <span class="font-detector-info-value">${fontInfo.fontSize}</span>
    </div>
    <div class="font-detector-info-item">
      <span class="font-detector-info-label">Font Weight:</span>
      <span class="font-detector-info-value">${fontInfo.fontWeight}</span>
    </div>
    <div class="font-detector-info-item">
      <span class="font-detector-info-label">Line Height:</span>
      <span class="font-detector-info-value">${fontInfo.lineHeight}</span>
    </div>
    <div class="font-detector-info-item">
      <span class="font-detector-info-label">Color:</span>
      <span class="font-detector-info-value">${fontInfo.color}</span>
    </div>
  `;
  
  // 位置を計算
  const rect = element.getBoundingClientRect();
  infoBox.style.position = 'fixed';
  infoBox.style.top = `${rect.bottom + 10}px`;
  infoBox.style.left = `${rect.left}px`;
  
  // 画面外に出ないように調整
  document.body.appendChild(infoBox);
  const boxRect = infoBox.getBoundingClientRect();
  
  if (boxRect.right > window.innerWidth) {
    infoBox.style.left = `${window.innerWidth - boxRect.width - 10}px`;
  }
  
  if (boxRect.bottom > window.innerHeight) {
    infoBox.style.top = `${rect.top - boxRect.height - 10}px`;
  }
}