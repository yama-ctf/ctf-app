let questions = [];
let currentQuestion = 0;

// ステータスを記録するための変数
let userRate = 1000;    
let userSolved = 0;     
let userAttempts = 0;   
let lastSubmittedAnswer = ""; 

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

// 簡易解析ツールの切り替え関数（全ツール対応版）
function switchInlineTool() {
  const selected = document.getElementById('inline-tool-selector').value;
  const areas = {
    base64: document.getElementById('inline-base64-area'),
    hex: document.getElementById('inline-hex-area'),
    binary: document.getElementById('inline-binary-area'),
    caesar: document.getElementById('inline-caesar-area'),
    atbash: document.getElementById('inline-atbash-area'),
    vigenere: document.getElementById('inline-vigenere-area'),
    url: document.getElementById('inline-url-area'),
    html: document.getElementById('inline-html-area'),
    hash: document.getElementById('inline-hash-area')
  };
  const dropdown = document.getElementById('tools-dropdown');

  for (const key in areas) {
    if (areas[key]) {
      areas[key].style.display = (key === selected) ? 'block' : 'none';
    }
  }

  // アコーディオンの高さ自動調整
  if (dropdown && dropdown.style.maxHeight !== '0px' && dropdown.style.maxHeight) {
    dropdown.style.maxHeight = dropdown.scrollHeight + "px";
  }
}

// 独立画面ツールの表示切替関数
function switchMainTool() {
  const tool = document.getElementById('tool-select').value;
  const caesarExtra = document.getElementById('tool-extra-caesar');
  const vigenereExtra = document.getElementById('tool-extra-vigenere');

  if (caesarExtra) caesarExtra.style.display = (tool === 'caesar') ? 'block' : 'none';
  if (vigenereExtra) vigenereExtra.style.display = (tool === 'vigenere') ? 'block' : 'none';
}

// JSON読み込み
fetch("questions.json")
  .then(response => response.json())
  .then(data => {
    questions = data;
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
}

// 次の問題をロードする関数
function loadNextQuestion() {
  if (currentQuestion + 1 < questions.length) {
    currentQuestion++;
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

// 正解判定（Eloレーティング ＆ 連打対策版）
function checkAnswer() {
  if (questions.length === 0 || currentQuestion >= questions.length) return;

  let q = questions[currentQuestion];
  if (q.isCleared) {
    document.getElementById("result").textContent = "この問題はすでにクリア済みです。";
    document.getElementById("result").style.color = "#94a3b8";
    return;
  }

  // 1. 入力値の取得
  let userAnswer = document.getElementById("answer").value.trim();

  // 連投防止
  if (userAnswer === lastSubmittedAnswer) {
    return;    
  }   
  lastSubmittedAnswer = userAnswer;    

  let result = document.getElementById("result");
  userAttempts++;

  // イロレーティング計算用
  const rProblem = Number(q.difficulty) || 1200;
  const rUser = userRate;
  const K = 32; 
  const expectedScore = 1 / (1 + Math.pow(10, (rProblem - rUser) / 400));
  let rateChange = 0;

  // 2. 複数回答（配列）に対応した正解判定
  let isCorrect = false;
  if (Array.isArray(q.answer)) {
    isCorrect = q.answer.some(ans => ans.toString().trim().toLowerCase() === userAnswer.toLowerCase());
  } else {
    isCorrect = (q.answer.toString().trim().toLowerCase() === userAnswer.toLowerCase());
  }

  // 3. 正解・不正解の分岐処理
  if (isCorrect) {  
    result.textContent = "正解！";
    result.style.color = "#00ffcc"; 
    userSolved++;
    q.isCleared = true; // クリアフラグ

    // レート上昇計算
    rateChange = Math.round(K * (1 - expectedScore));
    userRate += rateChange;

    updateStatusDOM(); // ステータスUI更新呼び出し

    // 【重要】正解後に次の問題をロードする処理
    setTimeout(() => {
      lastSubmittedAnswer = ""; // 送信ロックを解除
      document.getElementById("answer").value = ""; // 入力欄をクリア
      loadNextQuestion(); // 次の問題へ進む
    }, 1500); // 1.5秒後に実行

  } else {
    result.textContent = "不正解...";
    result.style.color = "#ef4444";

    // レート下落計算
    rateChange = Math.round(K * (0 - expectedScore));
    userRate = Math.max(0, userRate + rateChange); // 0未満にはならない
    
    updateStatusDOM(); // ステータスUI更新呼び出し
    
    // 不正解のときは再度試行できるようにロックを解除
    lastSubmittedAnswer = ""; 
  }
} // ← この閉じカッコが欠落していました

// Base64 デコード処理
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

// Hex デコード処理
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

// Binary (2進数) デコード処理
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

// Caesar ＆ Atbash 初期化設定
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

// Caesar ＆ Atbash 実行・変換ロジック
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

// Vigenere デコード処理
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
  let keyIndex = 0;
  const cleanKey = key.toUpperCase();

  for (let i = 0; i < cipherText.length; i++) {
    let charCode = cipherText.charCodeAt(i);
    if (charCode >= 65 && charCode <= 90) {
      let shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
      result += String.fromCharCode(((charCode - 65 - shift + 26) % 26) + 65);
      keyIndex++;
    } else if (charCode >= 97 && charCode <= 122) {
      let shift = cleanKey.charCodeAt(keyIndex % cleanKey.length) - 65;
      result += String.fromCharCode(((charCode - 97 - shift + 26) % 26) + 97);
      keyIndex++;
    } else {
      result += cipherText[i];
    }
  }
  return result;
}

// URL デコード処理
function runInlineUrl() {
  const input = document.getElementById("inline-url-input").value.trim();
  if (!input) return;
  try {
    showResult("inline-url-result", decodeURIComponent(input), false);
  } catch(e) {
    showResult("inline-url-result", "デコード失敗", true);
  }
}

// HTML デコード処理
function runInlineHtml() {
  const input = document.getElementById("inline-html-input").value.trim();
  if (!input) return;
  const doc = new DOMParser().parseFromString(input, 'text/html');
  showResult("inline-html-result", doc.body.textContent, false);
}

// Hash (MD5 / SHA1 / SHA256) 識別処理
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

// 【独立画面用】統合実行処理
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

// 結果表示用 共通関数
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

// 問題一覧の自動生成
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

// 一覧から問題を選択
function selectQuestion(index) {
  currentQuestion = index; 
  showQuestion();           
  document.getElementById("result").textContent = "";
  document.getElementById("answer").value = "";
  showScreen("play-screen"); 
}
