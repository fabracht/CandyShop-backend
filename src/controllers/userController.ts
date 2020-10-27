import { User } from "../models/userModel";
import { Request, Response, NextFunction } from "express";
import {
  EResponseStatusType,
  IRequestWithBody,
  IUserDocument,
} from "../utils/types";
import { AppError } from "../utils/AppError";

export const getAllUsers = async (req: IRequestWithBody, res: Response) => {
  try {
    const users = await User.find();
    // SEND RESPONSE
    res.status(200).json({
      result: EResponseStatusType.success,
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    res.status(404).json({
      result: EResponseStatusType.fail,
      error: err,
    });
  }
};

export const getOneUser = async (
  req: IRequestWithBody,
  res: Response,
  next: NextFunction
) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    const err = new AppError("User Not Found", 404);
    return next(err);
  }
  // ELSE
  res.status(200).json({
    result: EResponseStatusType.success,
    data: {
      user,
    },
  });
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const createdUser = await User.create(req.body);
    res.status(200).json({
      result: EResponseStatusType.success,
      data: {
        createdUser,
      },
    });
  } catch (err) {
    res.status(400).json({
      result: EResponseStatusType.fail,
      data: {
        err,
      },
    });
  }
};

export const updateUser = async (req: IRequestWithBody, res: Response) => {
  const userData: Partial<IUserDocument> = req.body || undefined;
  if (userData) {
    try {
      await User.updateOne(
        { _id: req.params.id },
        {
          ...userData,
        }
      );
      const updatedUser = await User.findOne({ _id: req.params.id });

      res.status(200).json({
        result: EResponseStatusType.success,
        data: {
          updatedUser,
        },
      });
    } catch (err) {
      res.status(err.status).json({
        result: EResponseStatusType.fail,
        messsage: err.message,
      });
    }
  } else {
    const err = new AppError("Bad Request", 400);
    res.status(err.statusCode!).json({
      result: EResponseStatusType.fail,
      message: err.message,
    });
  }
};

export const deleteUser = async (req: IRequestWithBody, res: Response) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id });
    if (!user) {
      const err = new AppError("User not found", 404);
      res.status(err.statusCode!).json({
        result: EResponseStatusType.fail,
        message: err.message,
      });
    } else {
      console.log(user);

      res.status(204).json({
        result: EResponseStatusType.success,
        data: null,
      });
    }
  } catch (err) {
    res.json({
      result: EResponseStatusType.fail,
      message: err,
    });
  }
};
