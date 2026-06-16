let questions = [];
let currentQuestion = 0;

// ==========================================
// 画面切り替え関数
// ==========================================
function showScreen(screenId) {
  // 1. まず、すべての画面（.page-screen）から「active」クラスを取り除く（全部隠す）
  const screens = document.querySelectorAll('.page-screen');
  screens.forEach(screen => {
    screen.classList.remove('active');
  });

  // 2. クリックされたボタンに対応する画面（ID）にだけ「active」クラスをつける（それだけ表示する）
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
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
  });

// ==========================================
// 問題表示関数
// ==========================================
function showQuestion() {
  if (questions.length === 0) return; // データがない時の安全策
  let q = questions[currentQuestion];
  document.getElementById("difficulty").textContent = "難易度: " + q.difficulty;
  document.getElementById("question").textContent = q.question;
}

// ==========================================
// 正解判定
// ==========================================
function checkAnswer() {
  let userAnswer = document.getElementById("answer").value;
  let correctAnswer = questions[currentQuestion].answer;
  let result = document.getElementById("result");
  
  if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {  //toLowercaseで小文字、大文字を無視する。
    result.textContent = "正解！";

    // 次の問題へ
    currentQuestion++;

    // まだ問題がある場合
    if (currentQuestion < questions.length) {
      showQuestion();
      // 入力欄を空にする
      document.getElementById("answer").value = "";
    } else {
      document.getElementById("question").textContent = "全問クリア！";
    }
  } else {
    result.textContent = "不正解";
  }
}

// ==========================================
// 修正版 Base64デコード
// ==========================================
function runBase64() {
  const input = document.getElementById('tool-base64-input').value.trim();
  try {
    // 文字列をバイナリ（Uint8Array）に変換してからデコード
    const binString = atob(input);
    const bytes = Uint8Array.from(binString, function(c) { return c.charCodeAt(0); });
    const decoded = new TextDecoder().decode(bytes);
    showResult('tool-base64-result', decoded, false);
  } catch(e) {
    showResult('tool-base64-result', 'デコード失敗', true);
  }
}

// ==========================================
// Hexデコード
// ==========================================
function runHex() {
  const input = document.getElementById('tool-hex-input').value.trim();
  try {
    const hex = input.replace(/\s+/g, '').replace(/0x/gi, '');  //replace(/\s+/g, '')は全部の空白をなにもないに変えるという意味（\s+）連続した空白という意味 .replace(/0x/gi, '')これも0xを何もないに変える、gが全部, iが小文字でも大文字でもよいとしている
    const decoded = hex.match(/.{1,2}/g).map(function(b) {
      return String.fromCharCode(parseInt(b, 16));
    }).join('');
    showResult('tool-hex-result', decoded, false);
  } catch(e) {
    showResult('tool-hex-result', 'デコード失敗', true);
  }
}

// ==========================================
// 【ここに追加しました！】デコード結果を画面に表示する関数
// ==========================================
function showResult(resultId, message, isError) {
  const resultElement = document.getElementById(resultId);
  if (resultElement) {
    // 結果の文字を書き換える
    resultElement.textContent = message;
    
    // エラーなら赤文字、成功なら青緑っぽく光らせる
    if (isError) {
      resultElement.style.color = "#ef4444"; // エラー時の赤
    } else {
      resultElement.style.color = "#00ffcc"; // サイバーなネオンブルー
    }
  }
}
