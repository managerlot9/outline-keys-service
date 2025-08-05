export default function handler(request, response) {
    const csvData = process.env.OUTLINE_KEYS_CSV;
    if (!csvData) {
        return response.status(500).json({ error: 'Сервис не сконфигурирован. Список ключей пуст.' });
    }
    const allKeys = csvData.split(/\r?\n/);
    const validKeys = allKeys.filter(key => key.trim().startsWith('ss://') && !key.includes('Ошибка'));
    if (validKeys.length === 0) {
        return response.status(404).json({ error: 'Свободные ключи закончились. Попробуйте позже.' });
    }
    const randomIndex = Math.floor(Math.random() * validKeys.length);
    const randomKey = validKeys[randomIndex];
    response.status(200).json({ key: randomKey });
}
