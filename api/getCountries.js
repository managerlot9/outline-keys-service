// api/getCountries.js
export default function handler(request, response) {
    const csvData = process.env.OUTLINE_KEYS_CSV;
    if (!csvData) {
        return response.status(500).json([]);
    }

    const lines = csvData.split(/\r?\n/);
    const countries = new Set(); // Используем Set для автоматической уникализации

    lines.forEach(line => {
        if (!line.startsWith('ss://')) return;

        const infoPart = line.split('#')[1] || '';
        try {
            const decodedInfo = decodeURIComponent(infoPart);
            const parts = decodedInfo.split(',');
            
            // Проверяем, достаточно ли частей в строке
            if (parts.length >= 3) {
                // Страна - это третий элемент с конца
                const countryName = parts[parts.length - 3].trim();
                // Добавляем, только если это не пустое значение и похоже на название
                if (countryName && isNaN(countryName)) {
                    countries.add(countryName);
                }
            }
        } catch (e) {
            console.error("Failed to decode or parse line:", line, e);
        }
    });

    response.status(200).json(Array.from(countries).sort());
}
