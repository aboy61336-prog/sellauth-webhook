const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535662351901134858/DJXTQtB9234MNCShF9W1BLFBNjDS5G0qWSj1KvGv4pqwLlRwa1RxKKTeTuYUt29u8pUD';
const SELLAUTH_API_KEY = '6017718|HLsxPN5M40VgcYxmWp0ZQ2fXpFde9nqKfwyFmRE2b7877ced';

const processedInvoices = new Set();

app.get('/sellauth-webhook', (req, res) => {
    res.status(200).send('Server beží na Railway!');
});

app.post('/sellauth-webhook', async (req, res) => {
    try {
        const body = req.body;
        let invoiceId = body.data?.invoice_id || body.invoice_id || body.id;

        if (invoiceId) {
            invoiceId = String(invoiceId);
            if (processedInvoices.has(invoiceId)) {
                return res.status(200).send({ status: 'ignored' });
            }
            processedInvoices.add(invoiceId);
            setTimeout(() => processedInvoices.delete(invoiceId), 15 * 60 * 1000);
        }

        let productName = "Nivex Product";
        let quantity = 1;
        let total = 0;
        let currency = "EUR";
        let method = "Crypto";
        let completedAt = new Date();

        if (invoiceId) {
            try {
                const apiResponse = await axios.get(`https://api.sellauth.com/v1/shops/153065/invoices/${invoiceId}`, {
                    headers: { 'Authorization': `Bearer ${SELLAUTH_API_KEY}` }
                });
                
                const inv = apiResponse.data?.data || apiResponse.data;
                if (inv) {
                    productName = inv.items?.[0]?.product?.name || productName;
                    quantity = inv.items?.[0]?.quantity || 1;
                    total = inv.total || inv.price || 0;
                    currency = inv.currency || "EUR";
                    method = inv.payment_method?.name || inv.gateway || "Crypto";
                    if (inv.completed_at) completedAt = new Date(inv.completed_at);
                }
            } catch (err) {
                console.error('Chyba API Sellauth:', err.message);
            }
        }

        const discordPayload = {
            embeds: [{
                title: "<:replace_nivex:1520076083028955165> ORDER COMPLETED",
                color: 0x0078ff,
                description: `> [<:nivex_cmd:1535686335787180124> **${productName}**](https://nivexshop.xyz/)\n\n` +
                             `───────────────────────────────\n` +
                             `• <:nivex_file:1535685174250184704> **Quantity:** ${quantity}\n` +
                             `• <:nivex_calculator:1535687673824546826> **Total Price:** ${total} ${currency}\n` +
                             `• <:nivex_method:1535688050712121384> **Method:** ${method}`,
                timestamp: new Date().toISOString(),
                footer: { text: `Completed: ${completedAt.toLocaleString()}` }
            }]
        };

        axios.post(DISCORD_WEBHOOK_URL, discordPayload, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }).catch(err => {
            if (err.response?.status === 429) {
                console.error("Discord odmietol správu kvôli Rate Limitu (429).");
            } else {
                console.error("Iná chyba pri odosielaní na Discord:", err.message);
            }
        });

        res.status(200).send({ status: 'success' });
    } catch (error) {
        res.status(500).send({ error: 'Server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server beží na porte ${PORT}`));
