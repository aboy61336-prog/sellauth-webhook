const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535656610733494292/7Od5Z7hU7pJYHzfBqjcISKex1AQ9arAjyI8_HgEDKh4rT0JGOmqnvVMBG98rbvj-PvxM';

app.post('/sellauth-webhook', async (req, res) => {
    try {
        const body = req.body;
        const order = body.data || body;

        const discordPayload = {
            embeds: [{
                title: "🛍️ ORDER COMPLETED",
                color: 0x9b59b6,
                description: `> **${order.product_name || "Neznámy produkt"}**`,
                fields: [
                    { name: "📁 Quantity", value: String(order.quantity || 1), inline: true },
                    { name: "💳 Total Price", value: `${order.total || 0} ${order.currency || 'EUR'}`, inline: true },
                    { name: "💰 Method", value: order.gateway || "Neznáma", inline: true }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: "Dragon Market Auto-System"
                }
            }]
        };

        await axios.post(DISCORD_WEBHOOK_URL, discordPayload);
        res.status(200).send({ status: 'success' });
    } catch (error) {
        console.error('Chyba pri spracovaní webhooku:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server beží na porte ${PORT}`);
});
