let questions = [];
let currentQuestion = 0;

// ステータスを記録するための変数
let userRate = 1000;    
let userSolved = 0;     // ユーザーが解けた問題数
let userAttempts = 0;   // 試行回数
let lastSubmittedAnswer = ""; 
let isSubmitting = false; // 【連打防止】送信処理中フラグ

// ==========================================
// ★追加: タイマー用の変数群
// ==========================================
let timerInterval;
let currentSeconds = 0;
let totalSeconds = 0;
let isPlaying = false;

// ==========================================
// ★追加: タイマーフォーマット・表示更新・記録関数
// ==========================================
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatTimeJa(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
}

function updateDisplay() {
  const currentFormatted = formatTime(currentSeconds);
  const currentTimerEl = document.getElementById('current-timer');
  const currentQuestTimeEl = document.getElementById('current-quest-time');
  const totalTimeJaEl = document.getElementById('total-time-ja');
  const totalTimeMsEl = document.getElementById('total-time-ms');

  if (currentTimerEl) currentTimerEl.textContent = currentFormatted;
  if (currentQuestTimeEl) currentQuestTimeEl.textContent = currentFormatted;
  
  if (totalTimeJaEl) {
      totalTimeJaEl.textContent = formatTimeJa(totalSeconds);
      if (totalTimeMsEl) totalTimeMsEl.textContent = `(${formatTime(totalSeconds)})`;
  }
}

function addClearRecord(questionTitle, seconds) {
  const list = document.getElementById('clear-time-list');
  if (!list) return;
  const li = document.createElement('li');
  
  // タイトルを丸める処理（20文字程度）
  const shortTitle = questionTitle.length > 20 ? questionTitle.substring(0, 20) + '...' : questionTitle;
  
  li.innerHTML = `<span class="quest-title">${shortTitle}</span><span class="time-badge"><i class="fas fa-stopwatch"></i> ${formatTime(seconds)}</span>`;
  list.prepend(li); // 最新を一番上に追加
}
// ==========================================


// 画面切り替え関数
function showScreen(screenId) {
  const screens = document.querySelectorAll('.page-screen');
  screens.forEach(screen => {
    screen.classList.remove('active');
  });

  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }
}

// 解答欄の下の「簡易解析ツール ▽」を開閉する関数
function toggleDropdown() {
  const dropdown = document.getElementById('tools-dropdown');
  const arrow = document.getElementById('arrow-icon');
  
  if (dropdown.style.maxHeight === '0px' || !dropdown.style.maxHeight) {
    dropdown.style.maxHeight = dropdown.scrollHeight + "px";
    arrow.style.transform = "rotate(180deg)";
  } else {
    dropdown.style.maxHeight = "0px";
    arrow.style.transform = "rotate(0deg)";
  }
}

function refreshDropdownHeight() {
  const dropdown = document.getElementById('tools-dropdown');
  if (dropdown && dropdown.style.maxHeight && dropdown.style.maxHeight !== '0px') {
    dropdown.style.maxHeight = dropdown.scrollHeight + "px";
  }
}

function switchInlineTool() {
  const selected = document.getElementById('inline-tool-selector').value;
  const areas = {
    base64: document.getElementById('inline-base64-area'),
    base32: document.getElementById('inline-base32-area'),
    hex: document.getElementById('inline-hex-area'),
    binary: document.getElementById('inline-binary-area'),
    caesar: document.getElementById('inline-caesar-area'),
    atbash: document.getElementById('inline-atbash-area'),
    vigenere: document.getElementById('inline-vigenere-area'),
    url: document.getElementById('inline-url-area'),
    html: document.getElementById('inline-html-area'),
    ascii_dec: document.getElementById('inline-ascii_dec-area'),
    hash: document.getElementById('inline-hash-area')
  };

  for (const key in areas) {
    if (areas[key]) {
      areas[key].style.display = (key === selected) ? 'block' : 'none';
    }
  }
  refreshDropdownHeight();
}

