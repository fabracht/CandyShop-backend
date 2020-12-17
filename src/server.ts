import mongoose from "mongoose";
import dotenv from "dotenv";
import { app } from "./index";
import https from "https";
import http from "http";
import fs from "fs";

// DEAL WITH UNCAUGHT EXCEPTION
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION 💣 Shutting Down");
  process.exit(1); // UNCAUGHT EXCEPTION
});

// CONFIGURE ENV VARIABLES
dotenv.config();
const DB = process.env.DATABASE?.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD!
);

// CONNECT TO MONGOOSE DB
mongoose
  .connect(DB!, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection successful"));

// DEFINE AND START SERVER
const PORT = process.env.PORT || 3030;
const SPORT = process.env.SPORT || 443;
var privateKey = fs.readFileSync(__dirname + "/ssl/server.key", "utf8");
var certificate = fs.readFileSync(__dirname + "/ssl/server.crt", "utf8");

var credentials = { key: privateKey, cert: certificate };
http.createServer(app).listen(PORT);
https.createServer(credentials, app).listen(SPORT);
// const server = app.listen(PORT, () => {
//   console.log(`App running on port ${PORT}`);
// });

// HANDLING ALL UNHANDLED REJECTIONS;
process.on("unhandledRejection", (err: Error) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION 🚨 Shutting Down");
  // server.close(() => {
  //   process.exit(1);
  // });
});
