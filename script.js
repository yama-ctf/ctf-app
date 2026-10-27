let questions = [];
let currentQuestion = 0;

// ステータスを記録するための変数
let userRate = 1000;    
let userSolved = 0;     // ユーザーが解けた問題数
let userAttempts = 0;   // 試行回数
let lastSubmittedAnswer = ""; 
let isSubmitting = false; // 【連打防止】送信処理中フラグ

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

  // ==========================================
// ★ タイマー機能 ＆ 総経過時間の管理
// ==========================================
let timerInterval = null;
let timerSeconds = 0;       // 現在の問題のタイマー（秒）
let totalElapsedSeconds = 0;// 累計経過時間（秒）
let isTimerRunning = false;

// 開始 / 停止切り替え
function toggleTimer() {
  if (isTimerRunning) {
    stopTimer();
  } else {
    startTimer();
  }
}

// 計測開始
function startTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;
  
  const btn = document.getElementById("timer-toggle-btn");
  const container = document.querySelector(".timer-container");
  if (btn) {
    btn.textContent = "停止";
    btn.classList.add("running");
  }
  if (container) container.classList.add("running");

  timerInterval = setInterval(() => {
    timerSeconds++;
    totalElapsedSeconds++; // 総経過時間も加算
    updateTimerDOM();
  }, 1000);
}

// 計測停止
function stopTimer() {
  isTimerRunning = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  const btn = document.getElementById("timer-toggle-btn");
  const container = document.querySelector(".timer-container");
  if (btn) {
    btn.textContent = timerSeconds > 0 ? "再開" : "開始";
    btn.classList.remove("running");
  }
  if (container) container.classList.remove("running");
}

// リセット (00:00に戻す)
function resetTimer() {
  stopTimer();
  timerSeconds = 0;
  updateTimerDOM();
  const btn = document.getElementById("timer-toggle-btn");
  if (btn) btn.textContent = "開始";
}

