document.addEventListener('DOMContentLoaded', () => {
    // --- Элементы DOM ---
    const getKeyButton = document.getElementById('getKeyButton');
    const resultCard = document.getElementById('resultCard');
    const qrCodeContainer = document.getElementById('qrCode');
    const accessKeyTextarea = document.getElementById('accessKey');
    const copyButton = document.getElementById('copyButton');
    const langSwitcher = document.getElementById('langSwitcher');

    let currentLang = 'en'; // Язык по умолчанию

    // --- Функция перевода страницы ---
    const translatePage = (lang) => {
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
        document.documentElement.lang = lang; // Обновляем атрибут lang у html
    };

    // --- Определение и установка языка ---
    const setLanguage = () => {
        const savedLang = localStorage.getItem('language');
        const browserLang = navigator.language.split('-')[0];

        if (savedLang && translations[savedLang]) {
            currentLang = savedLang;
        } else if (translations[browserLang]) {
            currentLang = browserLang;
        } else {
            currentLang = 'en';
        }

        langSwitcher.value = currentLang;
        translatePage(currentLang);
    };

    // --- Обработчики событий ---
    langSwitcher.addEventListener('change', () => {
        currentLang = langSwitcher.value;
        localStorage.setItem('language', currentLang);
        translatePage(currentLang);
    });
    
    const copyKey = () => {
        if (!accessKeyTextarea.value) return;
        navigator.clipboard.writeText(accessKeyTextarea.value);
        copyButton.textContent = translations[currentLang].copyButtonSuccess;
        setTimeout(() => {
            copyButton.textContent = translations[currentLang].copyButton;
        }, 2000);
    };
    
    copyButton.addEventListener('click', copyKey);
    accessKeyTextarea.addEventListener('click', copyKey);

    getKeyButton.addEventListener('click', async () => {
        getKeyButton.disabled = true;
        getKeyButton.textContent = translations[currentLang].getKeyButtonLoading;
        resultCard.classList.add('hidden');

        try {
            const response = await fetch('/api/getKey');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || translations[currentLang].errorFetch);
            }
            
            const data = await response.json();
            const key = data.key;

            accessKeyTextarea.value = key;
            resultCard.classList.remove('hidden');

            qrCodeContainer.innerHTML = '';
            new QRCode(qrCodeContainer, {
                text: key,
                width: 128,
                height: 128,
            });

        } catch (error) {
            alert(`${translations[currentLang].errorAlert}: ${error.message}`);
        } finally {
            getKeyButton.disabled = false;
            // После получения ключа текст кнопки меняется, поэтому обновляем его
            getKeyButton.textContent = translations[currentLang].getKeyButtonAnother;
        }
    });

    // --- Первичный запуск ---
    setLanguage();
});
