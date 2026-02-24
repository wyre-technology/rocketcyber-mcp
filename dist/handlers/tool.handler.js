"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RocketCyberToolHandler = void 0;
const tool_definitions_js_1 = require("./tool.definitions.js");
class RocketCyberToolHandler {
    constructor(service, logger) {
        this.service = service;
        this.logger = logger;
    }
    async listTools() {
        this.logger.debug(`Listed ${tool_definitions_js_1.TOOL_DEFINITIONS.length} available tools`);
        return tool_definitions_js_1.TOOL_DEFINITIONS;
    }
    getDispatchTable() {
        const s = this.service;
        return new Map([
            ['rocketcyber_test_connection', async () => {
                    const ok = await s.testConnection();
                    return { result: { success: ok }, message: ok ? 'Successfully connected to RocketCyber API' : 'Connection failed' };
                }],
            ['rocketcyber_get_account', async (a) => {
                    const r = await s.getAccount(a.accountId ? { accountId: a.accountId } : undefined);
                    return { result: r, message: 'Account info retrieved successfully' };
                }],
            ['rocketcyber_list_agents', async (a) => {
                    const r = await s.listAgents(a);
                    return { result: r, message: `Retrieved agents (${r.data?.length || 0} results, page ${r.currentPage || 1} of ${r.totalPages || 1})` };
                }],
            ['rocketcyber_list_incidents', async (a) => {
                    const r = await s.listIncidents(a);
                    return { result: r, message: `Retrieved incidents (${r.data?.length || 0} results, page ${r.currentPage || 1} of ${r.totalPages || 1})` };
                }],
            ['rocketcyber_list_events', async (a) => {
                    const r = await s.listEvents(a);
                    return { result: r, message: `Retrieved events (${r.data?.length || 0} results, page ${r.currentPage || 1} of ${r.totalPages || 1})` };
                }],
            ['rocketcyber_get_event_summary', async (a) => {
                    const r = await s.getEventSummary(a);
                    return { result: r, message: 'Event summary retrieved successfully' };
                }],
            ['rocketcyber_list_firewalls', async (a) => {
                    const r = await s.listFirewalls(a);
                    return { result: r, message: `Retrieved firewalls (${r.data?.length || 0} results, page ${r.currentPage || 1} of ${r.totalPages || 1})` };
                }],
            ['rocketcyber_list_apps', async (a) => {
                    const r = await s.listApps(a);
                    return { result: r, message: `Retrieved apps (${r.data?.length || 0} results, page ${r.currentPage || 1} of ${r.totalPages || 1})` };
                }],
            ['rocketcyber_get_defender', async (a) => {
                    const r = await s.getDefender(a.accountId ? { accountId: a.accountId } : undefined);
                    return { result: r, message: 'Defender status retrieved successfully' };
                }],
            ['rocketcyber_get_office', async (a) => {
                    const r = await s.getOffice(a.accountId ? { accountId: a.accountId } : undefined);
                    return { result: r, message: 'Office 365 status retrieved successfully' };
                }],
        ]);
    }
    async callTool(name, args) {
        this.logger.debug(`Calling tool: ${name}`, args);
        try {
            const handler = this.getDispatchTable().get(name);
            if (!handler)
                throw new Error(`Unknown tool: ${name}`);
            const { result, message } = await handler(args);
            const responseText = JSON.stringify({ message, data: result });
            this.logger.debug(`Successfully executed tool: ${name}`);
            return { content: [{ type: 'text', text: responseText }] };
        }
        catch (error) {
            this.logger.error(`Tool execution failed for ${name}:`, error);
            return {
                content: [{ type: 'text', text: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', tool: name }) }],
                isError: true
            };
        }
    }
}
exports.RocketCyberToolHandler = RocketCyberToolHandler;
//# sourceMappingURL=tool.handler.js.map