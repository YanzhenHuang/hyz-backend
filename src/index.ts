import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import cors from 'cors';

dotenv.config()

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

/**
 * Root api. Reserved for major use.
 */
app.get('/', (req: Request, res: Response) => {
    res.send("Test!!!");
});

/**
 * GLaDoS API. Test if the server is alive.
 */
app.get('/are-you-still-there', (req: Request, res: Response) => {
    res.send('still-alive');
});

/**
 * Chat API. Send query and context, forward stream to frontend.
 */
app.post('/chat', async (req: Request, res: Response) => {
    const { query, conversation_id } = req.body;

    const dify_url = 'https://api.dify.ai/v1/chat-messages';
    const dify_api_key = process.env.DIFY_API_KEY;

    if (!dify_api_key) {
        return res.status(500).json({ error: 'DIFY_API_KEY not set' });
    }

    let requestConfig: any = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${dify_api_key}`,
            'Content-Type': 'application/json',
            'User-Agent': 'curl/8.0.0',
            'Connection': 'close'
        },
        body: JSON.stringify({
            inputs: {},
            query,
            response_mode: 'streaming',
            conversation_id,
            user: 'abc-123',
        })
    };

    // May or may not use proxy
    const proxyUrl = process.env.SYSTEM_PROXY;
    if (proxyUrl) {
        const agent = new HttpsProxyAgent(proxyUrl);
        requestConfig = { agent, ...requestConfig };
    }

    Object.entries({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    }).forEach(([header, value]) => {
        res.setHeader(header, value);
    });

    try {
        const res_dify = await fetch(dify_url, requestConfig);

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
        res.status(500).json({
            error: 'Failed to connect to Dify!',
            details: e instanceof Error ? e.message : e
        })
    }

});

/**
 * Listen to a standard port.
 */
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});