let success = Number(localStorage.getItem("success")) || 0;
let miss = Number(localStorage.getItem("miss")) || 0;

function updateDisplay() {
    document.getElementById("success").textContent = success;
    document.getElementById("miss").textContent = miss;

    const total = success + miss;
    let rate = 0;

    if (total > 0) {
        rate = (success / total * 100).toFixed(1);
    }

    document.getElementById("rate").textContent = rate;
}

function saveScore() {
    localStorage.setItem("success", success);
    localStorage.setItem("miss", miss);
}

function addSuccess() {
    success++;
    saveScore();
    updateDisplay();
}

function addMiss() {
    miss++;
    saveScore();
    updateDisplay();
}

function resetScore() {
    const answer = confirm("記録を0に戻しますか？");

    if (answer) {
        success = 0;
        miss = 0;
        saveScore();
        updateDisplay();
    }
}

updateDisplay();
