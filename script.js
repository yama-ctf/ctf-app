let questions = [];
let currentQuestion = 0;

// ==========================================
// ステータスを記録するための変数
// ==========================================
let userRate = 1000;   
let userSolved = 0;    
let userAttempts = 0;  
let lastSubmittedAnswer = ""; 

// ==========================================
// 画面切り替え関数
// ==========================================
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
// 解答欄の下の「簡易解析ツール ▽」を開閉する関数
// ==========================================
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

// ==========================================
// 簡易解析ツールの切り替え関数 (Caesar / Atbash 対応版)
// ==========================================
function switchInlineTool() {
  const selected = document.getElementById('inline-tool-selector').value;
  const areas = {
    base64: document.getElementById('inline-base64-area'),
    hex: document.getElementById('inline-hex-area'),
    caesar: document.getElementById('inline-caesar-area'),
    atbash: document.getElementById('inline-atbash-area')
  };
  const dropdown = document.getElementById('tools-dropdown');

  for (const key in areas) {
    if (areas[key]) {
      areas[key].style.display = (key === selected) ? 'block' : 'none';
    }
  }

  if (dropdown && dropdown.style.maxHeight !== '0px' && dropdown.style.maxHeight) {
    dropdown.style.maxHeight = dropdown.scrollHeight + "px";
  }
}

// ==========================================
// JSON読み込み
// ==========================================
fetch("questions.json")
  .then(response => response.json())
  .then(data => {
    questions = data;
    showQuestion();        
    createQuestionList();  
  });

// ==========================================
// 問題表示関数
// ==========================================
function showQuestion() {
  if (questions.length === 0) return; 
  let q = questions[currentQuestion];
  document.getElementById("difficulty").textContent = "難易度: " + q.difficulty;
  document.getElementById("question").textContent = q.question;
}

// ==========================================
// 上部のステータス画面を最新データに書き換える関数
// ==========================================
function updateStatusDOM() {
  document.getElementById("user-rate").textContent = userRate;
  document.getElementById("user-solved").textContent = userSolved;
  document.getElementById("user-attempts").textContent = userAttempts;

  let accuracy = 0;
  if (userAttempts > 0) {
    accuracy = Math.round((userSolved / userAttempts) * 100); 
  }
  document.getElementById("user-accuracy").textContent = accuracy + "%";
}

// ==========================================
// 正解判定（Eloレーティング ＆ 連打対策版）
// ==========================================
function checkAnswer() {
  if (currentQuestion >= questions.length) return;

  let q = questions[currentQuestion];
  if (q.isCleared) {
    document.getElementById("result").textContent = "この問題はすでにクリア済みです。";
    document.getElementById("result").style.color = "#94a3b8";
    return;
  }

  let userAnswer = document.getElementById("answer").value.trim();

  // 重複送信チェック
  if (userAnswer === lastSubmittedAnswer) {
    return; 
  }
  lastSubmittedAnswer = userAnswer;

  let correctAnswer = q.answer;
  let result = document.getElementById("result");
  
  userAttempts++;

  const rProblem = Number(q.difficulty) || 1200;
  const rUser = userRate;
  const K = 32; 

  const expectedScore = 1 / (1 + Math.pow(10, (rProblem - rUser) / 400));
  let rateChange = 0;

  if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {  
    result.textContent = "正解！";
    result.style.color = "#00ffcc"; 

    userSolved++;
    q.isCleared = true;

    rateChange = Math.round(K * (1 - expectedScore));
    if (rateChange < 2) rateChange = 2; 

    userRate += rateChange;
    currentQuestion++;
    lastSubmittedAnswer = "";

    if (currentQuestion < questions.length) {
      showQuestion();
      document.getElementById("answer").value = "";
    } else {
      document.getElementById("question").textContent = "全問クリア！";
      document.getElementById("answer").value = "";
    }
  } else {
    result.textContent = "不正解";
    result.style.color = "#ef4444"; 
    
    rateChange = Math.round(K * (0 - expectedScore));
    if (rateChange > -2) rateChange = -2; 

    userRate += rateChange; 

    if (userRate < 0) {
      userRate = 0;
    }
  }
  updateStatusDOM();
}

// ==========================================
// Base64 デコード処理
// ==========================================
function runBase64() {
  decodeBase64Logic('tool-base64-input', 'tool-base64-result', 'tool-base64-img');
}

function runIndependentBase64() {
  decodeBase64Logic('independent-base64-input', 'independent-base64-result', 'independent-base64-img');
}

