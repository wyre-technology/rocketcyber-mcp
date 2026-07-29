/**
 * Tests for rocketcyber_list_incidents compact/verbose response mode.
 *
 * A 20-incident page with full `description`/`remediation` free-text is ~64K
 * characters and breaks client rendering. Default responses truncate those
 * fields; `verbose: true` restores today's byte-for-byte behavior.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { RocketCyberToolHandler } from "../handlers/tool.handler.js";
import { RocketCyberService } from "../services/rocketcyber.service.js";
import { Logger } from "../utils/logger.js";

const logger = new Logger("error");

const TRUNCATION_SUFFIX = "… [truncated — pass verbose: true for full text]";

// Deterministic word-based free text, comfortably longer than 300 characters.
const LONG_DESCRIPTION = "alpha bravo charlie delta echo foxtrot golf hotel ".repeat(12).trim();
const LONG_REMEDIATION = "india juliett kilo lima mike november oscar papa ".repeat(12).trim();

function incidentsResponse() {
  return {
    data: [
      {
        id: 101,
        title: "Suspicious login detected",
        description: LONG_DESCRIPTION,
        remediation: LONG_REMEDIATION,
        status: "open",
        severity: "high",
        accountId: 42,
        eventCount: 7,
        affectedDevices: ["WS-01", "WS-02"],
        createdAt: "2026-07-01T00:00:00Z",
      },
      {
        id: 102,
        title: "Malware quarantined",
        description: "Short summary.",
        remediation: "No action needed.",
        status: "resolved",
        severity: "low",
        accountId: 42,
      },
    ],
    totalCount: 40,
    currentPage: 3,
    totalPages: 2,
  };
}

function makeHandler(response: unknown) {
  const listIncidents = vi.fn().mockResolvedValue(response);
  const service = { listIncidents } as unknown as RocketCyberService;
  return { handler: new RocketCyberToolHandler(service, logger), listIncidents };
}

async function callListIncidents(
  handler: RocketCyberToolHandler,
  args: Record<string, any>
): Promise<{ message: string; data: any }> {
  const result = await handler.callTool("rocketcyber_list_incidents", args);
  expect(result.isError).toBeUndefined();
  return JSON.parse(result.content[0].text);
}

/** Strip the truncation suffix and return the kept text. */
function keptText(value: string): string {
  expect(value.endsWith(TRUNCATION_SUFFIX)).toBe(true);
  return value.slice(0, -TRUNCATION_SUFFIX.length);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("rocketcyber_list_incidents compact mode (default)", () => {
  it("truncates long description and remediation at a word boundary with the marker", async () => {
    const { handler } = makeHandler(incidentsResponse());
    const body = await callListIncidents(handler, {});
    const incident = body.data.data[0];

    for (const [field, original] of [
      ["description", LONG_DESCRIPTION],
      ["remediation", LONG_REMEDIATION],
    ] as const) {
      const kept = keptText(incident[field]);
      expect(kept.length).toBeLessThanOrEqual(300);
      // Cut lands on a word boundary: kept text is a prefix of the original
      // and the very next character in the original is a space.
      expect(original.startsWith(kept)).toBe(true);
      expect(original[kept.length]).toBe(" ");
    }
  });

  it("keeps every other incident field untouched", async () => {
    const { handler } = makeHandler(incidentsResponse());
    const body = await callListIncidents(handler, {});
    const { description, remediation, ...rest } = body.data.data[0];
    const { description: _d, remediation: _r, ...expected } = incidentsResponse().data[0];
    expect(rest).toEqual(expected);
  });

  it("passes short free-text values through untouched", async () => {
    const { handler } = makeHandler(incidentsResponse());
    const body = await callListIncidents(handler, {});
    expect(body.data.data[1]).toEqual(incidentsResponse().data[1]);
  });

  it("preserves response-level metadata and the message string", async () => {
    const { handler } = makeHandler(incidentsResponse());
    const body = await callListIncidents(handler, {});
    expect(body.data.totalCount).toBe(40);
    expect(body.data.currentPage).toBe(3);
    expect(body.data.totalPages).toBe(2);
    expect(body.message).toBe("Retrieved incidents (2 results, page 3 of 2)");
  });
});

describe("rocketcyber_list_incidents verbose mode", () => {
  it("verbose: true returns today's response byte-for-byte", async () => {
    const response = incidentsResponse();
    const { handler } = makeHandler(response);
    const result = await handler.callTool("rocketcyber_list_incidents", { verbose: true });
    expect(result.content[0].text).toBe(
      JSON.stringify({
        message: "Retrieved incidents (2 results, page 3 of 2)",
        data: response,
      })
    );
  });
});

describe("rocketcyber_list_incidents tool definition", () => {
  it("declares the verbose parameter and documents the default-compact behavior", async () => {
    const { TOOL_DEFINITIONS } = await import("../handlers/tool.definitions.js");
    const tool = TOOL_DEFINITIONS.find((t) => t.name === "rocketcyber_list_incidents")!;
    expect(tool.inputSchema.properties.verbose).toMatchObject({ type: "boolean" });
    expect(tool.inputSchema.properties.verbose.description).toMatch(/full|untruncated/i);
    expect(tool.description).toMatch(/truncat/i);
  });
});

describe("rocketcyber_list_incidents verbose stripping", () => {
  it("strips verbose from the service call arguments", async () => {
    const { handler, listIncidents } = makeHandler(incidentsResponse());
    await callListIncidents(handler, { verbose: true, status: "open", page: 2 });
    expect(listIncidents).toHaveBeenCalledWith({ status: "open", page: 2 });
  });

  it("never leaks verbose into the RocketCyber HTTP query params", async () => {
    const requestedUrls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: RequestInfo | URL) => {
        requestedUrls.push(String(url));
        return new Response(JSON.stringify(incidentsResponse()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      })
    );

    const service = new RocketCyberService(
      { name: "test", version: "0", rocketcyber: { apiKey: "test-key", region: "us" } },
      logger
    );
    const handler = new RocketCyberToolHandler(service, logger);
    await callListIncidents(handler, { verbose: true, status: "open" });

    expect(requestedUrls).toHaveLength(1);
    const url = new URL(requestedUrls[0]);
    expect(url.searchParams.has("verbose")).toBe(false);
    expect(url.searchParams.get("status")).toBe("open");
  });
});
