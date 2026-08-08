const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535662351901134858/DJXTQtB9234MNCShF9W1BLFBNjDS5G0qWSj1KvGv4pqwLlRwa1RxKKTeTuYUt29u8pUD';

app.post('/sellauth-webhook', async (req, res) => {
    try {
        console.log("PRIJETÉ DÁTA ZO SELLAUTH:", JSON.stringify(req.body, null, 2));

        const body = req.body;
        // Skúsime prebehnúť všetky možné vnorenia, ktoré Sellauth používateľom posiela
        const payload = body.order || body.invoice || body.data || body.resource || body;

        let productName = payload.product_name || payload.name || payload.title || payload.item_name || "Unknown Product";
        if (payload.products && payload.products.length > 0) {
            productName = payload.products[0].name || payload.products[0].product_name || productName;
        }

        const quantity = payload.quantity || payload.amount_items || 1;
        const total = payload.total || payload.price || payload.amount || payload.total_price || 0;
        const currency = payload.currency || "EUR";
        const method = payload.gateway || payload.payment_method || payload.method || payload.processor || "Unknown";

        const discordPayload = {
            embeds: [{
                title: "<:replace_nivex:1520076083028955165> NIVEX - ORDER COMPLETED",
                color: 0x9b59b6,
                description: `**Product:** ${productName}`,
                fields: [
                    { name: "📁 Quantity", value: String(quantity), inline: true },
                    { name: "Total Price", value: `${total} ${currency} <a:nivex_money:1535661828183564298>`, inline: true },
                    { name: "Method", value: `${method} <:nivex_shield:1522572883279482951>`, inline: true }
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
