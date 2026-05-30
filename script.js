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