function switchMainTool() {
  const tool = document.getElementById('tool-select').value;
  const caesarExtra = document.getElementById('tool-extra-caesar');
  const vigenereExtra = document.getElementById('tool-extra-vigenere');

  if (caesarExtra) caesarExtra.style.display = (tool === 'caesar') ? 'block' : 'none';
  if (vigenereExtra) vigenereExtra.style.display = (tool === 'vigenere') ? 'block' : 'none';
}

// JSON読み込み ＆ セーブデータ復元
fetch("questions.json")
  .then(response => response.json())
  .then(data => {
    questions = data;
    loadSaveData();        // ★localStorageからデータを復元
    showQuestion();        
    createQuestionList();  
  })
  .catch(err => console.error("JSON読み込みエラー:", err));

// 問題表示関数
function showQuestion() {
  if (questions.length === 0) return; 
  let q = questions[currentQuestion];
  document.getElementById("difficulty").textContent = "難易度: " + q.difficulty;
  document.getElementById("question").textContent = q.question;

  // 問題が表示されるタイミングでヒント内容も更新する
  updateHintData(q);

  // ==========================================
  // ★追加: 別の問題が表示された時は現在の秒数をリセットして表示更新
  // ==========================================
  currentSeconds = 0;
  updateDisplay();
}

