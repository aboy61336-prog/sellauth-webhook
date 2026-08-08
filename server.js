const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535662351901134858/DJXTQtB9234MNCShF9W1BLFBNjDS5G0qWSj1KvGv4pqwLlRwa1RxKKTeTuYUt29u8pUD';
// Sem si môžeš neskôr pridať svoj Sellauth API kľúč, ak ho bude treba pre API endpoint
const SELLAUTH_API_KEY = process.env.SELLAUTH_API_KEY || '';

app.post('/sellauth-webhook', async (req, res) => {
    try {
        console.log("PRIJETÉ DÁTA ZO SELLAUTH:", JSON.stringify(req.body, null, 2));

        const body = req.body;
        let invoiceId = body.data?.invoice_id || body.invoice_id;

        let productName = "Nivex Product";
        let quantity = 1;
        let total = 0;
        let currency = "EUR";

        // Ak máme invoice_id, môžeme teoreticky dáta stiahnuť, ale ak Sellauth nepošle detaily, skúsime prečítať z tela ak sú tam priložené
        if (body.data && body.data.product_name) {
            productName = body.data.product_name;
            quantity = body.data.quantity || 1;
            total = body.data.total || body.data.price || 0;
            currency = body.data.currency || "EUR";
        } else if (body.product_name) {
            productName = body.product_name;
            quantity = body.quantity || 1;
            total = body.total || body.price || 0;
            currency = body.currency || "EUR";
        }

        const discordPayload = {
            embeds: [{
                title: "<:replace_nivex:1520076083028955165> NIVEX - ORDER COMPLETED",
                color: 0x9b59b6,
                description: `**Product:** ${productName}`,
                fields: [
                    { name: "📁 Quantity", value: String(quantity), inline: true },
                    { name: "Total Price", value: `${total} ${currency} <a:nivex_money:1535661828183564298>`, inline: true },
                    { name: "Method", value: `Crypto <:nivex_shield:1522572883279482951>`, inline: true }
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
