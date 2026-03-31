"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = __importDefault(require("pg"));
const { Client } = pg_1.default;
require("dotenv/config");
const hosts = [
    "aws-1-ap-southeast-2.pooler.supabase.com",
    "13.239.87.90",
    "52.62.122.103"
];
const ports = [5432, 6543];
async function test(host, port) {
    const connectionString = `postgresql://postgres.izclokfqqoefirdtecil:3VrsZ6RNAAlS8iax@${host}:${port}/postgres`;
    const client = new Client({
        connectionString,
        connectionTimeoutMillis: 5000,
    });
    try {
        await client.connect();
        console.log(`[SUCCESS] ${host}:${port}`);
        await client.end();
        return true;
    }
    catch (err) {
        console.log(`[FAILED ] ${host}:${port} - ${err.message}`);
        return false;
    }
}
async function main() {
    for (const host of hosts) {
        for (const port of ports) {
            await test(host, port);
        }
    }
}
main();
