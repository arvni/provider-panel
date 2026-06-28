import { describe, it, expect, vi, afterEach } from "vitest";
import { fetcher } from "./api";

/**
 * Unit tests for `fetcher`, the SWR fetch helper. It normalises the three
 * failure modes (network error, non-OK response, invalid JSON) into thrown
 * Errors and returns parsed JSON on success.
 */
describe("fetcher", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const stubFetch = (impl) => vi.stubGlobal("fetch", vi.fn(impl));

    it("returns parsed JSON on a successful response", async () => {
        stubFetch(async () => ({
            ok: true,
            json: async () => ({ hello: "world" }),
        }));

        await expect(fetcher("/api/thing")).resolves.toEqual({ hello: "world" });
    });

    it("throws a network error when fetch rejects", async () => {
        stubFetch(async () => {
            throw new Error("boom");
        });

        await expect(fetcher("/api/thing")).rejects.toThrow("Network error");
    });

    it("throws the status text on a non-OK response", async () => {
        stubFetch(async () => ({
            ok: false,
            status: 404,
            statusText: "Not Found",
        }));

        await expect(fetcher("/api/thing")).rejects.toThrow("Not Found");
    });

    it("throws on invalid JSON in a successful response", async () => {
        stubFetch(async () => ({
            ok: true,
            json: async () => {
                throw new Error("Unexpected token");
            },
        }));

        await expect(fetcher("/api/thing")).rejects.toThrow("Invalid JSON response");
    });
});
