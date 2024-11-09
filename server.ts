import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import socketServer from "./ws/ws";
import { connectToDB } from "./lib/db";
import "dotenv/config";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  await connectToDB(); 
  const io = new Server(httpServer, {cors: {origin: "*"}});

  socketServer(io);
  
  httpServer.listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`,
  );

});