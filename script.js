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
    const rate = total > 0
        ? (success / total * 100).toFixed(1)
        : 0;

    document.getElementById("rate").textContent = rate;
}

function saveScore() {
    localStorage.setItem("success", success);
    localStorage.setItem("miss", miss);
}

async function prepareSound() {
    const AudioContext =
        window.AudioContext || window.webkitAudioContext;

    if (!audioContext && AudioContext) {
        audioContext = new AudioContext();
    }

    if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume();
    }
}

async function playTone(frequency, duration) {
    await prepareSound();

    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.5, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + duration
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

function addSuccess() {
    success++;
    saveScore();
    updateDisplay();
    playTone(1000, 0.3);
}

function addMiss() {
    miss++;
    saveScore();
    updateDisplay();
    playTone(300, 0.4);
}

function resetScore() {
    if (confirm("記録を0に戻しますか？")) {
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
        const originalWords = lastResult[0].transcript.trim();

        // 空白を除いて判定しやすくする
        const words = originalWords.replace(/\s/g, "");

        status.textContent = "聞き取った言葉：" + originalWords;

        const now = Date.now();

        if (now - lastCommandTime < 700) return;

        const successWords = [
            "まる", "マル", "丸", "○", "〇",
            "入った", "成功"
        ];

        const missWords = [
            "ばつ", "バツ", "罰", "×", "✕",
            "外れた", "外れ", "失敗"
        ];

        if (successWords.some(word => words.includes(word))) {
            lastCommandTime = now;
            addSuccess();
        } else if (missWords.some(word => words.includes(word))) {
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
                } catch {
                    voiceActive = false;
                    status.textContent = "音声入力が停止しました";
                }
            }, 500);
        }
    };

    recognition.start();
}

function stopVoice() {
    voiceActive = false;

    if (recognition) {
        recognition.stop();
    }

    document.getElementById("voiceStatus").textContent =
        "音声入力を停止しました";
}

updateDisplay();
