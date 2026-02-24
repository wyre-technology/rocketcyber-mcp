"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RocketCyberService = void 0;
const node_rocketcyber_1 = require("@wyre-technology/node-rocketcyber");
class RocketCyberService {
    constructor(config, logger) {
        this.client = null;
        this.initializationPromise = null;
        this.config = config;
        this.logger = logger;
    }
    async ensureClient() {
        if (!this.client) {
            await this.ensureInitialized();
        }
        return this.client;
    }
    async ensureInitialized() {
        if (this.initializationPromise) {
            await this.initializationPromise;
            return;
        }
        if (this.client)
            return;
        this.initializationPromise = this.initialize();
        await this.initializationPromise;
    }
    async initialize() {
        const { apiKey, region } = this.config.rocketcyber;
        if (!apiKey) {
            throw new Error('Missing required RocketCyber credentials: ROCKETCYBER_API_KEY is required');
        }
        this.logger.info('Initializing RocketCyber client...');
        this.client = new node_rocketcyber_1.RocketCyberClient({
            apiKey,
            region: 'us'
        });
        this.logger.info('RocketCyber client initialized successfully');
    }
    async getAccount(params) {
        const client = await this.ensureClient();
        return client.account.get(params);
    }
    async listAgents(params) {
        const client = await this.ensureClient();
        return client.agents.list(params);
    }
    async listIncidents(params) {
        const client = await this.ensureClient();
        return client.incidents.list(params);
    }
    async listEvents(params) {
        const client = await this.ensureClient();
        return client.events.list(params);
    }
    async getEventSummary(params) {
        const client = await this.ensureClient();
        return client.events.getSummary(params);
    }
    async listFirewalls(params) {
        const client = await this.ensureClient();
        return client.firewalls.list(params);
    }
    async listApps(params) {
        const client = await this.ensureClient();
        return client.apps.list(params);
    }
    async getDefender(params) {
        const client = await this.ensureClient();
        return client.defender.get(params);
    }
    async getOffice(params) {
        const client = await this.ensureClient();
        return client.office.get(params);
    }
    async testConnection() {
        try {
            await this.getAccount();
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.RocketCyberService = RocketCyberService;
//# sourceMappingURL=rocketcyber.service.js.map