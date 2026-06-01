let questions = [];
let currentQuestion = 0;

// JSON読み込み
fetch("questions.json")
  .then(response => response.json())
  .then(data => {
    questions = data;
    showQuestion();
  });

// 問題表示関数
function showQuestion() {
  q=questions[currentQuestion];
  document.getElementById("difficulty").textContent = "難易度: " + q.difficulty;
  document.getElementById("question").textContent =q.question;
}

// 正解判定
function checkAnswer() {

  let userAnswer =
    document.getElementById("answer").value;
  
  let correctAnswer =
    questions[currentQuestion].answer;
  
  let result =
    document.getElementById("result");
  
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

      document.getElementById("question").textContent =
        "全問クリア！";

    }

  } else {

    result.textContent = "不正解";

  }
}
// 修正版 Base64デコード
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
// Hexデコード
// 参考: https://stackoverflow.com/questions/3745666
function runHex() {
  const input = document.getElementById('tool-hex-input').value.trim();
  try {
    const hex = input.replace(/\s+/g, '').replace(/0x/gi, '');
    const decoded = hex.match(/.{1,2}/g).map(function(b) {
      return String.fromCharCode(parseInt(b, 16));
    }).join('');
    showResult('tool-hex-result', decoded, false);
  } catch(e) {
    showResult('tool-hex-result', 'デコード失敗', true);
  }
}
