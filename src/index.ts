import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';


async function startServer() {
    const app = express();
    const PORT = Number(process.env.PORT) || 8080;

    // Use helmet for security best practices
    // app.use(helmet());

    // Use morgan for logging HTTP requests
    // app.use(morgan('combined'));

    // Use JSON middleware for parsing incoming requests
    app.use(express.json());

    app.use(cors({
        origin: '*', // Adjust this for more restrictive access control in production
      }));


    const typeDefs = `
        type Query {
            hello: String
            say(name: String): String
        }
    `;

    const resolvers = {
        Query: {
            hello: () => 'Hey there, I am a GraphQL server',
            say: (_: any, { name }: { name: string }) => `Hey ${name}, Welcome to GraphQL!`
        },
    };

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        introspection: true, // Allow introspection for development environments
    });

    await server.start();

    // Set up GraphQL middleware
    app.use("/graphql", expressMiddleware(server));

    // Health check route
    app.get("/", (req, res) => {
        res.json({ message: "Server is running" });
    });

    // Error handling middleware
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err.stack);
        res.status(500).json({ error: 'Something went wrong!' });
    });

    // Start the server
    const httpServer = app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('Received SIGINT. Shutting down gracefully...');
        httpServer.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        console.log('Received SIGTERM. Shutting down gracefully...');
        httpServer.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
    });
}

startServer().catch((error) => {
    console.error('Failed to start server:', error);
});
