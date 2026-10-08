// 遊戲狀態
const STATE_START = 0;
const STATE_QUESTION = 1;
const STATE_FEEDBACK = 2;
const STATE_END = 3;

let currentState = STATE_START;

// 測驗資料
let currentQuestion = {};
let questionNumber = 1;
const totalQuestions = 5; // 設定為 5 題
let score = 0;
let selectedOptionIndex = -1; // 記錄使用者點擊的選項

// 飛航英文代碼題庫與混淆選項 (陣列的第一個元素為正確 ICAO 代碼，其餘為混淆單字)
const aviationDict = {
    'A': ['Alpha', 'Apple', 'Actor', 'Angel', 'Arrow'],
    'B': ['Bravo', 'Banana', 'Bear', 'Bread', 'Black'],
    'C': ['Charlie', 'Cat', 'Candy', 'Cloud', 'Circle'],
    'D': ['Delta', 'Dog', 'Dance', 'Dream', 'Door'],
    'E': ['Echo', 'Eagle', 'Earth', 'Empty', 'Elephant'],
    'F': ['Foxtrot', 'Fire', 'Fish', 'Flower', 'Forest'],
    'G': ['Golf', 'Goat', 'Good', 'Green', 'Grape'],
    'H': ['Hotel', 'House', 'Happy', 'Heart', 'Horse'],
    'I': ['India', 'Ice', 'Island', 'Iron', 'Image'],
    'J': ['Juliett', 'Juice', 'Jump', 'Jelly', 'Jungle'],
    'K': ['Kilo', 'King', 'Kite', 'Key', 'Knife'],
    'L': ['Lima', 'Lion', 'Light', 'Love', 'Lemon'],
    'M': ['Mike', 'Monkey', 'Moon', 'Magic', 'Music'],
    'N': ['November', 'Night', 'Nurse', 'North', 'Nature'],
    'O': ['Oscar', 'Ocean', 'Orange', 'Onion', 'Orbit'],
    'P': ['Papa', 'Pencil', 'Paper', 'Piano', 'Pizza'],
    'Q': ['Quebec', 'Queen', 'Quiet', 'Quick', 'Quest'],
    'R': ['Romeo', 'River', 'Rain', 'Rabbit', 'Rose'],
    'S': ['Sierra', 'Sun', 'Star', 'Snake', 'Silver'],
    'T': ['Tango', 'Tiger', 'Tree', 'Time', 'Train'],
    'U': ['Uniform', 'Umbrella', 'Uncle', 'Under', 'Union'],
    'V': ['Victor', 'Voice', 'Video', 'Valley', 'Violin'],
    'W': ['Whiskey', 'Water', 'Wind', 'World', 'White'],
    'X': ['X-ray', 'Xylophone', 'Xerox', 'Xenon', 'Xmas'],
    'Y': ['Yankee', 'Yellow', 'Year', 'Yard', 'Yogurt'],
    'Z': ['Zulu', 'Zebra', 'Zero', 'Zone', 'Zoom']
};

// UI 元素位置參數
let btnWidth, btnHeight;
let options = []; // 儲存四個選項按鈕的資訊

// 回饋訊息
let feedbackText = "";
let feedbackColor = "";

function setup() {
    // 動態引入 Google Fonts (Noto Sans TC 繁體中文)，讓 JS 檔能獨立運作
    let link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    createCanvas(windowWidth, windowHeight);
    textAlign(CENTER, CENTER);
    
    // 設定 p5.js 使用該字型，並提供系統預設無襯線字型作為備用
    textFont("'Noto Sans TC', sans-serif");
    
    calculateUI();
}

// 當視窗大小改變時，重新計算 UI 元素的位置 (響應式設計)
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    calculateUI();
}

function calculateUI() {
    // 儲存現有選項文字，避免 resize 時消失
    let currentTexts = options.map(opt => opt.text);
    
    let isPortrait = height > width;
    let isMobileLandscape = !isPortrait && height < 500;

    // 計算按鈕基準尺寸與間距
    btnHeight = min(height * 0.12, 60);
    let gap = min(height * 0.04, 20);
    
    // 若為手機橫屏，將題目區塊往上推
    let startY = isMobileLandscape ? height * 0.4 : height * 0.45;
    
    options = [];
    
    // 決定排列方式 (手機直式使用 1欄4列，平板/電腦/橫式使用 2欄2列)
    if (isPortrait && width < 768) {
        // 1欄 4列
        btnWidth = min(width * 0.85, 400);
        for (let i = 0; i < 4; i++) {
            options.push({ 
                x: width / 2 - btnWidth / 2, 
                y: startY + i * (btnHeight + gap), 
                w: btnWidth, 
                h: btnHeight, 
                text: currentTexts[i] || "" 
            });
        }
    } else {
        // 2欄 2列
        btnWidth = min(width * 0.4, 350);
        let startX1 = width / 2 - btnWidth - (gap / 2);
        let startX2 = width / 2 + (gap / 2);
        let row1Y = startY;
        let row2Y = startY + btnHeight + gap;

        options.push({ x: startX1, y: row1Y, w: btnWidth, h: btnHeight, text: currentTexts[0] || "" });
        options.push({ x: startX2, y: row1Y, w: btnWidth, h: btnHeight, text: currentTexts[1] || "" });
        options.push({ x: startX1, y: row2Y, w: btnWidth, h: btnHeight, text: currentTexts[2] || "" });
        options.push({ x: startX2, y: row2Y, w: btnWidth, h: btnHeight, text: currentTexts[3] || "" });
    }
}

