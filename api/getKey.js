// api/getKey.js
export default function handler(request, response) {
    const csvData = process.env.OUTLINE_KEYS_CSV;
    const { searchParams } = new URL(request.url, `https://${request.headers.host}`);
    const country = searchParams.get('country');

    if (!csvData) {
        return response.status(500).json({ error: 'Service is not configured. Key list is empty.' });
    }

    let allKeys = csvData.split(/\r?\n/).filter(key => key.startsWith('ss://') && !key.includes('Ошибка'));
    
    let filteredKeys = allKeys;
    if (country && country !== 'all') {
        // Фильтруем по полному названию страны. "includes" найдет "Germany" в строке.
        filteredKeys = allKeys.filter(key => {
            const infoPart = key.split('#')[1] || '';
            try {
                return decodeURIComponent(infoPart).includes(country);
            } catch {
                return false;
            }
        });
    }
    
    if (filteredKeys.length === 0) {
        return response.status(404).json({ error: 'No keys found for this selection' });
    }

    const randomIndex = Math.floor(Math.random() * filteredKeys.length);
    const randomKey = filteredKeys[randomIndex];

    response.status(200).json({ key: randomKey });
}
