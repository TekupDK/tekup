import { Router } from "express";
import { handleChat } from "../controllers/chatController";
import { handleChatStream } from "../controllers/chatStreamController";

export const chatRouter = Router();

// Regular chat endpoint
chatRouter.post("/", (req, res, next) => {
    void handleChat(req, res, next);
});

// Streaming chat endpoint (SSE)
chatRouter.post("/stream", (req, res, next) => {
    void handleChatStream(req, res, next);
});
