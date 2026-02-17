// Конфигурация API Яндекс.Переводчика
const API_KEY = 'AQVNzfBqKHaHlSd_kwpZXjeHQ2WWyMbXUh90i04y';
const FOLDER_ID = 'b1gjtrge9r7p6f3lasu1';

// Пробуем разные варианты URL для обхода CORS
const API_URLS = [
    'https://cors-anywhere.herokuapp.com/https://translate.api.cloud.yandex.net/translate/v2/translate',
    'https://translate.api.cloud.yandex.net/translate/v2/translate'
];

// DOM элементы
const sourceLangSelect = document.getElementById('source-lang');
const targetLangSelect = document.getElementById('target-lang');
const inputText = document.getElementById('input-text');
const outputDiv = document.getElementById('output-text');
const translateBtn = document.getElementById('translate-btn');
const swapBtn = document.getElementById('swap-langs');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const charCountSpan = document.getElementById('input-char-count');
const statusDiv = document.getElementById('status-message');

// Обновление счетчика символов
inputText.addEventListener('input', () => {
    const len = inputText.value.length;
    charCountSpan.textContent = len;
});

// Очистка поля ввода
clearBtn.addEventListener('click', () => {
    inputText.value = '';
    charCountSpan.textContent = '0';
    inputText.focus();
    outputDiv.innerHTML = '';
    clearStatus();
});

// Копирование результата
copyBtn.addEventListener('click', async () => {
    const textToCopy = outputDiv.innerText;
    if (!textToCopy) {
        showStatus('Нечего копировать', 'error');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(textToCopy);
        showStatus('✅ Скопировано!', 'success');
        setTimeout(clearStatus, 1500);
    } catch (err) {
        showStatus('❌ Ошибка копирования', 'error');
    }
});

// Смена языков местами
swapBtn.addEventListener('click', () => {
    const sourceVal = sourceLangSelect.value;
    const targetVal = targetLangSelect.value;
    
    // Меняем языки
    sourceLangSelect.value = targetVal;
    targetLangSelect.value = sourceVal;
    
    // Меняем текст местами
    const inputVal = inputText.value;
    const outputVal = outputDiv.innerText;
    
    if (inputVal && outputVal) {
        // Если есть и ввод, и вывод - меняем их
        inputText.value = outputVal;
        outputDiv.innerHTML = inputVal;
    } else if (outputVal) {
        // Если есть только вывод
        inputText.value = outputVal;
        outputDiv.innerHTML = '';
    } else if (inputVal) {
        // Если есть только ввод
        outputDiv.innerHTML = inputVal;
        inputText.value = '';
    }
    
    charCountSpan.textContent = inputText.value.length;
});

// Основная функция перевода
async function translateText() {
    const text = inputText.value.trim();
    
    if (!text) {
        showStatus('✏️ Введите текст для перевода', 'error');
        return;
    }

    const sourceLang = sourceLangSelect.value;
    const targetLang = targetLangSelect.value;

    // Если языки одинаковые - просто копируем текст
    if (sourceLang === targetLang) {
        outputDiv.innerHTML = text;
        showStatus('🌿 Языки совпадают (текст скопирован)', 'success');
        setTimeout(clearStatus, 1500);
        return;
    }

    showStatus('🔄 Перевод...', 'success');
    translateBtn.disabled = true;

    // Пробуем каждый URL по очереди
    for (let i = 0; i < API_URLS.length; i++) {
        try {
            const body = {
                sourceLanguageCode: sourceLang,
                targetLanguageCode: targetLang,
                texts: [text],
                folderId: FOLDER_ID,
                format: 'PLAIN_TEXT'
            };

            console.log(`Попытка ${i + 1}:`, API_URLS[i]);

            const response = await fetch(API_URLS[i], {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Api-Key ${API_KEY}`
                },
                body: JSON.stringify(body)
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('Ошибка API:', responseData);
                throw new Error(responseData.message || `Ошибка ${response.status}`);
            }

            if (responseData.translations && responseData.translations.length > 0) {
                outputDiv.innerHTML = responseData.translations[0].text;
                showStatus('✅ Готово!', 'success');
                setTimeout(clearStatus, 1500);
                translateBtn.disabled = false;
                return;
            }

        } catch (error) {
            console.log(`URL ${i + 1} не сработал:`, error.message);
            
            // Если это последняя попытка и все URL не сработали
            if (i === API_URLS.length - 1) {
                let errorMessage = '❌ Ошибка перевода. ';
                
                if (error.message.includes('Failed to fetch')) {
                    errorMessage += 'Проблема с соединением. Попробуйте:\n' +
                        '1️⃣ Открыть https://cors-anywhere.herokuapp.com и нажать кнопку\n' +
                        '2️⃣ Запустить локальный сервер (Live Server в VS Code)\n' +
                        '3️⃣ Проверить интернет-соединение';
                } else {
                    errorMessage += error.message;
                }
                
                showStatus(errorMessage, 'error');
                outputDiv.innerHTML = '';
            }
            
            // Продолжаем со следующим URL
            continue;
        }
    }
    
    translateBtn.disabled = false;
}

// Вспомогательные функции для статуса
function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
}

function clearStatus() {
    statusDiv.textContent = '';
    statusDiv.className = 'status-message';
}

// Обработчик кнопки перевода
translateBtn.addEventListener('click', translateText);

// Перевод по Ctrl+Enter
inputText.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        translateText();
    }
});

// Проверка при загрузке страницы
window.addEventListener('load', () => {
    // Проверяем, открыт ли файл локально
    if (window.location.protocol === 'file:') {
        showStatus('⚠️ Файл открыт локально. Для работы переводчика:\n' +
                  '1. Установите Live Server в VS Code\n' +
                  '2. Или запустите: python -m http.server 8000\n' +
                  '3. Или откройте https://cors-anywhere.herokuapp.com', 'error');
    } else {
        showStatus('🌱 Введите текст и нажмите "Перевести"', 'success');
        setTimeout(clearStatus, 3000);
    }
});
