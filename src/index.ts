import express, { Request, Response, NextFunction } from "express";
import { AppError } from "./utils/AppError";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { router as timeRouter } from "./routers/clock";
import { router as userRouter } from "./routers/userRoutes";
import { router as productRouter } from "./routers/productRoutes";
import { router as orderRouter } from "./routers/orderRoutes";

// DECLARE AND INITIALIZE THE EXPRESS APP 🅰
export const app = express();

// MIDDLEWARE 🔇
if (process.env.NODE_ENV !== "PRODUCTION") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(cookieParser());
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "https://localhost:3000");
  // res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,Content-Type, Accept, Authorization, user-agent"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  next();
});
// SET STARTING REQUEST TIME ⏲
app.use(timeRouter);
app.use(userRouter);
app.use(productRouter);
app.use(orderRouter);
// SET 404 ROUTE
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`Can't ${req.method} ${req.url}`, 404);
  next(err);
});

app.use(function (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // console.error(err);
  res.status(err.statusCode!).json({ err: err.message });
});
