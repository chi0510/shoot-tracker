const successCountElement = document.getElementById("successCount");
const missCountElement = document.getElementById("missCount");
const successRateElement = document.getElementById("successRate");
const totalCountElement = document.getElementById("totalCount");

const successButton = document.getElementById("successButton");
const missButton = document.getElementById("missButton");
const resetButton = document.getElementById("resetButton");
const saveRecordButton = document.getElementById("saveRecordButton");

const voiceStartButton = document.getElementById("voiceStartButton");
const voiceStopButton = document.getElementById("voiceStopButton");
const voiceStatusElement = document.getElementById("voiceStatus");
const heardWordElement = document.getElementById("heardWord");

const todayDateElement = document.getElementById("todayDate");
const recordListElement = document.getElementById("recordList");

let successCount = Number(localStorage.getItem("successCount")) || 0;
let missCount = Number(localStorage.getItem("missCount")) || 0;

let recognition = null;
let voiceInputActive = false;
let lastCommand = "";
let lastCommandTime = 0;

function getTodayKey() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayLabel() {
  const today = new Date();

  return today.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  });
}

function updateTodayDate() {
  todayDateElement.textContent = getTodayLabel();
}

function saveCurrentCounts() {
  localStorage.setItem("successCount", successCount);
  localStorage.setItem("missCount", missCount);
  localStorage.setItem("currentCountDate", getTodayKey());
}

function updateDisplay() {
  const totalCount = successCount + missCount;

  let successRate = 0;

  if (totalCount > 0) {
    successRate = Math.round((successCount / totalCount) * 100);
  }

  successCountElement.textContent = successCount;
  missCountElement.textContent = missCount;
  totalCountElement.textContent = totalCount;
  successRateElement.textContent = successRate;

  saveCurrentCounts();
}

function addSuccess() {
  successCount++;
  updateDisplay();
}

function addMiss() {
  missCount++;
  updateDisplay();
}

function resetCurrentCounts() {
  const totalCount = successCount + missCount;

  if (totalCount === 0) {
    alert("現在のカウントは0本です。");
    return;
  }

  const confirmed = confirm(
    "今日のカウントを0に戻しますか？\n保存していない記録は消えます。"
  );

  if (!confirmed) {
    return;
  }

  successCount = 0;
  missCount = 0;

  updateDisplay();
}

function getRecords() {
  const savedRecords = localStorage.getItem("shootRecords");

  if (!savedRecords) {
    return [];
  }

  try {
    const records = JSON.parse(savedRecords);

    if (Array.isArray(records)) {
      return records;
    }

    return [];
  } catch (error) {
    console.error("記録の読み込みに失敗しました。", error);
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem("shootRecords", JSON.stringify(records));
}

function saveTodayRecord() {
  const totalCount = successCount + missCount;

  if (totalCount === 0) {
    alert("記録するシュートがまだありません。");
    return;
  }

  const successRate = Math.round((successCount / totalCount) * 100);
  const todayKey = getTodayKey();

  const records = getRecords();
  const existingRecordIndex = records.findIndex(
    record => record.date === todayKey
  );

  const todayRecord = {
    date: todayKey,
    success: successCount,
    miss: missCount,
    total: totalCount,
    rate: successRate
  };

  if (existingRecordIndex >= 0) {
    const confirmed = confirm(
      "今日の記録はすでに保存されています。\n現在の内容で上書きしますか？"
    );

    if (!confirmed) {
      return;
    }

    records[existingRecordIndex] = todayRecord;
  } else {
    records.push(todayRecord);
  }

  records.sort((a, b) => {
    return b.date.localeCompare(a.date);
  });

  saveRecords(records);
  displayRecords();

  alert("今日の記録を保存しました。");
}

function formatRecordDate(dateText) {
  const date = new Date(`${dateText}T00:00:00`);

  return date.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric"
  });
}

function displayRecords() {
  const records = getRecords();

  if (records.length === 0) {
    recordListElement.innerHTML =
      '<p class="no-record">まだ保存された記録はありません。</p>';

    return;
  }

  let tableHtml = `
    <table class="record-table">
      <thead>
        <tr>
          <th>日付</th>
          <th>成功</th>
          <th>失敗</th>
          <th>成功率</th>
        </tr>
      </thead>
      <tbody>
  `;

  records.forEach(record => {
    tableHtml += `
      <tr>
        <td>${formatRecordDate(record.date)}</td>
        <td>${record.success}</td>
        <td>${record.miss}</td>
        <td>${record.rate}％</td>
      </tr>
    `;
  });

  tableHtml += `
      </tbody>
    </table>
  `;

  recordListElement.innerHTML = tableHtml;
}

