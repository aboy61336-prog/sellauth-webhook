const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1535662351901134858/DJXTQtB9234MNCShF9W1BLFBNjDS5G0qWSj1KvGv4pqwLlRwa1RxKKTeTuYUt29u8pUD';
const SELLAUTH_API_KEY = '6017718|HLsxPN5M40VgcYxmWp0ZQ2fXpFde9nqKfwyFmRE2b7877ced';

// Pamäť na zabránenie duplicitných správ (zapamätá si spracované ID na 15 minút)
const processedInvoices = new Set();

app.get('/sellauth-webhook', (req, res) => {
    res.status(200).send('Server beží a čaka na Sellauth webhooky!');
});

// Bezpečná funkcja na odoslanie na Discord s ochranom proti 429 (Rate Limit)
async function sendToDiscordWithRetry(payload, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await axios.post(DISCORD_WEBHOOK_URL, payload);
            return;
        } catch (error) {
            const status = error.response?.status;
            const retryAfter = error.response?.data?.retry_after || 10;

            if (status === 429) {
                console.warn(`[Rate Limit] Discord hlási 429. Čakáme ${retryAfter} sekúnd (pokus ${i + 1}/${retries})...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Nepodarilo sa odoslať na Discord kvôli preťaženiu (Rate Limit).');
}

app.post('/sellauth-webhook', async (req, res) => {
    console.log("PRIjatý WEBHOOK:", JSON.stringify(req.body, null, 2));

    try {
        const body = req.body;
        
        // Zisťovanie ID faktúry z rôznych štruktúr, ktoré Sellauth môže poslať
        let invoiceId = body.data?.invoice_id || body.invoice_id || body.data?.id || body.id;

        if (invoiceId) {
            // Prevod na reťazec kvôli istote porovnávania
            invoiceId = String(invoiceId);

            if (processedInvoices.has(invoiceId)) {
                console.log(`Duplicitný webhook pre faktúru #${invoiceId} bol úspešne ignorovaný.`);
                return res.status(200).send({ status: 'ignored_duplicate' });
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
                // Skúsime stiahnuť dáta z API Sellauth
                const apiResponse = await axios.get(`https://api.sellauth.com/v1/shops/153065/invoices/${invoiceId}`, {
                    headers: { 'Authorization': `Bearer ${SELLAUTH_API_KEY}` }
                });
                
                const inv = apiResponse.data?.data || apiResponse.data;
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
                        method = inv.gateway || inv.payment_gateway || "Crypto";
                    }

                    if (inv.completed_at || inv.updated_at) {
                        completedAt = new Date(inv.completed_at || inv.updated_at);
                    }
                }
            } catch (apiErr) {
                console.error('Chyba pri sťahovaní dát z Sellauth API:', apiErr.response?.data || apiErr.message);
            }
        }

        const formattedDate = completedAt.toLocaleString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric', 
            hour: 'numeric', 
            minute: 'numeric', 
            hour12: true 
        });

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
                footer: {
                    text: `Completed: ${formattedDate}`
                }
            }]
        };

        // Odoslanie na Discord s ochranou
        await sendToDiscordWithRetry(discordPayload);
        res.status(200).send({ status: 'success' });

    } catch (error) {
        console.error('Kritická chyba v serveri:', error.message || error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server beží na porte ${PORT}`);
});
