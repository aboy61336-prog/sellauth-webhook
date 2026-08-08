const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535662351901134858/DJXTQtB9234MNCShF9W1BLFBNjDS5G0qWSj1KvGv4pqwLlRwa1RxKKTeTuYUt29u8pUD';
const SELLAUTH_API_KEY = '6017718|HLsxPN5M40VgcYxmWp0ZQ2fXpFde9nqKfwyFmRE2b7877ced';

app.post('/sellauth-webhook', async (req, res) => {
    try {
        const body = req.body;
        let invoiceId = body.data?.invoice_id || body.invoice_id;

        let productName = "Nivex Product";
        let quantity = 1;
        let total = 0;
        let currency = "EUR";
        let method = "Crypto";

        if (invoiceId) {
            try {
                const apiResponse = await axios.get(`https://api.sellauth.com/v1/shops/153065/invoices/${invoiceId}`, {
                    headers: { 'Authorization': `Bearer ${SELLAUTH_API_KEY}` }
                });
                
                const inv = apiResponse.data;
                if (inv) {
                    if (inv.items && inv.items.length > 0) {
                        productName = inv.items[0].product?.name || inv.items[0].product_name || productName;
                        quantity = inv.items[0].quantity || 1;
                    }
                    total = inv.total || inv.price || 0;
                    currency = inv.currency || "EUR";
                    
                    if (inv.payment_method && inv.payment_method.name) {
                        method = inv.payment_method.name;
                    } else {
                        method = inv.gateway || "Crypto";
                    }
                }
            } catch (apiErr) {
                console.error('Chyba pri sťahovaní dát z API:', apiErr.message);
            }
        }

        const discordPayload = {
            embeds: [{
                title: "<:replace_nivex:1520076083028955165> NIVEX - ORDER COMPLETED",
                color: 0x2B6CB0, // Profesionálna modrá farba
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
