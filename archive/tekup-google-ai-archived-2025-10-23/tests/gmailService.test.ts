import { describe, expect, it, vi, afterEach } from "vitest";
import { google } from "googleapis";
import { getGoogleAuthClient } from "../src/services/googleAuth";

const mockedGmail = {
    users: {
        messages: {
            list: vi.fn(),
            get: vi.fn(),
        },
    },
};

vi.mock("googleapis", () => ({
    google: {
        gmail: vi.fn(() => mockedGmail),
    },
    gmail_v1: {},
}));

vi.mock("../src/services/googleAuth", () => ({
    getGoogleAuthClient: vi.fn(() => ({})),
}));

const mockGoogle = vi.mocked(google);
const mockGetGoogleAuthClient = vi.mocked(getGoogleAuthClient);

afterEach(() => {
    mockedGmail.users.messages.list.mockReset();
    mockedGmail.users.messages.get.mockReset();
    mockGoogle.gmail.mockClear();
});

describe("listRecentMessages", () => {
    it("returns empty array when Gmail client is unavailable", async () => {
        mockGetGoogleAuthClient.mockReturnValueOnce(null);
        const { listRecentMessages } = await import("../src/services/gmailService");

        const result = await listRecentMessages();

        expect(result).toEqual([]);
        expect(mockedGmail.users.messages.list).not.toHaveBeenCalled();
    });

    it("fetches and normalises recent messages", async () => {
        mockedGmail.users.messages.list.mockResolvedValueOnce({
            data: {
                messages: [
                    {
                        id: "msg-1",
                        threadId: "thread-1",
                        snippet: "Hello there",
                    },
                ],
            },
        });

        mockedGmail.users.messages.get.mockResolvedValueOnce({
            data: {
                id: "msg-1",
                threadId: "thread-1",
                snippet: "Hello there body",
                internalDate: "1700000000000",
                payload: {
                    headers: [
                        { name: "Subject", value: "Test subject" },
                        { name: "From", value: "Sender <sender@example.com>" },
                    ],
                },
            },
        });

        const { listRecentMessages } = await import("../src/services/gmailService");

        const result = await listRecentMessages({ maxResults: 10 });

        expect(mockedGmail.users.messages.list).toHaveBeenCalledWith({
            userId: "me",
            maxResults: 10,
            labelIds: undefined,
            q: undefined,
            includeSpamTrash: false,
        });

        expect(result).toEqual([
            expect.objectContaining({
                id: "msg-1",
                threadId: "thread-1",
                subject: "Test subject",
                from: "Sender <sender@example.com>",
                snippet: "Hello there body",
                internalDate: "2023-11-14T22:13:20.000Z",
            }),
        ]);
    });
});
