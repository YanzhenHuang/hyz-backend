import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

dotenv.config()

const app = express();
app.use(express.json());
const port = 3000;


app.get('/', (req: Request, res: Response) => {
    res.send("Test!!!");
});

app.post('/chat', async (req: Request, res: Response) => {
    const { query } = req.body;

    const dify_url = 'https://api.dify.ai/v1/chat-messages';
    const dify_api_key = process.env.DIFY_API_KEY;

    // May not use proxy
    const proxyUrl = process.env.SYSTEM_PROXY;
    const agent = new HttpsProxyAgent(proxyUrl || '');

    if (!dify_api_key) {
        return res.status(500).json({ error: 'DIFY_API_KEY not set' });
    }

    Object.entries({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    }).forEach(([header, value]) => {
        res.setHeader(header, value);
    });

    try {
        const res_dify = await fetch(dify_url, {
            agent: agent,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${dify_api_key}`,
                'Content-Type': 'application/json',
                'User-Agent': 'curl/8.0.0',
                'Connection': 'close'
            },
            body: JSON.stringify({
                inputs: {},
                query: query,
                response_mode: 'streaming',
                conversation_id: '',
                user: 'abc-123',
            })
        });

        const stream = res_dify.body;
        if (!stream) {
            return res.status(500).json({ error: 'Empty response stream.' });
        }

        // Use Node.js stream event handling instead of getReader()
        stream.on('data', (chunk) => {
            res.write(chunk);
        });

        stream.on('end', () => {
            res.end();
        });

        stream.on('error', (err) => {
            console.error('Stream error:', err);
            res.end(); // Gracefully end to avoid hanging
        });

    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Failed to connect to Dify!', details: e instanceof Error ? e.message : e })
    }

});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});