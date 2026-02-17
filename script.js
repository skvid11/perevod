// Конфигурация API Яндекс.Переводчика
const API_KEY = 'AQVNzfBqKHaHlSd_kwpZXjeHQ2WWyMbXUh90i04y'; // Ваш ключ
const FOLDER_ID = 'b1gjtrge9r7p6f3lasu1'; // Ваш folder ID
const API_URL = 'https://translate.api.cloud.yandex.net/translate/v2/translate';

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
    outputDiv.innerHTML = ''; // Очищаем и результат
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
    
    sourceLangSelect.value = targetVal;
    targetLangSelect.value = sourceVal;
    
    // Меняем текст местами для удобства
    const inputVal = inputText.value;
    const outputVal = outputDiv.innerText;
    if (outputVal && inputVal) {
        inputText.value = outputVal;
        outputDiv.innerHTML = inputVal;
        charCountSpan.textContent = outputVal.length;
    } else if (outputVal) {
        inputText.value = outputVal;
        outputDiv.innerHTML = '';
        charCountSpan.textContent = outputVal.length;
    } else if (inputVal) {
        outputDiv.innerHTML = inputVal;
        inputText.value = '';
        charCountSpan.textContent = '0';
    }
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

    // Не переводим, если языки одинаковые
    if (sourceLang === targetLang) {
        outputDiv.innerHTML = text; // Просто показываем тот же текст
        showStatus('🌿 Языки совпадают (текст скопирован)', 'success');
        setTimeout(clearStatus, 1500);
        return;
    }

    showStatus('🔄 Перевод...', 'success');
    translateBtn.disabled = true; // Блокируем кнопку на время запроса

    try {
        const body = {
            sourceLanguageCode: sourceLang,
            targetLanguageCode: targetLang,
            texts: [text],
            folderId: FOLDER_ID, // Используем ваш folder ID
            format: 'PLAIN_TEXT'
        };

        console.log('Отправляем запрос:', body); // Для отладки

        const response = await fetch(API_URL, {
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
            throw new Error(responseData.message || `Ошибка API: ${response.status}`);
        }

        if (responseData.translations && responseData.translations.length > 0) {
            outputDiv.innerHTML = responseData.translations[0].text;
            showStatus('✅ Готово!', 'success');
            setTimeout(clearStatus, 1500);
        } else {
            throw new Error('Пустой ответ от API');
        }

    } catch (error) {
        console.error('Translation error:', error);
        showStatus(`❌ Ошибка: ${error.message}`, 'error');
        outputDiv.innerHTML = ''; // Очищаем при ошибке
    } finally {
        translateBtn.disabled = false; // Разблокируем кнопку
    }
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

// Опционально: перевод по Ctrl+Enter
inputText.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        translateText();
    }
});

// При загрузке показываем приветствие
window.addEventListener('load', () => {
    showStatus('🌱 Введите текст и нажмите "Перевести"', 'success');
    setTimeout(clearStatus, 3000);
});