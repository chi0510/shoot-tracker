let success = 0;
let miss = 0;

function updateDisplay() {

    document.getElementById("success").textContent = success;

    document.getElementById("miss").textContent = miss;

    let total = success + miss;

    let rate = 0;

    if(total > 0){
        rate = (success / total * 100).toFixed(1);
    }

    document.getElementById("rate").textContent = rate;

}

function addSuccess(){

    success++;

    updateDisplay();

}

function addMiss(){

    miss++;

    updateDisplay();

}function resetScore() {

    success = 0;
    miss = 0;

    updateDisplay();

}