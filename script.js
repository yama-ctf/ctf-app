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
// 解答欄の下の「簡易解析ツール ▽」を開閉する関数
// ==========================================
function toggleDropdown() {
  const dropdown = document.getElementById('tools-dropdown');
  const arrow = document.getElementById('arrow-icon');
  
  // 0px または 設定されていない場合
  if (dropdown.style.maxHeight === '0px' || !dropdown.style.maxHeight) {
    // 中身のコンテンツの実際の高さ（px）を動的に指定する
    dropdown.style.maxHeight = dropdown.scrollHeight + "px";
    arrow.style.transform = "rotate(180deg)";
  } else {
    dropdown.style.maxHeight = "0px";
    arrow.style.transform = "rotate(0deg)";
  }
}

// セレクトボックス切り替え時も高さを再計算させる
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
  
  // ツールの切り替えで高さが変わるので、開いている時は高さを再帰的に合わせる
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

// ==========================================
// 正解判定
// ==========================================
function checkAnswer() {
  let userAnswer = document.getElementById("answer").value;
  let correctAnswer = questions[currentQuestion].answer;
  let result = document.getElementById("result");
  
  userAttempts++;

  if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {  
    result.textContent = "正解！";
    userSolved++;
    userRate += 20;
    currentQuestion++;

    if (currentQuestion < questions.length) {
      showQuestion();
      document.getElementById("answer").value = "";
    } else {
      document.getElementById("question").textContent = "全問クリア！";
    }
  } else {
    result.textContent = "不正解";
    if (userRate > 10) {
      userRate -= 10;
    } else {
      userRate = 0;
    }
  }
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
