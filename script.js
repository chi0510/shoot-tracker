let success = Number(localStorage.getItem("success")) || 0;
let miss = Number(localStorage.getItem("miss")) || 0;

let recognition = null;
let voiceActive = false;
let audioContext = null;
let lastCommandTime = 0;

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

function prepareSound() {
    const AudioContext =
        window.AudioContext || window.webkitAudioContext;

    if (!audioContext && AudioContext) {
        audioContext = new AudioContext();
    }

    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playTone(frequency, duration) {
    if (!audioContext) {
        return;
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gain.gain.setValueAtTime(0.25, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + duration
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

function playSuccessSound() {
    playTone(880, 0.18);
}

function playMissSound() {
    playTone(330, 0.25);
}

function addSuccess() {
    success++;
    saveScore();
    updateDisplay();
    playSuccessSound();
}

function addMiss() {
    miss++;
    saveScore();
    updateDisplay();
    playMissSound();
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

function startVoice() {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    const status = document.getElementById("voiceStatus");

    if (!SpeechRecognition) {
        alert("このブラウザでは音声入力を使えません。");
        return;
    }

    if (voiceActive) {
        status.textContent = "すでに音声を聞き取り中です";
        return;
    }

    prepareSound();

    recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = false;

    voiceActive = true;

    status.textContent =
        "聞き取り中です。「マル」または「バツ」と話してください";

    recognition.onresult = function (event) {
        const lastResult = event.results[event.results.length - 1];
        const words = lastResult[0].transcript.trim();

        status.textContent = "聞き取った言葉：" + words;

        const now = Date.now();

        if (now - lastCommandTime < 700) {
            return;
        }

        if (
            words.includes("まる") ||
            words.includes("マル") ||
            words.includes("丸") ||
            words.includes("入った") ||
            words.includes("成功")
        ) {
            lastCommandTime = now;
            addSuccess();
        } else if (
            words.includes("ばつ") ||
            words.includes("バツ") ||
            words.includes("外れた") ||
            words.includes("外れ") ||
            words.includes("失敗")
        ) {
            lastCommandTime = now;
            addMiss();
        }
    };

    recognition.onerror = function (event) {
        if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
        ) {
            voiceActive = false;
            status.textContent = "マイクの使用が許可されていません";
            return;
        }

        status.textContent = "音声入力エラー：" + event.error;
    };

    recognition.onend = function () {
        if (voiceActive) {
            setTimeout(function () {
                try {
                    recognition.start();
                    status.textContent =
                        "聞き取り中です。「マル」または「バツ」と話してください";
                } catch (error) {
                    voiceActive = false;
                    status.textContent = "音声入力が停止しました";
                }
            }, 500);
        }
    };

    recognition.start();
}

function stopVoice() {
    const status = document.getElementById("voiceStatus");

    voiceActive = false;

    if (recognition) {
        recognition.stop();
    }

    status.textContent = "音声入力を停止しました";
}

updateDisplay();