function pickNextQuestionIndex() {
  let bestDiff = Infinity;
  let candidates = [];

  questions.forEach((q, i) => {
    if (q.isCleared) return; 

    const diff = Math.abs((Number(q.difficulty) || 1200) - userRate);
    if (diff < bestDiff) {
      bestDiff = diff;
      candidates = [i];
    } else if (diff === bestDiff) {
      candidates.push(i);
    }
  });

  if (candidates.length === 0) return -1; 
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function loadNextQuestion() {
  lastSubmittedAnswer = "";
  isSubmitting = false;

  const nextIndex = pickNextQuestionIndex();

  if (nextIndex !== -1) {
    currentQuestion = nextIndex;
    showQuestion();
    document.getElementById("result").textContent = "";
  } else {
    document.getElementById("result").textContent = "全問題をクリアしました！";
    document.getElementById("result").style.color = "#00ffcc";
  }
}

function updateStatusDOM() {
  document.getElementById("user-rate").textContent = userRate;
  document.getElementById("user-solved").textContent = userSolved;
  document.getElementById("user-attempts").textContent = userAttempts;

  let accuracy = 0;
  if (userAttempts > 0) {
    accuracy = Math.round((userSolved / userAttempts) * 100);
  }
  document.getElementById("user-accuracy").textContent = accuracy + "%";

  if (document.getElementById("save-rate")) document.getElementById("save-rate").textContent = userRate;
  if (document.getElementById("save-solved")) document.getElementById("save-solved").textContent = userSolved;
  if (document.getElementById("save-attempts")) document.getElementById("save-attempts").textContent = userAttempts;
  if (document.getElementById("save-accuracy")) document.getElementById("save-accuracy").textContent = accuracy + "%";
}

// 正解判定
function checkAnswer() {
  if (questions.length === 0 || currentQuestion >= questions.length) return;
  if (isSubmitting) return;

  let q = questions[currentQuestion];
  if (q.isCleared) {
    document.getElementById("result").textContent = "この問題はすでにクリア済みです。";
    document.getElementById("result").style.color = "#94a3b8";
    return;
  }

  let userAnswer = document.getElementById("answer").value.trim();

  if (!userAnswer) {
    document.getElementById("result").textContent = "フラグを入力してください。";
    document.getElementById("result").style.color = "#facc15";
    return;
  }

  if (userAnswer === lastSubmittedAnswer) {
    document.getElementById("result").textContent = "同じ解答がすでに送信されています。";
    document.getElementById("result").style.color = "#facc15";
    return;    
  }   

  isSubmitting = true;
  lastSubmittedAnswer = userAnswer;

  let result = document.getElementById("result");
  userAttempts++;

  const rProblem = Number(q.difficulty) || 1200;
  const rUser = userRate;
  const diff = rProblem - rUser; 
  const expectedScore = 1 / (1 + Math.pow(10, diff / 400));
  let rateChange = 0;

  let isCorrect = false;
  if (Array.isArray(q.answer)) {
    isCorrect = q.answer.some(ans => ans.toString().trim().toLowerCase() === userAnswer.toLowerCase());
  } else {
    isCorrect = (q.answer.toString().trim().toLowerCase() === userAnswer.toLowerCase());
  }

  if (isCorrect) {  
    result.textContent = "正解！";
    result.style.color = "#00ffcc"; 
    userSolved++;
    q.isCleared = true;
    createQuestionList();

    // ==========================================
    // ★追加: 正解時にクリアタイムを記録し、現在のタイマーを停止
    // ==========================================
    addClearRecord(q.question, currentSeconds);
    clearInterval(timerInterval);
    isPlaying = false;
    const startBtn = document.getElementById('timer-start-btn');
    if (startBtn) {
      startBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
      startBtn.style.backgroundColor = '#0d8050';
    }

    let dynamicK = 32 + (diff > 0 ? diff / 5 : 0);
    rateChange = Math.round(dynamicK * (1 - expectedScore));
    userRate += rateChange;

    updateStatusDOM();
    autoSaveData(); 

    setTimeout(() => {
      document.getElementById("answer").value = "";
      loadNextQuestion();
    }, 1500);

  } else {
    result.textContent = "不正解...";
    result.style.color = "#ef4444";

    const penaltyDiff = diff < 0 ? Math.abs(diff) : 0;
    let dynamicK = 32 + (penaltyDiff / 5);
    let rawLoss = Math.round(dynamicK * (0 - expectedScore)); 

    const MAX_LOSS = -75; 
    rateChange = Math.max(rawLoss, MAX_LOSS); 

    userRate = Math.max(0, userRate + rateChange); 
    
    updateStatusDOM();
    autoSaveData(); 
    
    setTimeout(() => {
      isSubmitting = false;
    }, 400);
  }
}

function autoSaveData() {
  saveDataToStorage();
}

function manualSaveData() {
  const confirmSave = confirm("現在の学習記録をセーブしますか？");
  if (!confirmSave) return; 

  saveDataToStorage();
  const msg = document.getElementById("save-msg");
  if (msg) {
    msg.textContent = "✔ 学習記録を正常にセーブしました！";
    msg.style.color = "#00ffcc";
    setTimeout(() => { msg.textContent = ""; }, 3000);
  }
}

function saveDataToStorage() {
  const clearedIndices = questions
    .map((q, idx) => q.isCleared ? idx : null)
    .filter(idx => idx !== null);

  const saveData = {
    userRate: userRate,
    userSolved: userSolved,
    userAttempts: userAttempts,
    currentQuestion: currentQuestion,
    clearedIndices: clearedIndices,
    totalSeconds: totalSeconds // ★追加: 総経過時間をセーブデータに含める
  };

  localStorage.setItem("ctf_learning_data", JSON.stringify(saveData));
}

function loadSaveData() {
  const json = localStorage.getItem("ctf_learning_data");
  if (!json) return;

  try {
    const data = JSON.parse(json);
    if (data.userRate !== undefined) userRate = data.userRate;
    if (data.userSolved !== undefined) userSolved = data.userSolved;
    if (data.userAttempts !== undefined) userAttempts = data.userAttempts;
    if (data.currentQuestion !== undefined) currentQuestion = data.currentQuestion;
    
    // ★追加: 総経過時間の復元
    if (data.totalSeconds !== undefined) totalSeconds = data.totalSeconds; 

    if (Array.isArray(data.clearedIndices)) {
      data.clearedIndices.forEach(idx => {
        if (questions[idx]) questions[idx].isCleared = true;
      });
    }

    updateStatusDOM();
    updateDisplay(); // ★追加: 復元した時間を画面に反映
  } catch(e) {
    console.error("セーブデータの読み込み失敗:", e);
  }
}

function resetSaveData() {
  const confirmFirst = confirm("本当に学習記録を完全消去しますか？\n（この操作は取り消せません）");
  if (!confirmFirst) return;

  localStorage.removeItem("ctf_learning_data");

  userRate = 1000;
  userSolved = 0;
  userAttempts = 0;
  currentQuestion = 0;
  totalSeconds = 0; // ★追加: 総経過時間をリセット

  questions.forEach(q => { q.isCleared = false; });

  updateStatusDOM();
  updateDisplay(); // ★追加: リセットした時間を画面に反映
  createQuestionList();
  showQuestion();

  const msg = document.getElementById("save-msg");
  if (msg) {
    msg.textContent = "⚠ すべての学習記録をリセットしました。";
    msg.style.color = "#ef4444";
    setTimeout(() => { msg.textContent = ""; }, 3000);
  }
}

function runInlineBase32() {
  decodeBase32Logic('tool-base32-input', 'tool-base32-result');
}

function decodeBase32Logic(inputId, resultId) {
  const input = document.getElementById(inputId).value.trim();
  if (!input) return;

  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let decoded = "";

  const cleanInput = input.toUpperCase().replace(/=+$/, ""); 

  try {
    for (let i = 0; i < cleanInput.length; i++) {
      const val = base32chars.indexOf(cleanInput.charAt(i));
      if (val === -1) {
        throw new Error("Invalid Base32 character");
      }
      bits += val.toString(2).padStart(5, '0');
    }

    for (let i = 0; i + 8 <= bits.length; i += 8) {
      const chunk = bits.substr(i, 8);
      if (chunk.length === 8) {
        decoded += String.fromCharCode(parseInt(chunk, 2));
      }
    }
    showResult(resultId, decoded, false);
  } catch(e) {
    showResult(resultId, 'デコード失敗（正しいBase32ではありません）', true);
  }
}

function runInlineAsciiDec() {
  decodeAsciiDecLogic('inline-ascii_dec-input', 'inline-ascii_dec-result');
}

function decodeAsciiDecLogic(inputId, resultId) {
  const input = document.getElementById(inputId).value.trim();
  if (!input) return;

  try {
    const numbers = input.split(/[\s,]+/);
    let decoded = "";
    
    for (let numStr of numbers) {
      if (!numStr) continue;
      const num = parseInt(numStr, 10);
      if (isNaN(num)) throw new Error("Not a number");
      decoded += String.fromCharCode(num);
    }
    
    if (decoded.length === 0) {
      showResult(resultId, 'デコード失敗（正しい10進数の数列ではありません）', true);
      return;
    }
    
    showResult(resultId, decoded, false);
  } catch (e) {
    showResult(resultId, 'デコード失敗（正しい10進数の数列ではありません）', true);
  }
}


function runBase64() {
  decodeBase64Logic('tool-base64-input', 'tool-base64-result', 'tool-base64-img');
}

function decodeBase64Logic(inputId, resultId, imgId) {
  let input = document.getElementById(inputId).value.trim();
  const resultText = document.getElementById(resultId);
  const resultImg = document.getElementById(imgId);
  
  if (resultText) resultText.textContent = "";
  if (resultImg) {
    resultImg.style.display = "none";
    resultImg.src = "";
  }

  if (!input) return;

  let isImageUri = input.startsWith('data:image');
  let mimeType = 'image/png'; 

  if (isImageUri) {
    if (input.includes('image/jpeg') || input.includes('image/jpg')) mimeType = 'image/jpeg';
    if (input.includes('image/gif')) mimeType = 'image/gif';
    input = input.split(',')[1].trim();
  }

  try {
    const lowerInput = input.toLowerCase();
    if (isImageUri || lowerInput.startsWith('ivborw') || lowerInput.startsWith('/9j/') || lowerInput.startsWith('r0lg')) {
      if (!isImageUri) {
        if (lowerInput.startsWith('/9j/')) mimeType = 'image/jpeg';
        if (lowerInput.startsWith('r0lg')) mimeType = 'image/gif';
      }
      if (resultImg) {
        resultImg.src = `data:${mimeType};base64,${input}`;
        resultImg.style.display = "block"; 
        resultImg.onload = refreshDropdownHeight;
      }
      showResult(resultId, '画像のデコードに成功しました！', false);
    } else {
      const binString = atob(input);
      const bytes = Uint8Array.from(binString, function(c) { return c.charCodeAt(0); });
      const decoded = new TextDecoder().decode(bytes);
      showResult(resultId, decoded, false);
    }
  } catch(e) {
    showResult(resultId, 'デコード失敗（正しいBase64ではありません）', true);
  }
}

function runHex() {
  decodeHexLogic('tool-hex-input', 'tool-hex-result');
}

function decodeHexLogic(inputId, resultId) {
  const input = document.getElementById(inputId).value.trim();
  if (!input) return;
  try {
    const hex = input.replace(/\s+/g, '').replace(/0x/gi, '');  
    const decoded = hex.match(/.{1,2}/g).map(function(b) {
      return String.fromCharCode(parseInt(b, 16));
    }).join('');
    showResult(resultId, decoded, false);
  } catch(e) {
    showResult(resultId, 'デコード失敗（正しい16進数ではありません）', true);
  }
}

function runInlineBinary() {
  decodeBinaryLogic('inline-binary-input', 'inline-binary-result');
}

function decodeBinaryLogic(inputId, resultId) {
  const input = document.getElementById(inputId).value.trim();
  if (!input) return;
  try {
    const cleanBin = input.replace(/\s+/g, '');
    const decoded = cleanBin.match(/.{1,8}/g).map(b => String.fromCharCode(parseInt(b, 2))).join('');
    showResult(resultId, decoded, false);
  } catch(e) {
    showResult(resultId, 'デコード失敗（正しい2進数ではありません）', true);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const selects = [
    document.getElementById("tool-caesar-shift-select"),
    document.getElementById("inline-caesar-shift")
  ];

  selects.forEach(select => {
    if (select) {
      select.innerHTML = "";
      for (let i = 1; i <= 25; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = `${i}文字戻す`;
        if (i === 13) opt.textContent += " (ROT13)";
        select.appendChild(opt);
      }
    }
  });

  // ==========================================
  // ★追加: DOM読み込み時にタイマーのボタンイベントを登録
  // ==========================================
  const startBtn = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
        if (isPlaying) {
            // 一時停止処理
            clearInterval(timerInterval);
            startBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
            startBtn.style.backgroundColor = '#0d8050';
        } else {
            // 開始処理
            timerInterval = setInterval(() => {
                currentSeconds++;
                totalSeconds++;
                updateDisplay();
            }, 1000);
            startBtn.innerHTML = '<i class="fas fa-pause"></i> 停止';
            startBtn.style.backgroundColor = '#c53030';
        }
        isPlaying = !isPlaying;
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        // リセット処理
        clearInterval(timerInterval);
        isPlaying = false;
        currentSeconds = 0;
        if (startBtn) {
          startBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
          startBtn.style.backgroundColor = '#0d8050';
        }
        updateDisplay();
    });
  }
  // ==========================================

});