function decodeBase64Logic(inputId, resultId, imgId) {
  let input = document.getElementById(inputId).value.trim();
  const resultText = document.getElementById(resultId);
  const resultImg = document.getElementById(imgId);
  
  resultText.textContent = "";
  resultImg.style.display = "none";
  resultImg.src = "";

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
      resultImg.src = `data:${mimeType};base64,${input}`;
      resultImg.style.display = "block"; 
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

// ==========================================
// Hex デコード処理
// ==========================================
function runHex() {
  decodeHexLogic('tool-hex-input', 'tool-hex-result');
}

function runIndependentHex() {
  decodeHexLogic('independent-hex-input', 'independent-hex-result');
}

function decodeHexLogic(inputId, resultId) {
  const input = document.getElementById(inputId).value.trim();
  try {
    const hex = input.replace(/\s+/g, '').replace(/0x/gi, '');  
    const decoded = hex.match(/.{1,2}/g).map(function(b) {
      return String.fromCharCode(parseInt(b, 16));
    }).join('');
    showResult(resultId, decoded, false);
  } catch(e) {
    showResult(resultId, 'デコード失敗', true);
  }
}

// ==========================================
// シーザー ＆ アトバシュ 実行・ロジック処理
// ==========================================

// ドキュメント読み込み時にシフト数（1〜25）プルダウンを全画面分生成
window.addEventListener("DOMContentLoaded", () => {
  const selects = [
    document.getElementById("tool-caesar-shift"),
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

// 【独立画面用】 Caesar デコード
function runCaesar() {
  const input = document.getElementById("tool-caesar-input").value;
  const shiftSelect = document.getElementById("tool-caesar-shift");
  const shift = shiftSelect ? parseInt(shiftSelect.value, 10) : 1;
  const resultEl = document.getElementById("tool-caesar-result");
  if (!input) return;
  resultEl.textContent = `結果: ${decodeCaesarLogic(input, shift)}`;
  resultEl.style.color = "#00ffcc";
}

// 【演習画面用】 Caesar デコード
function runInlineCaesar() {
  const input = document.getElementById("inline-caesar-input").value;
  const shiftSelect = document.getElementById("inline-caesar-shift");
  const shift = shiftSelect ? parseInt(shiftSelect.value, 10) : 1;
  const resultEl = document.getElementById("inline-caesar-result");
  if (!input) return;
  resultEl.textContent = `結果: ${decodeCaesarLogic(input, shift)}`;
  resultEl.style.color = "#00ffcc";
}

// 【独立画面用】 Atbash デコード
function runAtbash() {
  const input = document.getElementById("tool-atbash-input").value;
  const resultEl = document.getElementById("tool-atbash-result");
  if (!input) return;
  resultEl.textContent = `結果: ${decodeAtbashLogic(input)}`;
  resultEl.style.color = "#00ffcc";
}

// 【演習画面用】 Atbash デコード
function runInlineAtbash() {
  const input = document.getElementById("inline-atbash-input").value;
  const resultEl = document.getElementById("inline-atbash-result");
  if (!input) return;
  resultEl.textContent = `結果: ${decodeAtbashLogic(input)}`;
  resultEl.style.color = "#00ffcc";
}

// Caesar 共通変換ロジック
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

// Atbash 共通変換ロジック
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

// ==========================================
// 結果表示関数
// ==========================================
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
}

// ==========================================
// 問題一覧の自動生成
// ==========================================
function createQuestionList() {
  const listContainer = document.getElementById("question-list");
  if (!listContainer) return;
  listContainer.innerHTML = ""; 

  questions.forEach((q, index) => {
    const btn = document.createElement("button");
    btn.className = "nav-btn"; 
    btn.style.backgroundColor = "#1e293b";
    btn.style.border = "1px solid #334155";
    btn.style.margin = "0"; 
    
    btn.innerHTML = `
      <span style="color: #0ea5e9; font-weight: bold; font-size: 18px;">Q ${index + 1}</span><br>
      <small style="color: #94a3b8;">難易度: ${q.difficulty}</small>
    `;

    btn.onclick = function() {
      selectQuestion(index);
    };
    listContainer.appendChild(btn);
  });
}

// ==========================================
// 一覧から問題を選択
// ==========================================
function selectQuestion(index) {
  currentQuestion = index; 
  showQuestion();          
  document.getElementById("result").textContent = "";
  document.getElementById("answer").value = "";
  showScreen("play-screen"); 
}
