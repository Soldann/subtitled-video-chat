import express, { Application } from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import path from "path";
 
export class Server {
 private httpServer: HTTPServer;
 private app: Application;
 private io: SocketIOServer;
 private activeSockets: string[] = [];
 
 private readonly DEFAULT_PORT = 80;
 
 constructor() {
   this.app = express();
   this.httpServer = createServer(this.app);
   this.io = socketIO(this.httpServer);
   this.app.use(express.static(path.join(__dirname, "./pages")));
 
   this.handleRoutes();
   this.handleSocketConnection();
 }
 
 private handleRoutes(): void {
   this.app.get("/", (req, res) => {
     res.send(`<h1>Hello World</h1>`); 
   });
 }
 
 private handleSocketConnection(): void {
   this.io.on("connection", socket => {
     console.log("Socket connected.");

     console.log("Connection detected. Before: " + this.activeSockets);

     const existingSocket = this.activeSockets.find(
      existingSocket => existingSocket === socket.id
    );

    if (!existingSocket) {
      this.activeSockets.push(socket.id);

      socket.emit("update-user-list", {
        users: this.activeSockets
      });

      socket.broadcast.emit("update-user-list", {
        users: [socket.id]
      });

      socket.on("disconnect", () => {
        this.activeSockets = this.activeSockets.filter(
          existingSocket => existingSocket !== socket.id
        );
        socket.broadcast.emit("remove-user", {
          socketId: socket.id
        });
        console.log("Connection removed: " + this.activeSockets);
      });
    }

    console.log("Connection detected. After: " + this.activeSockets);
   });
 }
 
 public listen(callback: (port: number) => void): void {
   this.httpServer.listen(this.DEFAULT_PORT, () =>
     callback(this.DEFAULT_PORT)
   );
 }
}