function runInlineCaesar() {
  const input = document.getElementById("inline-caesar-input").value;
  const shiftSelect = document.getElementById("inline-caesar-shift");
  const shift = shiftSelect ? parseInt(shiftSelect.value, 10) : 1;
  if (!input) return;
  showResult("inline-caesar-result", decodeCaesarLogic(input, shift), false);
}

function runInlineAtbash() {
  const input = document.getElementById("inline-atbash-input").value;
  if (!input) return;
  showResult("inline-atbash-result", decodeAtbashLogic(input), false);
}

function decodeCaesarLogic(input, shift) {
  return input.replace(/[a-zA-Z]/g, (char) => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
    }
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(((code - 97 - shift + 26) % 26) + 97);
    }
    return char;
  });
}

function decodeAtbashLogic(input) {
  return input.replace(/[a-zA-Z]/g, (char) => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(155 - code);
    }
    if (code >= 97 && code <= 122) {
      return String.fromCharCode(219 - code);
    }
    return char;
  });
}

function runInlineVigenere() {
  const input = document.getElementById("inline-vigenere-input").value.trim();
  const key = document.getElementById("inline-vigenere-key").value.trim();
  if (!input) return;
  if (!key) {
    showResult("inline-vigenere-result", "鍵(Key)を入力してください", true);
    return;
  }
  showResult("inline-vigenere-result", decodeVigenereLogic(input, key), false);
}

