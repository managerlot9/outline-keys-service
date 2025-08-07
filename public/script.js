document.addEventListener('DOMContentLoaded', () => {
    // --- Элементы DOM ---
    const getKeyButton = document.getElementById('getKeyButton');
    const resultCard = document.getElementById('resultCard');
    const qrCodeContainer = document.getElementById('qrCode');
    const accessKeyTextarea = document.getElementById('accessKey');
    const copyButton = document.getElementById('copyButton');
    const langSwitcher = document.getElementById('langSwitcher');
    const countryFilter = document.getElementById('countryFilter');
    const shareButton = document.getElementById('shareButton');
    const keyInfo = document.getElementById('keyInfo');
    
    let currentLang = 'en';

    // --- Функция перевода ---
    const translatePage = (lang) => {
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
        document.documentElement.lang = lang;
    };

    // --- Установка языка ---
    const setLanguage = () => {
        const savedLang = localStorage.getItem('language');
        currentLang = (savedLang && translations[savedLang]) ? savedLang : 'en';
        langSwitcher.value = currentLang;
        translatePage(currentLang);
    };

    // --- Копирование ---
    const copyKey = () => {
        if (!accessKeyTextarea.value) return;
        navigator.clipboard.writeText(accessKeyTextarea.value);
        copyButton.textContent = translations[currentLang].copyButtonSuccess;
        setTimeout(() => {
            copyButton.textContent = translations[currentLang].copyButton;
        }, 2000);
    };

    // --- Кнопка "Поделиться" ---
    shareButton.addEventListener('click', () => {
        const shareData = {
            title: translations[currentLang].headerTitle,
            text: translations[currentLang].shareMessage + window.location.href,
        };
        try {
            if (navigator.share) {
                navigator.share(shareData);
            } else { // Fallback для десктопов
                navigator.clipboard.writeText(shareData.text);
                alert("Link copied to clipboard!");
            }
        } catch (err) {
            console.error("Share error:", err);
        }
    });
    
    // --- Получение ключа ---
    getKeyButton.addEventListener('click', async () => {
        getKeyButton.disabled = true;
        getKeyButton.textContent = translations[currentLang].getKeyButtonLoading;
        resultCard.classList.add('hidden');
        keyInfo.innerHTML = '';
        
        const selectedCountry = countryFilter.value;
        const url = selectedCountry === 'all' ? '/api/getKey' : `/api/getKey?country=${selectedCountry}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(translations[currentLang].errorNoKeys);
            }
            
            const data = await response.json();
            const key = data.key;

            accessKeyTextarea.value = key;

            qrCodeContainer.innerHTML = '';
            try {
                const typeNumber = 0; 
                const errorCorrectionLevel = 'L';
                const qr = qrcode(typeNumber, errorCorrectionLevel);
                qr.addData(key);
                qr.make();
                qrCodeContainer.innerHTML = qr.createImgTag(4, 8);
            } catch (e) {
                console.error("QR Code generation failed:", e);
                qrCodeContainer.innerHTML = 'QR generation failed: Key too long';
            }

            const info = parseKeyInfo(key);
            keyInfo.innerHTML = `<div><strong>${translations[currentLang].keyInfoCountry}:</strong> ${info.country}</div>
                               <div><strong>${translations[currentLang].keyInfoSpeed}:</strong> ${info.speed}</div>`;
            
            resultCard.classList.remove('hidden');

        } catch (error) {
            alert(`${translations[currentLang].errorAlert}: ${error.message}`);
        } finally {
            getKeyButton.disabled = false;
            getKeyButton.textContent = translations[currentLang].getKeyButtonAnother;
        }
    });
    
    // --- Загрузка стран ---
    const populateCountries = async () => {
        try {
            const response = await fetch('/api/getCountries');
            if (!response.ok) throw new Error('Failed to load country list');
            const countries = await response.json();
            
            countryFilter.innerHTML = `<option value="all" data-translate-key="countryAll">${translations[currentLang].countryAll}</option>`;
            
            countries.forEach(countryName => {
                const option = document.createElement('option');
                option.value = countryName;
                option.textContent = countryName;
                countryFilter.appendChild(option);
            });
        } catch (error) {
            console.error("Could not fetch countries:", error);
        }
    };
    
    // --- Парсинг информации из ключа (ИСПРАВЛЕННАЯ ВЕРСИЯ) ---
    const parseKeyInfo = (key) => {
        const infoPart = key.split('#')[1] || '';
        let country = 'N/A';
        let speed = 'N/A';

        try {
            const decodedInfo = decodeURIComponent(infoPart);
            
            const speedMatch = decodedInfo.match(/(\d+\.\d+)/);
            if (speedMatch) {
                speed = `${speedMatch[1]} ms`;
            }

            const parts = decodedInfo.split(',');
            if (parts.length >= 3) {
                const countryName = parts[parts.length - 3].trim();
                if (countryName && isNaN(countryName)) {
                    country = countryName;
                }
            }
        } catch (e) {
            console.error("Could not parse key info:", e);
        }
        
        return { country, speed };
    };

    // --- Инициализация ---
    langSwitcher.addEventListener('change', () => {
        currentLang = langSwitcher.value;
        localStorage.setItem('language', currentLang);
        translatePage(currentLang);
        // Перезагружаем страны, чтобы перевести "Any Country"
        populateCountries();
    });
    
    copyButton.addEventListener('click', copyKey);
    accessKeyTextarea.addEventListener('click', copyKey);
    
    setLanguage();
    populateCountries();
});
