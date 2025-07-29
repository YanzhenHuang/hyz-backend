"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const https_proxy_agent_1 = require("https-proxy-agent");
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 199,
    message: 'Too many requests for my poor server QAQ'
}));
const port = process.env.SYSTEM_PORT;
/**
 * Root api. Reserved for major use.
 */
app.get('/', (req, res) => {
    res.send("Test!!!");
});
/**
 * GLaDoS API. Test if the server is alive.
 */
app.get('/are-you-still-there', (req, res) => {
    res.send('still-alive');
});
/**
 * Chat API. Send query and context, forward stream to frontend.
 */
app.post('/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, conversation_id } = req.body;
    const dify_url = process.env.DIFY_URL;
    const dify_api_key = process.env.DIFY_API_KEY;
    if (!dify_url || !dify_api_key) {
        return res.status(500).json({
            error: 'Please check dify configuration.'
        });
    }
    let requestConfig = {
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
        const agent = new https_proxy_agent_1.HttpsProxyAgent(proxyUrl);
        requestConfig = Object.assign({ agent }, requestConfig);
    }
    Object.entries({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    }).forEach(([header, value]) => {
        res.setHeader(header, value);
    });
    try {
        const res_dify = yield (0, node_fetch_1.default)(dify_url, requestConfig);
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
    }
    catch (e) {
        console.log(e);
        res.status(500).json({
            error: 'Failed to connect to Dify!',
            details: e instanceof Error ? e.message : e
        });
    }
}));
/**
 * Listen to a standard port.
 */
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
