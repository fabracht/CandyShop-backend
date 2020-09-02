import { Router, Request, Response, NextFunction } from "express";

export const router = Router();

router.route("/**/*").all((req: Request, res: Response, next: NextFunction) => {
  req.body.requestTime = new Date().toISOString();
  next();
});