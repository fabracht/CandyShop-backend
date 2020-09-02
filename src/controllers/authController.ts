import { Response, NextFunction } from "express";
import { User } from "../models/userModel";
import { AppError } from "../utils/AppError";
import { IRequestWithBody, IUser } from "../utils/types";
import jwt, { Secret } from "jsonwebtoken";

const signToken = (id: string) => {
  const secret: Secret = process.env.JWT_SECRET || "";
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

export const signup = async (req: IRequestWithBody, res: Response): Promise<Response> => {
  const user: IUser = req.body as unknown as IUser;

  try {
    const newUser = await User.create(user);
    const token = signToken(newUser._id);
    return res.status(201).json({
      status: "success",
      headers: {
        "access_token": token,
        "token_type": "JWT",
        "expires_in": process.env.JWT_EXPIRES_IN,
      },
      data: {
        user: newUser,
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Signup process failed, can't create user");
  }
};

export const login = async (req: IRequestWithBody, res: Response, next: NextFunction): Promise<Response|void> => {
  const { email, password } = req.body;
  // VERIFY IF EMAIL AND PASSWORD ARE PRESENT
  if (!email || !password) {
    return next(new AppError("Please Provide email and password", 400));
  }

  // CHECK IF USER EXISTS
  try {
    const user = await User.findOne({ email }).select("+password");
    // USING AN INSTANCE METHOD OF THE USER MODEL TO CHECK THE PASSWORD
    if (!user || !(await user?.schema.methods.correctPassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401)); // UNAUTHORIZED
    }
    const token = signToken(user._id);
    return res.status(200).json({
      headers: {
        "access_token": token,
        "token_type": "JWT",
        "expires_in": process.env.JWT_EXPIRES_IN,
      },
      status: "success",
    });
  } catch (err) {
    console.log(err);
    return res.json({
      status: "fail",
      message: err
    });
  }
};

export const protect = async (req: IRequestWithBody, res: Response, next: NextFunction): Promise<Response|void> => {
  const header: string | undefined = req.headers.authorization;
  let token = "";
  // GET TOKEN AND CHECK IF IT EXISTS
  if (header && header.startsWith("Bearer")) {
    token = header.split(" ")[1];
  }
  if (!token) {
    return next(new AppError("Invalid credentials, please login again", 401));
  }

  // VERIFY TOKEN
  interface MyToken {
    id: string,
    iat: number,
    exp: number,
  }

  let dec: MyToken | undefined;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  jwt.verify(token, process.env.JWT_SECRET!, function (err, decoded) {
    dec = decoded as MyToken; // bar
  });
  if (dec) {
    try {
      const freshUser = await User.findById(dec.id);
      if (!freshUser) {
        return next(new AppError("Unauthorized. User does not exist", 401));
      }
      if (freshUser.schema.methods.changedPasswordAfter(dec.iat)) {
        return next(
          new AppError(
            "Unauthorized. Password out ot date. Please login again",
            401
          )
        );
      }
      req.body.user = freshUser.toJSON();
      next();
    } catch (err) {
      return res.json({
        status: "fail",
        message: "JsonWebTokenError: invalid token 😜 ",
      });
    }
  } else {
    const error = new AppError("JsonWebTokenError: invalid token 😜 ", 500);
    return res.json({
      status: "fail",
      message: error.message
    });
  }
};