function draw() {
    background(255); // 全螢幕白色背景

    if (currentState === STATE_START) {
        drawStartScreen();
    } else if (currentState === STATE_QUESTION) {
        drawQuestionScreen();
    } else if (currentState === STATE_FEEDBACK) {
        drawQuestionScreen(); // 保持題目顯示與按鈕顏色
        drawFeedback();       // 覆蓋回饋訊息遮罩
    } else if (currentState === STATE_END) {
        drawEndScreen();
    }
}

function drawStartScreen() {
    let baseSize = min(width, height);
    
    // 移除邊框並使用深色文字以搭配白底
    fill(50); 
    noStroke();
    textSize(min(baseSize * 0.08, 48));
    text("飛航英文 (ICAO) 測驗", width / 2, height * 0.3);
    
    textSize(min(baseSize * 0.05, 24));
    text("共 " + totalQuestions + " 題 (Alpha, Bravo...)", width / 2, height * 0.45);

    // 開始按鈕 (響應式大小與位置)
    let btnW = min(width * 0.6, 300);
    let btnY = height > 500 ? height * 0.6 : height * 0.65;
    drawButton(width / 2 - btnW / 2, btnY, btnW, btnHeight, "開始測驗", color(76, 175, 80));
}

function drawQuestionScreen() {
    let baseSize = min(width, height);
    
    // 顯示題號與分數
    fill(100); // 灰色文字
    noStroke();
    textSize(min(baseSize * 0.04, 20));
    textAlign(LEFT, TOP);
    text("第 " + questionNumber + " / " + totalQuestions + " 題", 20, 20);
    textAlign(RIGHT, TOP);
    text("得分: " + score, width - 20, 20);
    textAlign(CENTER, CENTER); // 恢復置中

    // 顯示題目
    fill(50); // 深灰色文字
    textSize(min(baseSize * 0.08, 40));
    let qY = (height < 500) ? height * 0.25 : height * 0.3;
    text(currentQuestion.q, width / 2, qY);
    
    // 顯示選項按鈕與顏色邏輯
    for (let i = 0; i < options.length; i++) {
        let isHover = mouseX > options[i].x && mouseX < options[i].x + options[i].w &&
                      mouseY > options[i].y && mouseY < options[i].y + options[i].h;
        
        let btnColor = color(240); // 預設按鈕顏色
        let textColor = color(50); // 預設文字顏色

        if (currentState === STATE_QUESTION && isHover) {
            btnColor = color(220, 240, 255); // 懸停特效
        } else if (currentState === STATE_FEEDBACK) {
            // 回饋狀態時的按鈕顏色判定
            if (options[i].text === currentQuestion.a) {
                btnColor = color('#cad182'); // 正確選項變為綠色
                textColor = color(255);
            } else if (i === selectedOptionIndex) {
                btnColor = color('#ff8fab'); // 錯誤被選取的選項變為粉紅色
                textColor = color(255);
            }
        }
        
        drawButton(options[i].x, options[i].y, options[i].w, options[i].h, options[i].text, btnColor, textColor);
    }
}

function drawFeedback() {
    let baseSize = min(width, height);
    
    // 半透明遮罩
    fill(255, 255, 255, 180);
    rect(0, 0, width, height);

    // 顯示對錯文字
    stroke(50);
    strokeWeight(2);
    fill(feedbackColor);
    textSize(min(baseSize * 0.12, 64));
    text(feedbackText, width / 2, height / 2 - 50);

    // 顯示繼續提示
    fill(100);
    noStroke();
    textSize(min(baseSize * 0.06, 24));
    
    // 閃爍效果
    if (frameCount % 60 < 30) {
        text("點擊畫面繼續", width / 2, height / 2 + 50);
    }
}

