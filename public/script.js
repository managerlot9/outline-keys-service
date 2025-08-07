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
    let lastRawKey = ''; // Сохраняем последний "грязный" ключ для QR-кода

    // --- Логика перевода ---
    const translatePage = (lang) => {
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            if (translations[lang] && translations[lang][key]) { el.textContent = translations[lang][key]; }
        });
        document.documentElement.lang = lang;
    };
    const setLanguage = () => {
        const savedLang = localStorage.getItem('language') || 'en';
        currentLang = translations[savedLang] ? savedLang : 'en';
        langSwitcher.value = currentLang;
        translatePage(currentLang);
    };

    // --- Логика парсинга и очистки ключа ---
    const parseKeyInfo = (rawKey) => {
        const infoPart = rawKey.split('#')[1] || '';
        let country = 'N/A', speed = 'N/A';
        try {
            const decodedInfo = decodeURIComponent(infoPart);
            const speedMatch = decodedInfo.match(/(\d+\.\d+)/);
            if (speedMatch) { speed = `${speedMatch[1]} ms`; }
            const parts = decodedInfo.split(',');
            if (parts.length >= 3) {
                const countryName = parts[parts.length - 3].trim();
                if (countryName && isNaN(countryName)) { country = countryName; }
            }
        } catch (e) { console.error("Could not parse key info:", e); }
        return { country, speed };
    };
    const createCleanKey = (rawKey, info) => {
        const keyBase = rawKey.split('#')[0];
        const newLabel = `${info.country}` + (info.speed !== 'N/A' ? ` (${info.speed})` : '');
        return `${keyBase}#${encodeURIComponent(newLabel)}`;
    };

    // --- Основные действия ---
    const copyKey = () => {
        if (!accessKeyTextarea.value) return;
        navigator.clipboard.writeText(accessKeyTextarea.value);
        copyButton.textContent = translations[currentLang].copyButtonSuccess;
        setTimeout(() => { copyButton.textContent = translations[currentLang].copyButton; }, 2000);
    };

    shareButton.addEventListener('click', () => {
        const keyToShare = accessKeyTextarea.value;
        if (!keyToShare) return;
        const shareData = {
            title: `Outline VPN Key (${parseKeyInfo(lastRawKey).country})`,
            text: keyToShare
        };
        try {
            if (navigator.share) { navigator.share(shareData); } 
            else { copyKey(); alert('Key copied to clipboard!'); }
        } catch (err) { console.error("Share error:", err); }
    });

    getKeyButton.addEventListener('click', async () => {
        getKeyButton.disabled = true;
        getKeyButton.textContent = translations[currentLang].getKeyButtonLoading;
        resultCard.classList.add('hidden');
        keyInfo.innerHTML = '';
        
        const selectedCountry = countryFilter.value;
        const url = selectedCountry === 'all' ? '/api/getKey' : `/api/getKey?country=${encodeURIComponent(selectedCountry)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) { throw new Error(translations[currentLang].errorNoKeys); }
            
            const data = await response.json();
            lastRawKey = data.key; // Сохраняем "грязный" ключ

            const info = parseKeyInfo(lastRawKey);
            const cleanKey = createCleanKey(lastRawKey, info);
            accessKeyTextarea.value = cleanKey; // Вставляем "чистый" ключ

            qrCodeContainer.innerHTML = '';
            try {
                const typeNumber = 0; 
                const errorCorrectionLevel = 'L';
                const qr = qrcode(typeNumber, errorCorrectionLevel);
                qr.addData(lastRawKey); // QR-код генерируем из "грязного" ключа!
                qr.make();
                qrCodeContainer.innerHTML = qr.createImgTag(4, 8);
            } catch (e) {
                console.error("QR Code generation failed:", e);
                qrCodeContainer.innerHTML = 'QR generation failed: Key too long';
            }

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
            
            countryFilter.innerHTML = `<option value="all" data-translate-key="countryAll"></option>`;
            countries.forEach(countryName => {
                const option = document.createElement('option');
                option.value = countryName;
                option.textContent = countryName;
                countryFilter.appendChild(option);
            });
            translatePage(currentLang); // Применяем перевод после добавления
        } catch (error) { console.error("Could not fetch countries:", error); }
    };

    // --- Инициализация ---
    langSwitcher.addEventListener('change', () => {
        currentLang = langSwitcher.value;
        localStorage.setItem('language', currentLang);
        translatePage(currentLang);
    });
    copyButton.addEventListener('click', copyKey);
    accessKeyTextarea.addEventListener('click', copyKey);
    setLanguage();
    populateCountries();
});