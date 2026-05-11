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
  document.getElementById("question").textContent =
    questions[currentQuestion].question;
}

// 正解判定
function checkAnswer() {

  let userAnswer =
    document.getElementById("answer").value;
  
  let correctAnswer =
    questions[currentQuestion].answer;
  
  let result =
    document.getElementById("result");
  
  if (userAnswer === correctAnswer) {

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
