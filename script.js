let questions = [];
let currentQuestion = 0;

// ==========================================
// ステータスを記録するための変数
// ==========================================
let userRate = 1000;   
let userSolved = 0;    
let userAttempts = 0;  

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
// 解答欄の下の「簡易解析ツール ▽」を開閉する関数（スマート化）
// ==========================================
function toggleDropdown() {
  const dropdown = document.getElementById('tools-dropdown');
  const arrow = document.getElementById('arrow-icon');
  
  if (dropdown.style.maxHeight === '0px' || !dropdown.style.maxHeight) {
    dropdown.style.maxHeight = dropdown.scrollHeight + "px"; // 中身の正確な高さを自動計算
    arrow.style.transform = "rotate(180deg)";
  } else {
    dropdown.style.maxHeight = "0px";
    arrow.style.transform = "rotate(0deg)";
  }
}

// ==========================================
// セレクトボックスで「Base64」と「Hex」の表示を切り替える関数（スマート化）
// ==========================================
function switchInlineTool() {
  const selected = document.getElementById('inline-tool-selector').value;
  const base64Area = document.getElementById('inline-base64-area');
  const hexArea = document.getElementById('inline-hex-area');
  const dropdown = document.getElementById('tools-dropdown');
  
  if (selected === 'base64') {
    base64Area.style.display = 'block';
    hexArea.style.display = 'none';
  } else {
    base64Area.style.display = 'none';
    hexArea.style.display = 'block';
  }

  // 表示エリアが変わって高さがズレるのをリアルタイムで再調整する
  if (dropdown.style.maxHeight !== '0px' && dropdown.style.maxHeight) {
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


// スクリプトの上のほう（currentQuestionなどの近く）にこれを追加
let lastSubmittedAnswer = ""; 

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

  // ──────────────────────────────────────────
  // 【Eloレーティング計算の準備】
  // ──────────────────────────────────────────
  // 問題のレート値（jsonにない場合はデフォルト1200とする）
  const rProblem = q.difficultyRate || 1200; 
  const rUser = userRate;
  const K = 32; // 変動幅の係数（K-factor）

  // 1. ユーザーがこの問題を解ける「期待値（勝率）」を計算
  const expectedScore = 1 / (1 + Math.pow(10, (rProblem - rUser) / 400));
  let rateChange = 0;

  if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {  
    result.textContent = "正解！";
    result.style.color = "#00ffcc"; 

    userSolved++;
    q.isCleared = true;

    // 2. 正解したときのレート変動量（期待値が低いほど、勝ったとき大きく増える）
    rateChange = Math.round(K * (1 - expectedScore));
    // 最低でも+2はされるように安全策
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
    
    // 3. 不正解（負け）のときのレート変動量（期待値が高い格下に負けるほど、大きく減る）
    rateChange = Math.round(K * (0 - expectedScore));
    // 最大でもペナルティは-15までに抑えるなどのマイルド調整（お好みで）
    if (rateChange > -2) rateChange = -2; 

    userRate += rateChange; // rateChangeはマイナスの値が入る

    // レートが0未満にならないようにするガード
    if (userRate < 0) {
      userRate = 0;
    }
  }

  // 最新のステータスを画面に反映
  updateStatusDOM();
}
// ==========================================
// 【演習画面用】Base64デコード
// ==========================================
function runBase64() {
  decodeBase64Logic('tool-base64-input', 'tool-base64-result', 'tool-base64-img');
}

// ==========================================
// 【独立画面用】Base64デコード
// ==========================================
function runIndependentBase64() {
  decodeBase64Logic('independent-base64-input', 'independent-base64-result', 'independent-base64-img');
}

// Base64処理の共通化
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
// 【演習画面用】Hexデコード
// ==========================================
function runHex() {
  decodeHexLogic('tool-hex-input', 'tool-hex-result');
}

// ==========================================
// 【独立画面用】Hexデコード
// ==========================================
function runIndependentHex() {
  decodeHexLogic('independent-hex-input', 'independent-hex-result');
}

// Hex処理の共通化
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
