let questions = [];
let currentQuestion = 0;

// ==========================================
// 【新設】ステータスを記録するための変数
// ==========================================
let userRate = 1000;    // 初期レート
let userSolved = 0;    // 正解数
let userAttempts = 0;  // 挑戦数

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
    showQuestion();        // 最初の一問目をセット
    createQuestionList();  // 問題一覧を自動で作る！
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
// 【新設】上部のステータス画面を最新データに書き換える関数
// ==========================================
function updateStatusDOM() {
  // 1. レート、正解数、挑戦数を画面に反映
  document.getElementById("user-rate").textContent = userRate;
  document.getElementById("user-solved").textContent = userSolved;
  document.getElementById("user-attempts").textContent = userAttempts;

  // 2. 正答率を計算（挑戦数が0の時は0%にするエラー回避）
  let accuracy = 0;
  if (userAttempts > 0) {
    accuracy = Math.round((userSolved / userAttempts) * 100); // 四捨五入してパーセントに
  }
  document.getElementById("user-accuracy").textContent = accuracy + "%";
}

// ==========================================
// 正解判定（【改造】ステータスの自動変動を追加！）
// ==========================================
function checkAnswer() {
  let userAnswer = document.getElementById("answer").value;
  let correctAnswer = questions[currentQuestion].answer;
  let result = document.getElementById("result");
  
  // 送信ボタンを押したので、正解・不正解に関わらず「挑戦数」を1増やす
  userAttempts++;

  if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {  //toLowercaseで小文字、大文字を無視する。
    result.textContent = "正解！";

    // 正解したので「正解数」を1増やし、レートを「+20」する
    userSolved++;
    userRate += 20;

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
    // 間違えたらレートを「-10」する（0未満にはならない安全設計）
    if (userRate > 10) {
      userRate -= 10;
    } else {
      userRate = 0;
    }
  }

  // すべての計算が終わったので、最新の数値を画面上部にパッと反映！
  updateStatusDOM();
}

// ==========================================
// 改造版 Base64デコード（画像対応・完全版）
// ==========================================
function runBase64() {
  let input = document.getElementById('tool-base64-input').value.trim();
  const resultText = document.getElementById('tool-base64-result');
  const resultImg = document.getElementById('tool-base64-img');
  
  // 一度表示をリセットする
  resultText.textContent = "";
  resultImg.style.display = "none";
  resultImg.src = "";

  if (!input) return;

  // 最初から「data:image」で始まっているかどうかのチェック
  let isImageUri = input.startsWith('data:image');
  let mimeType = 'image/png'; // デフォルト

  // 「data:image/...」の形式なら、ここでMIMEタイプを特定しておく
  if (isImageUri) {
    if (input.includes('image/jpeg') || input.includes('image/jpg')) mimeType = 'image/jpeg';
    if (input.includes('image/gif')) mimeType = 'image/gif';
    
    // ヘッダーを削って、純粋なBase64データだけにする
    input = input.split(',')[1].trim();
  }

  try {
    // 【判定の魔法】
    const lowerInput = input.toLowerCase();
    
    if (isImageUri || lowerInput.startsWith('ivborw') || lowerInput.startsWith('/9j/') || lowerInput.startsWith('r0lg')) {
      
      // 純粋なBase64から判定する場合のMIMEタイプ決定
      if (!isImageUri) {
        if (lowerInput.startsWith('/9j/')) mimeType = 'image/jpeg';
        if (lowerInput.startsWith('r0lg')) mimeType = 'image/gif';
      }

      // <img>タグにデータを流し込む
      resultImg.src = `data:${mimeType};base64,${input}`;
      resultImg.style.display = "block"; // 画像を表示する
      
      showResult('tool-base64-result', '画像のデコードに成功しました！', false);
      
    } else {
      // 画像じゃなければ、普通の文字としてデコードする
      const binString = atob(input);
      const bytes = Uint8Array.from(binString, function(c) { return c.charCodeAt(0); });
      const decoded = new TextDecoder().decode(bytes);
      
      showResult('tool-base64-result', decoded, false);
    }
  } catch(e) {
    showResult('tool-base64-result', 'デコード失敗（正しいBase64ではありません）', true);
  }
}

// ==========================================
// Hexデコード
// ==========================================
function runHex() {
  const input = document.getElementById('tool-hex-input').value.trim();
  try {
    const hex = input.replace(/\s+/g, '').replace(/0x/gi, '');  //replace(/\s+/g, '')は全部の空白をなもしないに変えるという意味
    const decoded = hex.match(/.{1,2}/g).map(function(b) {
      return String.fromCharCode(parseInt(b, 16));
    }).join('');
    showResult('tool-hex-result', decoded, false);
  } catch(e) {
    showResult('tool-hex-result', 'デコード失敗', true);
  }
}

// ==========================================
// デコード結果を画面に表示する関数
// ==========================================
function showResult(resultId, message, isError) {
  const resultElement = document.getElementById(resultId);
  if (resultElement) {
    resultElement.textContent = message;
    if (isError) {
      resultElement.style.color = "#ef4444"; // エラー時の赤
    } else {
      resultElement.style.color = "#00ffcc"; // サイバーなネオンブルー
    }
  }
}

// ==========================================
// 問題一覧を自動で生成する関数
// ==========================================
function createQuestionList() {
  const listContainer = document.getElementById("question-list");
  if (!listContainer) return;

  listContainer.innerHTML = ""; // 初期化

  questions.forEach((q, index) => {
    // 1. ボタン部品を作る
    const btn = document.createElement("button");
    btn.className = "nav-btn"; // デザインの使い回し
    btn.style.backgroundColor = "#1e293b";
    btn.style.border = "1px solid #334155";
    btn.style.margin = "0"; // グリッド配置用にマージン調整
    
    // 2. 表示する文字をセット
    btn.innerHTML = `
      <span style="color: #0ea5e9; font-weight: bold; font-size: 18px;">Q ${index + 1}</span><br>
      <small style="color: #94a3b8;">難易度: ${q.difficulty}</small>
    `;

    // 3. クリックされた時のジャンプ処理を仕込む
    btn.onclick = function() {
      selectQuestion(index);
    };

    // 4. 一覧の箱に追加
    listContainer.appendChild(btn);
  });
}

// ==========================================
// 一覧から問題が選ばれたときに動く関数
// ==========================================
function selectQuestion(index) {
  currentQuestion = index; // 選んだ番号に変更
  showQuestion();          // その問題を表示
  
  // 過去の正誤判定のテキストと、入力欄を綺麗に消す
  document.getElementById("result").textContent = "";
  document.getElementById("answer").value = "";
  
  showScreen("play-screen"); // 問題画面にジャンプ！
}