function decodeVigenereLogic(cipherText, key) {
  let result = "";
  const cleanKey = key.toUpperCase();
  
  let extendedKey = "";
  let keyIndex = 0;
  for (let i = 0; i < cipherText.length; i++) {
    let charCode = cipherText.charCodeAt(i);
    if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
      extendedKey += cleanKey[keyIndex % cleanKey.length];
      keyIndex++;
    } else {
      extendedKey += " ";
    }
  }

  for (let i = 0; i < cipherText.length; i++) {
    let charCode = cipherText.charCodeAt(i);

    if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
      let base = (charCode >= 65 && charCode <= 90) ? 65 : 97;
      let cipherNum = charCode - base;
      let keyNum = extendedKey.charCodeAt(i) - 65;
      let plainNum = cipherNum - keyNum;
      
      if (plainNum < 0) {
        plainNum += 26;
      }

      result += String.fromCharCode(plainNum + base);
    } else {
      result += cipherText[i];
    }
  }

  return result;
}

function runInlineUrl() {
  const input = document.getElementById("inline-url-input").value.trim();
  if (!input) return;
  try {
    showResult("inline-url-result", decodeURIComponent(input), false);
  } catch(e) {
    showResult("inline-url-result", "デコード失敗", true);
  }
}

function runInlineHtml() {
  const input = document.getElementById("inline-html-input").value.trim();
  if (!input) return;
  const doc = new DOMParser().parseFromString(input, 'text/html');
  showResult("inline-html-result", doc.body.textContent, false);
}

