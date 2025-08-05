document.addEventListener('DOMContentLoaded', () => {
    const getKeyButton = document.getElementById('getKeyButton');
    const resultCard = document.getElementById('resultCard');
    const qrCodeContainer = document.getElementById('qrCode');
    const accessKeyTextarea = document.getElementById('accessKey');
    const copyButton = document.getElementById('copyButton');
    let qrCodeInstance = null;

    const copyKey = () => {
        if (!accessKeyTextarea.value) return;
        accessKeyTextarea.select();
        navigator.clipboard.writeText(accessKeyTextarea.value);
        copyButton.textContent = 'Скопировано!';
        setTimeout(() => { copyButton.textContent = 'Копировать'; }, 2000);
    };

    getKeyButton.addEventListener('click', async () => {
        getKeyButton.disabled = true;
        getKeyButton.textContent = 'Ищем ключ...';
        resultCard.classList.add('hidden');
        try {
            const response = await fetch('/api/getKey');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Не удалось получить ключ.');
            }
            const data = await response.json();
            const key = data.key;
            accessKeyTextarea.value = key;
            resultCard.classList.remove('hidden');
            qrCodeContainer.innerHTML = '';
            new QRCode(qrCodeContainer, {
                text: key, width: 128, height: 128,
                colorDark: "#000000", colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        } finally {
            getKeyButton.disabled = false;
            getKeyButton.textContent = 'Получить другой ключ';
        }
    });
    copyButton.addEventListener('click', copyKey);
    accessKeyTextarea.addEventListener('click', copyKey);
});
