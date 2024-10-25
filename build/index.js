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
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const typeDefs_1 = __importDefault(require("./graphql/typeDefs"));
const resolvers_1 = __importDefault(require("./graphql/resolvers"));
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        const PORT = Number(process.env.PORT) || 8080;
        // Use helmet for security best practices
        // app.use(helmet());
        // Use morgan for logging HTTP requests
        // app.use(morgan('combined'));
        // Use JSON middleware for parsing incoming requests
        app.use(express_1.default.json());
        app.use((0, cors_1.default)({
            origin: "*", // Adjust this for more restrictive access control in production
        }));
        const server = new server_1.ApolloServer({
            typeDefs: typeDefs_1.default,
            resolvers: resolvers_1.default,
            introspection: true, // Allow introspection for development environments
        });
        yield server.start();
        // Set up GraphQL middleware
        app.use("/graphql", (0, express4_1.expressMiddleware)(server));
        // Health check route
        app.get("/", (req, res) => {
            res.json({ message: "Server is running" });
        });
        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ error: "Something went wrong!" });
        });
        // Start the server
        const httpServer = app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
        // Graceful shutdown
        process.on("SIGINT", () => {
            console.log("Received SIGINT. Shutting down gracefully...");
            httpServer.close(() => {
                console.log("Server closed.");
                process.exit(0);
            });
        });
        process.on("SIGTERM", () => {
            console.log("Received SIGTERM. Shutting down gracefully...");
            httpServer.close(() => {
                console.log("Server closed.");
                process.exit(0);
            });
        });
    });
}
startServer().catch((error) => {
    console.error("Failed to start server:", error);
});
