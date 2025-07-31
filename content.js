let isDetecting = false;
let highlightedElement = null;
let infoBox = null;

// ポップアップからのメッセージを受信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'ready' });
  } else if (request.action === 'startDetection') {
    startDetection();
    sendResponse({ status: 'started' });
  } else if (request.action === 'stopDetection') {
    stopDetection();
    sendResponse({ status: 'stopped' });
  }
  return true;
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
  
  // 実際に使用されているフォントを取得
  const actualFont = getActualFont(e.target);
  
  // ポップアップにフォント情報を送信
  chrome.runtime.sendMessage({
    action: 'fontDetected',
    fontName: actualFont
  });
  
  // 情報ボックスを表示
  showInfoBox(e.target, actualFont);
}

// 実際に使用されているフォントを取得する関数
function getActualFont(element) {
  // Canvas を使用して実際のフォントを検出
  const text = element.textContent || 'Test';
  const computedStyle = window.getComputedStyle(element);
  const fontFamily = computedStyle.fontFamily;
  
  // フォントファミリーをパースして個別のフォントに分割
  const fonts = fontFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));
  
  // 各フォントをテストして実際に使用されているものを見つける
  for (const font of fonts) {
    if (isFontAvailable(font)) {
      return font;
    }
  }
  
  // デフォルトフォントを返す
  return fonts[0] || 'Unknown';
}

// フォントが利用可能かチェックする関数
function isFontAvailable(fontName) {
  // 仮想的なテキストを使用してフォントの幅を比較
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const text = 'abcdefghijklmnopqrstuvwxyz0123456789';
  
  // デフォルトフォントでの幅を取得
  context.font = '72px monospace';
  const defaultWidth = context.measureText(text).width;
  
  // 指定フォントでの幅を取得
  context.font = `72px "${fontName}", monospace`;
  const fontWidth = context.measureText(text).width;
  
  // 幅が異なれば、フォントが利用可能
  return defaultWidth !== fontWidth;
}

function showInfoBox(element, fontName) {
  // 既存の情報ボックスを削除
  if (infoBox) {
    infoBox.remove();
  }
  
  // 新しい情報ボックスを作成
  infoBox = document.createElement('div');
  infoBox.className = 'font-detector-info-box';
  infoBox.innerHTML = `
    <div class="font-detector-font-name">${fontName}</div>
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