function runInlineHash() {
  const input = document.getElementById("inline-hash-input").value.trim();
  if (!input) return;
  showResult("inline-hash-result", identifyHashLogic(input), false);
}

function identifyHashLogic(hash) {
  const cleanHash = hash.replace(/\s+/g, '');
  const len = cleanHash.length;
  const isHex = /^[a-fA-F0-9]+$/.test(cleanHash);

  if (!isHex) return "エラー: 16進数文字列ではありません";

  switch (len) {
    case 32:  return "識別結果: MD5 (32文字 / 128bit)";
    case 40:  return "識別結果: SHA-1 (40文字 / 160bit)";
    case 64:  return "識別結果: SHA-256 (64文字 / 256bit)";
    default:  return `該当なし (${len}文字のハッシュ値です)`;
  }
}

function runSelectedMainTool() {
  const tool = document.getElementById('tool-select').value;
  const input = document.getElementById('tool-input').value.trim();
  const imgElement = document.getElementById('tool-main-img');

  if (imgElement) imgElement.style.display = 'none';

  if (!input) {
    showResult('tool-main-result', '入力が空です', true);
    return;
  }

  try {
    switch (tool) {
      case 'base64':
        decodeBase64Logic('tool-input', 'tool-main-result', 'tool-main-img');
        break;
      case 'base32':
        decodeBase32Logic('tool-input', 'tool-main-result');
        break;
      case 'ascii_dec':
        decodeAsciiDecLogic('tool-input', 'tool-main-result');
        break;
      case 'hex':
        decodeHexLogic('tool-input', 'tool-main-result');
        break;
      case 'binary':
        decodeBinaryLogic('tool-input', 'tool-main-result');
        break;
      case 'caesar':
        const shift = parseInt(document.getElementById('tool-caesar-shift-select').value, 10);
        showResult('tool-main-result', decodeCaesarLogic(input, shift), false);
        break;
      case 'atbash':
        showResult('tool-main-result', decodeAtbashLogic(input), false);
        break;
      case 'vigenere':
        const key = document.getElementById('tool-vigenere-key').value.trim();
        if (!key) {
          showResult('tool-main-result', '鍵(Key)を入力してください', true);
          return;
        }
        showResult('tool-main-result', decodeVigenereLogic(input, key), false);
        break;
      case 'url':
        showResult('tool-main-result', decodeURIComponent(input), false);
        break;
      case 'html':
        const doc = new DOMParser().parseFromString(input, 'text/html');
        showResult('tool-main-result', doc.body.textContent, false);
        break;
      case 'hash':
        showResult('tool-main-result', identifyHashLogic(input), false);
        break;
    }
  } catch(e) {
    showResult('tool-main-result', '処理に失敗しました', true);
  }
}

