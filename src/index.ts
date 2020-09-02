import express, { Request, Response, NextFunction } from "express";
import { AppError } from "./utils/AppError";
import morgan from "morgan";

import { router as timeRouter } from "./routers/clock";
import { router as userRouter } from "./routers/userRoutes";
import { router as productRouter } from "./routers/productRoutes";

// DECLARE AND INITIALIZE THE EXPRESS APP 🅰
export const app = express();

// MIDDLEWARE 🔇
if (process.env.NODE_ENV != "PRODUCTION") {
  app.use(morgan("dev"));
}

app.use(express.json());

// SET STARTING REQUEST TIME ⏲
app.use(timeRouter);
app.use(userRouter);
app.use(productRouter);

// SET 404 ROUTE
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`Can't ${req.method} ${req.url}`, 404);
  next(err);
});
