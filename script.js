let correctAnswer = "flag{test}";


//テスト
function checkAnswer() {
  const userAnswer = document.getElementById("answer").value.trim().toLowerCase();

  if (userAnswer === "test") {
    document.getElementById("result").textContent = "正解！";
  } else {
    document.getElementById("result").textContent = "不正解";
  }
}
