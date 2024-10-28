import { expressMiddleware } from "@apollo/server/express4";
import express, { Request, Response, NextFunction } from "express";
import createApolloGraphqlServer from "./graphql";
import UserService from "./services/user/UserService";
import cors from "cors";
import { sendEmail } from "./utils/emailServices/SendEmail";
import { sendOtp } from "./utils/OTP/SendOtpText";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 8080;
  const corsOptions = {
    origin: "*",
    methods: "POST",
    credentials: true,
  };
  app.options("*", cors(corsOptions)); // Preflight request handling

  // Use JSON middleware for parsing incoming requests
  app.use(express.json());

  // Health check route
  app.get("/", (req, res) => {
    res.json({ message: "Server is running" });
  });

  app.get("/email", (req, res) => {
    // Example usage
    sendEmail(
      "info.dubet@gmail.com",
      "Your OTP Code",
      "Your OTP code is: 123456"
    )
      .then(console.log)
      .catch(console.error);
    return;
  });

  app.get("/otp", (req, res) => {

    // Example usage
    sendOtp("+8801885482244")
      .then((otp) => console.log(`OTP: ${otp}`))
      .catch(console.error);

    return;
  });

  try {
    // Initialize Apollo server and set up GraphQL middleware
    app.use(
      "/graphql",
      expressMiddleware(await createApolloGraphqlServer(), {
        context: async ({ req }) => {
          //  @ts-ignore
          const token = req.headers["token"];
          try {
            const user = UserService.jwtDecode(token as string);
            return { user };
          } catch (error) {
            return {};
          }
        },
      })
    );
  } catch (error) {
    console.error("Failed to initialize Apollo Server:", error);
    process.exit(1);
  }

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
