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
  
  // テキストを含む要素のみを対象にする
  if (!hasVisibleText(e.target)) return;
  
  // 前のハイライトを削除
  if (highlightedElement) {
    highlightedElement.classList.remove('font-detector-highlight');
  }
  
  // 新しい要素をハイライト
  e.target.classList.add('font-detector-highlight');
  highlightedElement = e.target;
  
  // ホバー時にフォント情報を自動的に表示
  const fontInfo = getFontInfo(e.target);
  
  // ポップアップにフォント情報を送信
  chrome.runtime.sendMessage({
    action: 'fontDetected',
    fontName: fontInfo.fontName,
    color: fontInfo.color
  });
  
  // 情報ボックスを表示
  showInfoBox(e.target, fontInfo);
}

function handleMouseOut(e) {
  if (!isDetecting) return;
  
  e.target.classList.remove('font-detector-highlight');
  
  // 情報ボックスを削除
  if (infoBox) {
    infoBox.remove();
    infoBox = null;
  }
}

function handleClick(e) {
  if (!isDetecting) return;
  
  // テキストを含む要素のみを対象にする
  if (!hasVisibleText(e.target)) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  // フォント情報を取得
  const fontInfo = getFontInfo(e.target);
  
  // ポップアップにフォント情報を送信
  chrome.runtime.sendMessage({
    action: 'fontDetected',
    fontName: fontInfo.fontName,
    color: fontInfo.color
  });
  
  // 情報ボックスを表示
  showInfoBox(e.target, fontInfo);
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

// テキストを含む要素かチェック
function hasVisibleText(element) {
  // テキストノードを直接含んでいるかチェック
  const hasDirectText = Array.from(element.childNodes).some(node => 
    node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
  );
  
  if (hasDirectText) return true;
  
  // 疑似要素のコンテンツをチェック
  const computedStyle = window.getComputedStyle(element);
  const beforeContent = window.getComputedStyle(element, ':before').content;
  const afterContent = window.getComputedStyle(element, ':after').content;
  
  if ((beforeContent && beforeContent !== 'none' && beforeContent !== '""') ||
      (afterContent && afterContent !== 'none' && afterContent !== '""')) {
    return true;
  }
  
  // input, textareaなどの値をチェック
  if ('value' in element && element.value) {
    return true;
  }
  
  return false;
}

// フォント情報を取得
function getFontInfo(element) {
  const computedStyle = window.getComputedStyle(element);
  const actualFont = getActualFont(element);
  const color = computedStyle.color;
  
  // RGBコードに変換
  const rgbCode = convertToRGB(color);
  
  return {
    fontName: actualFont,
    color: rgbCode
  };
}

// 色をRGBコードに変換
function convertToRGB(color) {
  // すでにrgb形式の場合
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      return `rgb(${matches[0]}, ${matches[1]}, ${matches[2]})`;
    }
  }
  
  // 16進数カラーコードの場合は変換
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const imageData = ctx.getImageData(0, 0, 1, 1).data;
  
  return `rgb(${imageData[0]}, ${imageData[1]}, ${imageData[2]})`;
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
    <div class="font-detector-font-name">${fontInfo.fontName}</div>
    <div class="font-detector-color">${fontInfo.color}</div>
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