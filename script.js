let correctAnswer = "flag{test}";

function checkAnswer() {
  let userAnswer = document.getElementById("answer").value;
  let result = document.getElementById("result");

  if (userAnswer === correctAnswer) {
    result.textContent = "正解！";
  } else {
    result.textContent = "不正解";
  }
}
//テスト
function checkAnswer() {
  const userAnswer = document.getElementById("answer").value.trim().toLowerCase();

  if (userAnswer === "test") {
    document.getElementById("result").textContent = "正解！";
  } else {
    document.getElementById("result").textContent = "不正解";
  }
}