function drawEndScreen() {
    let baseSize = min(width, height);
    let yOffset = height < 500 ? 0 : height * 0.1;
    
    fill(50);
    noStroke();
    textSize(min(baseSize * 0.1, 64));
    text("測驗結束！", width / 2, height * 0.2 + yOffset);

    // 根據分數給予不同評語
    let percentage = score / totalQuestions;
    let comment = "";
    let cColor = color(50); // 預設顏色改為深灰
    if (percentage === 1) { comment = "太棒了！全對！"; cColor = color(255, 193, 7); }
    else if (percentage >= 0.8) { comment = "表現得很好！"; cColor = color(76, 175, 80); }
    else if (percentage >= 0.6) { comment = "及格了，繼續加油！"; cColor = color(33, 150, 243); }
    else { comment = "需要多練習喔！"; cColor = color(244, 67, 54); }

    fill(cColor);
    textSize(min(baseSize * 0.08, 48));
    text("答對題數: " + score + " / " + totalQuestions, width / 2, height * 0.4 + yOffset);
    
    fill(50);
    textSize(min(baseSize * 0.05, 32));
    text(comment, width / 2, height * 0.55 + yOffset);

    // 重新開始按鈕
    let btnW = min(width * 0.6, 300);
    let btnY = height < 500 ? height * 0.75 : height * 0.7;
    drawButton(width / 2 - btnW / 2, btnY, btnW, btnHeight, "重新測驗", color(33, 150, 243));
}

function drawButton(x, y, w, h, label, bgColor, textColor = color(255)) {
    push();
    fill(bgColor);
    stroke(200);
    strokeWeight(2);
    rect(x, y, w, h, min(w, h) * 0.15); // 動態圓角
    
    noStroke();
    fill(textColor);
    // 確保文字大小不會超出按鈕高度或寬度
    textSize(min(h * 0.4, w * 0.15, 24));
    text(label, x + w / 2, y + h / 2);
    pop();
}

// 產生一題新的題目
function generateQuestion() {
    selectedOptionIndex = -1; // 重置選項追蹤
    
    // 取得所有的英文字母 keys
    let letters = Object.keys(aviationDict);
    
    // 隨機挑選一個字母作為題目
    let targetLetter = random(letters);
    let wordData = aviationDict[targetLetter];

    // 陣列的第一個元素是正確答案 (ICAO代碼)
    let answer = wordData[0]; 
    let qText = "英文字母 '" + targetLetter + "' 的飛航代碼是？";

    currentQuestion = {
        q: qText,
        a: answer
    };

    // 取得該字母的混淆單字 (從陣列索引 1 開始的部分)
    let distractors = wordData.slice(1);
    
    // 將混淆選項打亂，並選取前 3 個
    shuffleArray(distractors);
    let wrongAnswers = distractors.slice(0, 3);

    // 將正確答案與 3 個錯誤答案合併並再次打亂順序
    let allAnswers = [answer, ...wrongAnswers];
    shuffleArray(allAnswers);

    // 將選項填入 UI 陣列
    for (let i = 0; i < 4; i++) {
        options[i].text = allAnswers[i];
    }
}

// 輔助函式：打亂陣列 (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = floor(random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 處理滑鼠/觸控點擊事件
function mousePressed() {
    if (currentState === STATE_START) {
        // 檢查是否點擊開始按鈕
        let btnW = min(width * 0.6, 300);
        let btnY = height > 500 ? height * 0.6 : height * 0.65;
        let btnX = width / 2 - btnW / 2;
        if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnHeight) {
            score = 0;
            questionNumber = 1;
            generateQuestion();
            currentState = STATE_QUESTION;
        }
    } else if (currentState === STATE_QUESTION) {
        // 檢查是否點擊了任何選項
        for (let i = 0; i < options.length; i++) {
            if (mouseX > options[i].x && mouseX < options[i].x + options[i].w &&
                mouseY > options[i].y && mouseY < options[i].y + options[i].h) {
                
                selectedOptionIndex = i; // 紀錄被點擊的按鈕
                
                // 判斷對錯
                if (options[i].text === currentQuestion.a) {
                    score++;
                    feedbackText = "答對了！ O";
                    feedbackColor = color(76, 175, 80); // 回饋文字綠色
                } else {
                    feedbackText = "答錯了 X";
                    feedbackColor = color(244, 67, 54); // 回饋文字紅色
                }
                
                currentState = STATE_FEEDBACK;
                break;
            }
        }
    } else if (currentState === STATE_FEEDBACK) {
        // 在回饋畫面點擊任意處進入下一題
        questionNumber++;
        if (questionNumber > totalQuestions) {
            currentState = STATE_END;
        } else {
            generateQuestion();
            currentState = STATE_QUESTION;
        }
    } else if (currentState === STATE_END) {
        // 檢查是否點擊重新開始按鈕
        let btnW = min(width * 0.6, 300);
        let btnY = height < 500 ? height * 0.75 : height * 0.7;
        let btnX = width / 2 - btnW / 2;
        if (mouseX > btnX && mouseX < btnX + btnW && mouseY > btnY && mouseY < btnY + btnHeight) {
            currentState = STATE_START;
        }
    }
    
    // 防止瀏覽器預設行為 (例如手機上點擊縮放)
    return false; 
}