// タイマー表示 ＆ セーブ画面の経過時間表示を更新
function updateTimerDOM() {
  const display = document.getElementById("timer-display");
  if (display) {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // セーブ画面の総経過時間表示もリアルタイム更新
  const saveElapsed = document.getElementById("save-elapsed");
  if (saveElapsed) {
    saveElapsed.textContent = formatDuration(totalElapsedSeconds);
  }
}

// 秒数を「○時間○分○秒」または「○分○秒」に変換
function formatDuration(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${hrs}時間${String(mins).padStart(2, '0')}分${String(secs).padStart(2, '0')}秒`;
  }
  return `${mins}分${String(secs).padStart(2, '0')}秒`;
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

// 簡易解析ツールのパネルが開いている場合、
// 中身の高さが変わった後（デコード結果の表示・画像表示など）に
// max-heightを再計算して、結果が見切れないようにする関数
function refreshDropdownHeight() {
  const dropdown = document.getElementById('tools-dropdown');
  if (dropdown && dropdown.style.maxHeight && dropdown.style.maxHeight !== '0px') {
    dropdown.style.maxHeight = dropdown.scrollHeight + "px";
  }
}

// 簡易解析ツールの切り替え関数（全ツール対応版）
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

  // アコーディオンの高さ自動調整
  refreshDropdownHeight();
}

// 独立画面ツールの表示切替関数
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
}

// 未クリアの問題の中から、現在のレートに最も近い難易度の問題を選ぶ関数
function pickNextQuestionIndex() {
  let bestDiff = Infinity;
  let candidates = [];

  questions.forEach((q, i) => {
    if (q.isCleared) return; // クリア済みは除外

    const diff = Math.abs((Number(q.difficulty) || 1200) - userRate);
    if (diff < bestDiff) {
      bestDiff = diff;
      candidates = [i];
    } else if (diff === bestDiff) {
      candidates.push(i);
    }
  });

  if (candidates.length === 0) return -1; // 全問題クリア済み

  return candidates[Math.floor(Math.random() * candidates.length)];
}

// 次の問題をロードする関数
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

// 上部のステータス画面を最新データに書き換える関数
function updateStatusDOM() {
  document.getElementById("user-rate").textContent = userRate;
  document.getElementById("user-solved").textContent = userSolved;
  document.getElementById("user-attempts").textContent = userAttempts;

  let accuracy = 0;
  if (userAttempts > 0) {
    accuracy = Math.round((userSolved / userAttempts) * 100);
  }
  document.getElementById("user-accuracy").textContent = accuracy + "%";

  // セーブ画面側にも連動して数値を反映
  if (document.getElementById("save-rate")) document.getElementById("save-rate").textContent = userRate;
  if (document.getElementById("save-solved")) document.getElementById("save-solved").textContent = userSolved;
  if (document.getElementById("save-attempts")) document.getElementById("save-attempts").textContent = userAttempts;
  if (document.getElementById("save-accuracy")) document.getElementById("save-accuracy").textContent = accuracy + "%";
}

// 正解判定（動的eloレーティング・上限キャップ組み込み版）
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

  // ------------------------------------------
  // ★eloレーティング計算ロジック（動的Kファクター ＆ キャップ）
  // ------------------------------------------
  const rProblem = Number(q.difficulty) || 1200;
  const rUser = userRate;
  const diff = rProblem - rUser; // 難易度と現在レートの差（正: 格上, 負: 格下）
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
    createQuestionList(); // 問題一覧のクリア表示(✓)を更新

    // ★正解時：格上ボーナス（格上ほどK値が拡張され跳ね上がる）
    let dynamicK = 32 + (diff > 0 ? diff / 5 : 0);
    rateChange = Math.round(dynamicK * (1 - expectedScore));
    userRate += rateChange;

    updateStatusDOM();
    autoSaveData(); // 正解時にオートセーブ

    setTimeout(() => {
      document.getElementById("answer").value = "";
      loadNextQuestion();
    }, 1500);

  } else {
    result.textContent = "不正解...";
    result.style.color = "#ef4444";

    // ★不正解時：格下でのミスほどペナルティが大きくなるが、最大で -75 pt に制限
    const penaltyDiff = diff < 0 ? Math.abs(diff) : 0;
    let dynamicK = 32 + (penaltyDiff / 5);
    let rawLoss = Math.round(dynamicK * (0 - expectedScore)); // マイナス値

    const MAX_LOSS = -75; // 減少上限キャップ
    rateChange = Math.max(rawLoss, MAX_LOSS); 

    userRate = Math.max(0, userRate + rateChange); // 0未満にはならない
    
    updateStatusDOM();
    autoSaveData(); // 不正解時にオートセーブ
    
    setTimeout(() => {
      isSubmitting = false;
    }, 400);
  }
}

// ==========================================
// ★セーブ・ロード・リセット（データ消去）機能
// ==========================================

// オートセーブ（静かに保存）
function autoSaveData() {
  saveDataToStorage();
}

// 手動セーブ（確認ダイアログ表示後にセーブ）
function manualSaveData() {
  const confirmSave = confirm("現在の学習記録をセーブしますか？");
  if (!confirmSave) return; // キャンセルされた場合は処理を中断

  saveDataToStorage();
  const msg = document.getElementById("save-msg");
  if (msg) {
    msg.textContent = "✔ 学習記録を正常にセーブしました！";
    msg.style.color = "#00ffcc";
    setTimeout(() => { msg.textContent = ""; }, 3000);
  }
}

// 共通保存処理: totalElapsedSeconds を保存対象に追加
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
    totalElapsedSeconds: totalElapsedSeconds // ★追加
  };

  localStorage.setItem("ctf_learning_data", JSON.stringify(saveData));
}

// 読み込み処理: totalElapsedSeconds を復元
function loadSaveData() {
  const json = localStorage.getItem("ctf_learning_data");
  if (!json) return;

  try {
    const data = JSON.parse(json);
    if (data.userRate !== undefined) userRate = data.userRate;
    if (data.userSolved !== undefined) userSolved = data.userSolved;
    if (data.userAttempts !== undefined) userAttempts = data.userAttempts;
    if (data.currentQuestion !== undefined) currentQuestion = data.currentQuestion;
    if (data.totalElapsedSeconds !== undefined) {
      totalElapsedSeconds = data.totalElapsedSeconds; // ★追加
    }

    if (Array.isArray(data.clearedIndices)) {
      data.clearedIndices.forEach(idx => {
        if (questions[idx]) questions[idx].isCleared = true;
      });
    }

    updateStatusDOM();
    updateTimerDOM(); // ★追加: セーブ画面の経過時間テキストを反映
  } catch(e) {
    console.error("セーブデータの読み込み失敗:", e);
  }
}

// リセット処理: totalElapsedSeconds を 0 に初期化
function resetSaveData() {
  const confirmFirst = confirm("本当に学習記録を完全消去しますか？\n（この操作は取り消せません）");
  if (!confirmFirst) return;

  localStorage.removeItem("ctf_learning_data");

  userRate = 1000;
  userSolved = 0;
  userAttempts = 0;
  currentQuestion = 0;
  totalElapsedSeconds = 0; // ★追加
  resetTimer();            // ★追加: 現在のタイマーも停止・リセット

  questions.forEach(q => { q.isCleared = false; });

  updateStatusDOM();
  updateTimerDOM();
  createQuestionList();
  showQuestion();

  const msg = document.getElementById("save-msg");
  if (msg) {
    msg.textContent = "⚠ すべての学習記録をリセットしました。";
    msg.style.color = "#ef4444";
    setTimeout(() => { msg.textContent = ""; }, 3000);
  }
}

// ------------------------------------------
// ツール系・共通処理
// ------------------------------------------

// ------------------------------------------
// ★追加: Base32 / ASCII Decimal (10進数) の機能
// ------------------------------------------

function runInlineBase32() {
  decodeBase32Logic('tool-base32-input', 'tool-base32-result');
}

function decodeBase32Logic(inputId, resultId) {
  const input = document.getElementById(inputId).value.trim();
  if (!input) return;

  // Base32デコードの実装
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let decoded = "";

  const cleanInput = input.toUpperCase().replace(/=+$/, ""); // パディングを削除

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
      // 8ビット揃っていない最後の端数は無視する
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
    // 数値をスペース、カンマ等で区切って配列化
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

// 問題一覧の自動生成（目次風リスト）
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

// 一覧から問題を選択
function selectQuestion(index) {
  currentQuestion = index; 
  showQuestion();            
  document.getElementById("result").textContent = "";
  document.getElementById("answer").value = "";
  lastSubmittedAnswer = "";
  isSubmitting = false;
  showScreen("play-screen"); 
}

// ヒントドロップダウンの開閉処理
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

// 新しい問題が読み込まれた時に呼び出す関数
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
