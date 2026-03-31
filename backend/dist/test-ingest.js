"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
// Use the Prisma connection directly to bypass Prisma Client if it's acting up, 
// or just fetch with native fetch for testing the endpoint.
async function testIngest() {
    try {
        // 1. We need a valid API key. We'll grab one from the database manually.
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        const client = await pool.connect();
        const res = await client.query('SELECT key FROM "ApiKey" LIMIT 1');
        client.release();
        if (res.rows.length === 0) {
            console.error("No API keys found in the database. Please generate one in the dashboard first.");
            process.exit(1);
        }
        const apiKey = res.rows[0].key;
        console.log(`Using API Key: ${apiKey}`);
        // 2. Fire the simulated event
        const payload = {
            event: "USER_SIGNUP",
            metadata: { plan: "PRO", email: "test@externalapp.com" }
        };
        console.log("Sending payload...");
        const response = await fetch("http://localhost:8000/api/v1/event", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log("Response:", data);
        process.exit(0);
    }
    catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
}
testIngest();
