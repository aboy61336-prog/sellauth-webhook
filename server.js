const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535662351901134858/DJXTQtB9234MNCShF9W1BLFBNjDS5G0qWSj1KvGv4pqwLlRwa1RxKKTeTuYUt29u8pUD';

app.post('/sellauth-webhook', async (req, res) => {
    try {
        const data = req.body;
        
        // Získanie údajov (prispôsobené pre Sellauth štruktúru)
        const product = data.product || data.product_name || "Neznámy produkt";
        const quantity = data.quantity || 1;
        const total = data.total || data.price || 0;
        const currency = data.currency || "EUR";
        const method = data.gateway || data.method || "Neznáma";

        const discordPayload = {
            embeds: [{
                title: "🛍️ NIVEX - ORDER COMPLETED",
                color: 0x9b59b6,
                description: `**Produkt:** ${product}`,
                fields: [
                    { name: "📁 Quantity", value: String(quantity), inline: true },
                    { name: "💳 Total Price", value: `${total} ${currency} <a:nivex_money:1535661828183564298>`, inline: true },
                    { name: "💰 Method", value: `${method} <:nivex_shield:1522572883279482951>`, inline: true }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: "NIVEX Auto-System"
                }
            }]
        };

        await axios.post(DISCORD_WEBHOOK_URL, discordPayload);
        res.status(200).send({ status: 'success' });
    } catch (error) {
        console.error('Chyba:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server beží na porte ${PORT}`);
});