function resetCountsWhenDateChanges() {
  const savedDate = localStorage.getItem("currentCountDate");
  const todayKey = getTodayKey();

  if (savedDate && savedDate !== todayKey) {
    successCount = 0;
    missCount = 0;

    localStorage.setItem("successCount", "0");
    localStorage.setItem("missCount", "0");
    localStorage.setItem("currentCountDate", todayKey);
  }
}

function normalizeVoiceText(text) {
  return text
    .replace(/\s/g, "")
    .replace(/[。、！？!?]/g, "");
}

function processVoiceCommand(spokenText) {
  const normalizedText = normalizeVoiceText(spokenText);
  const now = Date.now();

  heardWordElement.textContent = `聞き取った言葉：${spokenText}`;

  if (
    normalizedText === lastCommand &&
    now - lastCommandTime < 1500
  ) {
    return;
  }

  if (normalizedText.includes("入った")) {
    lastCommand = normalizedText;
    lastCommandTime = now;

    addSuccess();
    voiceStatusElement.textContent = "成功を1本記録しました";
    return;
  }

  if (normalizedText.includes("外れた")) {
    lastCommand = normalizedText;
    lastCommandTime = now;

    addMiss();
    voiceStatusElement.textContent = "失敗を1本記録しました";
    return;
  }

  voiceStatusElement.textContent =
    "「入った」または「外れた」と言ってください";
}

function setupVoiceRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    voiceStatusElement.textContent =
      "このブラウザでは音声入力を使用できません。";

    voiceStartButton.disabled = true;
    voiceStopButton.disabled = true;

    return;
  }

  recognition = new SpeechRecognition();

  recognition.lang = "ja-JP";
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = function () {
    voiceStatusElement.textContent = "音声入力中です";
  };

  recognition.onresult = function (event) {
    for (
      let resultIndex = event.resultIndex;
      resultIndex < event.results.length;
      resultIndex++
    ) {
      const result = event.results[resultIndex];

      if (!result.isFinal) {
        continue;
      }

      const spokenText = result[0].transcript.trim();

      processVoiceCommand(spokenText);
    }
  };

  recognition.onerror = function (event) {
    console.error("音声認識エラー:", event.error);

    if (event.error === "not-allowed") {
      voiceStatusElement.textContent =
        "マイクの使用が許可されていません。";
      voiceInputActive = false;
      return;
    }

    if (event.error === "no-speech") {
      voiceStatusElement.textContent =
        "声が聞き取れませんでした。";
      return;
    }

    if (event.error === "audio-capture") {
      voiceStatusElement.textContent =
        "マイクを使用できません。";
      voiceInputActive = false;
      return;
    }

    voiceStatusElement.textContent =
      "音声入力でエラーが発生しました。";
  };

  recognition.onend = function () {
    if (!voiceInputActive) {
      voiceStatusElement.textContent = "音声入力は停止中です";
      return;
    }

    setTimeout(() => {
      try {
        recognition.start();
      } catch (error) {
        console.error("音声認識の再開に失敗しました。", error);
      }
    }, 300);
  };
}

function startVoiceInput() {
  if (!recognition) {
    return;
  }

  if (voiceInputActive) {
    voiceStatusElement.textContent = "すでに音声入力中です";
    return;
  }

  voiceInputActive = true;
  heardWordElement.textContent = "聞き取った言葉：―";

  try {
    recognition.start();
  } catch (error) {
    console.error("音声入力を開始できませんでした。", error);
  }
}

function stopVoiceInput() {
  if (!recognition) {
    return;
  }

  voiceInputActive = false;

  try {
    recognition.stop();
  } catch (error) {
    console.error("音声入力を停止できませんでした。", error);
  }

  voiceStatusElement.textContent = "音声入力は停止中です";
}

successButton.addEventListener("click", addSuccess);
missButton.addEventListener("click", addMiss);
resetButton.addEventListener("click", resetCurrentCounts);
saveRecordButton.addEventListener("click", saveTodayRecord);

voiceStartButton.addEventListener("click", startVoiceInput);
voiceStopButton.addEventListener("click", stopVoiceInput);

resetCountsWhenDateChanges();
updateTodayDate();
updateDisplay();
displayRecords();
setupVoiceRecognition();
