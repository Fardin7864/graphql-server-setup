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
const express4_1 = require("@apollo/server/express4");
const express_1 = __importDefault(require("express"));
const graphql_1 = __importDefault(require("./graphql"));
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        const PORT = Number(process.env.PORT) || 8080;
        // Use JSON middleware for parsing incoming requests
        app.use(express_1.default.json());
        // Health check route
        app.get("/", (req, res) => {
            res.json({ message: "Server is running" });
        });
        try {
            // Initialize Apollo server and set up GraphQL middleware
            app.use("/graphql", (0, express4_1.expressMiddleware)(yield (0, graphql_1.default)()));
        }
        catch (error) {
            console.error("Failed to initialize Apollo Server:", error);
            process.exit(1);
        }
        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error("Error encountered:", err.stack);
            res.status(500).json({ error: "Something went wrong!" });
        });
        // Start the server
        const httpServer = app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
        // Graceful shutdown
        const shutdown = () => {
            console.log("Shutting down gracefully...");
            httpServer.close(() => {
                console.log("Server closed.");
                process.exit(0);
            });
        };
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
        process.on("uncaughtException", (error) => {
            console.error("Uncaught Exception:", error);
            shutdown();
        });
        process.on("unhandledRejection", (reason) => {
            console.error("Unhandled Rejection:", reason);
            shutdown();
        });
    });
}
startServer().catch((error) => {
    console.error("Failed to start server:", error);
});
