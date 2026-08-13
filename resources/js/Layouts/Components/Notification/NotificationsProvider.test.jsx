import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

// The provider is the single place that decides whether a fetch deserves the user's
// attention, so the snackbar calls are what these tests assert on.
const enqueueSnackbar = vi.fn();

vi.mock("notistack", () => ({
    useSnackbar: () => ({ enqueueSnackbar, closeSnackbar: vi.fn() }),
}));

const get = vi.fn();

vi.mock("axios", () => ({
    default: {
        get: (...args) => get(...args),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock("./utils/soundManager", () => ({
    soundManager: { playNewNotification: vi.fn(), playMarkRead: vi.fn() },
}));

import { NotificationsProvider, useNotifications } from "./NotificationsProvider";

const notification = (id, message) => ({
    id,
    data: { message },
    read_at: null,
    created_at: new Date().toISOString(),
});

const payload = (notifications) => ({
    data: {
        notifications,
        unread_count: notifications.length,
        has_more: false,
    },
});

const Consumer = () => {
    const { notifications, refresh } = useNotifications();

    return <button onClick={() => refresh()}>loaded:{notifications.length}</button>;
};

// A fresh SWR cache per render keeps one test's poll results out of the next one.
const renderProvider = () =>
    render(
        <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
            <NotificationsProvider>
                <Consumer />
            </NotificationsProvider>
        </SWRConfig>
    );

const waitForCount = (count) => waitFor(() => screen.getByText(`loaded:${count}`));

describe("NotificationsProvider", () => {
    beforeEach(() => {
        sessionStorage.clear();
        enqueueSnackbar.mockClear();
        get.mockReset();
    });

    it("stays quiet about notifications that already existed when the session started", async () => {
        get.mockResolvedValue(payload([notification("a", "Order shipped")]));

        renderProvider();
        await waitForCount(1);

        expect(enqueueSnackbar).not.toHaveBeenCalled();
    });

    it("announces a batch of new notifications once, not once per notification", async () => {
        get.mockResolvedValueOnce(payload([notification("a", "Order shipped")]));

        renderProvider();
        await waitForCount(1);

        get.mockResolvedValue(
            payload([
                notification("c", "Report ready"),
                notification("b", "Sample received"),
                notification("a", "Order shipped"),
            ])
        );
        fireEvent.click(screen.getByText("loaded:1"));
        await waitForCount(3);

        await waitFor(() => expect(enqueueSnackbar).toHaveBeenCalledTimes(1));
        expect(enqueueSnackbar.mock.calls[0][0]).toBe("2 new notifications");
    });

    it("does not re-announce the same notifications on a later poll", async () => {
        get.mockResolvedValueOnce(payload([]));

        renderProvider();
        await waitForCount(0);

        get.mockResolvedValue(payload([notification("a", "Report ready")]));
        fireEvent.click(screen.getByText("loaded:0"));
        await waitForCount(1);
        await waitFor(() => expect(enqueueSnackbar).toHaveBeenCalledTimes(1));
        expect(enqueueSnackbar.mock.calls[0][0]).toBe("Report ready");

        fireEvent.click(screen.getByText("loaded:1"));
        await waitFor(() => expect(get).toHaveBeenCalledTimes(3));

        expect(enqueueSnackbar).toHaveBeenCalledTimes(1);
    });
});