function showResult(resultId, message, isError) {
  const resultElement = document.getElementById(resultId);
  if (resultElement) {
    resultElement.textContent = message;
    if (isError) {
      resultElement.style.color = "#ef4444"; 
    } else {
      resultElement.style.color = "#00ffcc"; 
    }
  }
  refreshDropdownHeight();
}

function createQuestionList() {
  const listContainer = document.getElementById("question-list");
  if (!listContainer) return;
  listContainer.innerHTML = "";

  listContainer.removeAttribute("style");
  listContainer.className = "question-list";

  questions.forEach((q, index) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "question-row" + (q.isCleared ? " cleared" : "");

    const label = document.createElement("span");
    label.className = "question-row-label";
    label.textContent = "Q " + (index + 1);

    const text = document.createElement("span");
    text.className = "question-row-text";
    text.textContent = String(q.question).split("\n")[0];

    const leader = document.createElement("span");
    leader.className = "question-row-leader";

    const meta = document.createElement("span");
    meta.className = "question-row-meta";
    meta.textContent = (q.isCleared ? "✓ " : "") + q.difficulty;

    row.append(label, text, leader, meta);
    row.onclick = function() {
      selectQuestion(index);
    };
    listContainer.appendChild(row);
  });
}

function selectQuestion(index) {
  currentQuestion = index; 
  showQuestion();            
  document.getElementById("result").textContent = "";
  document.getElementById("answer").value = "";
  lastSubmittedAnswer = "";
  isSubmitting = false;
  showScreen("play-screen"); 
}

function toggleHint() {
  const panel = document.getElementById("hint-panel");
  if (!panel) return;

  if (panel.classList.contains("open")) {
    panel.style.maxHeight = "0px";
    panel.classList.remove("open");
  } else {
    panel.classList.add("open");
    panel.style.maxHeight = panel.scrollHeight + "px";
  }
}

function updateHintData(questionData) {
  const hintText = document.getElementById("hint-text");
  const panel = document.getElementById("hint-panel");
  
  if (!hintText || !panel) return;

  if (questionData && questionData.hint) {
    hintText.innerHTML = questionData.hint;
  } else {
    hintText.innerHTML = "この問題にヒントはありません。";
  }

  panel.style.maxHeight = "0px";
  panel.classList.remove("open");
}
