import { Response, NextFunction } from "express";
import { User } from "../models/userModel";
import { AppError } from "../utils/AppError";
import { IRequestWithBody, IUser, IUserDocument } from "../utils/types";
import { EResponseStatusType } from "../utils/types";
import jwt, { Secret } from "jsonwebtoken";
import { sendEmail } from "../utils/email";

const signToken = (id: string) => {
  const secret: Secret = process.env.JWT_SECRET || "";
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const verifyUserExists = async (
  email: string
): Promise<IUserDocument | undefined> => {
  try {
    const user = await User.findOne({ email });
    if (user) {
      return user;
    }
    return undefined;
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

export const resetPassword = async (
  req: IRequestWithBody,
  res: Response,
  next: NextFunction
): Promise<IUserDocument | void> => {
  const { token } = req.params;
  if (!token) {
    return next(new AppError("Invalid Token", 401));
  }
  const userId: string = req.cookies.uid;
  if (!userId) {
    return next(new AppError("Id is needed for the request", 400));
  }
  const { password } = req.body;
  if (!password) {
    return next(new AppError("A password is needed for this operation", 400));
  }
  try {
    // console.log(userId);
    const result = await User.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        password: password,
      }
    ).select("+password");
    // console.log(result);
    res.status(200).json({
      result: EResponseStatusType.success,
      message: "Password changed successfuly",
    });
  } catch (err) {
    console.log(err);
    return next(new AppError("Can't find user", 404));
  }
};

// THIS IS WHERE YOU SIGNUP
export const signup = async (
  req: IRequestWithBody,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const user: IUser = (req.body as unknown) as IUser;

  // CHECK THAT USER EXISTS
  const userExists = await verifyUserExists(user.email);
  if (!userExists) {
    try {
      const newUser = await User.create(user);
      const token = signToken(newUser._id);
      if (process.env.NODE_ENV === "DEVELOPMENT") {
        res.cookie("jwt", token, {
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          secure: false,
          httpOnly: true,
        });
        res.cookie("uid", newUser._id, {
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          secure: false,
          httpOnly: true,
        });
      } else {
        res.cookie("jwt", token, {
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          secure: true,
          httpOnly: true,
        });
        res.cookie("uid", newUser._id, {
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          secure: true,
          httpOnly: true,
        });
      }
      return res.status(201).json({
        result: EResponseStatusType.success,
        data: {
          user: newUser,
        },
      });
    } catch (err) {
      return next(new AppError("Duplicate email", 400));
    }
  } else {
    return next(new AppError("User with that email already exist", 403));
  }
};

// THIS IS WHERE YOU LOGOUT
export const logout = async (
  req: IRequestWithBody,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  res.clearCookie("jwt");
  res.clearCookie("uid");
  res.status(200).json({
    result: EResponseStatusType.success,
  });
};

// THIS IS WHERE WE LOGIN
export const login = async (
  req: IRequestWithBody,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const { email, password } = req.body;
  console.log(req.body);
  // VERIFY IF EMAIL AND PASSWORD ARE PRESENT
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // CHECK IF USER EXISTS
  try {
    const user = await User.findOne({ email }).select("+password");
    const isPasswordCorrect = await user?.schema.methods.correctPassword(
      password,
      user.password
    );
    // console.log(isPasswordCorrect);
    // USING AN INSTANCE METHOD OF THE USER MODEL TO CHECK THE PASSWORD
    if (!user || !isPasswordCorrect) {
      return next(new AppError("Incorrect email or password", 401)); // UNAUTHORIZED
    }
    const token = signToken(user._id);
    if (process.env.NODE_ENV === "DEVELOPMENT") {
      console.log(process.env.NODE_ENV);

      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: false,
      });
      res.cookie("uid", user._id, {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly: false,
        secure: false,
      });
    } else {
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        secure: true,
        httpOnly: true,
      });
      res.cookie("uid", user._id, {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        secure: true,
        httpOnly: true,
      });
    }
    return res.status(200).json({
      result: EResponseStatusType.success,
      data: { user: { id: user._id } },
    });
  } catch (err) {
    // console.log(err);
    return res.json({
      result: EResponseStatusType.fail,
      message: err,
    });
  }
};

//
// THIS IS WHERE WE PROTECT ROUTES
//
interface IAuthCookie {
  uid?: string;
  jwt?: string;
}

/// PROTECT CONTROLLER
/// IF ROUTE IS /isloggedin, IT RETURNS A RESPONSE
/// ELSE IT CALLS NEXT WITH EITHER AN ERROR OR A SUCCESS
export const protect = async (
  req: IRequestWithBody,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  // let userId = req.params.id || "";
  let userId = "";
  // console.log(req.cookies);
  const { cookies }: { cookies: IAuthCookie } = req;
  // console.log(cookies);
  console.log("RUNNING PROTECT");
  if (!cookies?.uid) {
    return next(new AppError("Invalid credentials, please login again", 401));
  } else {
    userId = req.cookies.uid;
  }
  if (!cookies?.jwt) {
    return next(new AppError("Invalid credentials, please login again", 401));
  }

  // let token = "";
  // // GET TOKEN AND CHECK IF IT EXISTS
  // if (cookies.jwt) {
  //   console.log(cookies.jwt);
  // }
  // console.log(token);
  // if (!token) {
  //   return next(new AppError("Invalid credentials, please login again", 401));
  // }

  // VERIFY TOKEN
  interface MyToken {
    id: string;
    iat: number;
    exp: number;
  }

  let dec: MyToken | undefined;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  jwt.verify(cookies.jwt, process.env.JWT_SECRET!, function (err, decoded) {
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

      // HERE WE CHECK IF THE USER ID MATCHES THE TOKEN OWNER
      if (`${freshUser._id}` !== userId) {
        next(new AppError("Token doesn't belong", 401));
      }
      const result: IUserDocument = await freshUser.toJSON();

      if (req.route.path === "/isloggedin") {
        console.log("RUNNING STILL");
        /// IF YOU GOT HERE, IT MEANS A RESPONSE IS ON THE WAY
        return res.status(200).json({
          result: EResponseStatusType.success,
          data: {
            message: "Credentials validated",
            avatar: result.avatar,
          },
        });
      }
      /// IF YOU GOT HERE, IT MEANS IT'S A GO TO THE NEXT MIDDLEWARE
      next();
    } catch (err) {
      /// IF YOU GOT HERE, IT MEANS THINGS WENT WRONG
      const error = new AppError(
        "JsonWebTokenError: invalid token 😜 ",
        err.status
      );
      return next(error);
    }
  } else {
    const error = new AppError("JsonWebTokenError: invalid token 😜 ", 500);
    return next(error);
  }
};

/// RESET TOKEN GENERATOR
/// HERE IS WHERE THINGS GO WHEN YOU FORGET THE PASSWORD
export const forgotPassword = async (
  req: IRequestWithBody,
  res: Response,
  next: NextFunction
) => {
  // 1) RETRIEVE EMAIL FROM BODY
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError("Please provide an email", 400));
    }
    // CHECK IF USER EXISTS

    const userExists = await verifyUserExists(email);
    if (!userExists) {
      return next(new AppError("There is no user with that email", 404));
    }
    // 2) Generate the Random reset Token
    const resetToken = await userExists.schema.methods.createPasswordResetToken(
      userExists
    );
    // await userExists.save();
    // 3) Send it to the user's email
    res.status(200).json({
      result: EResponseStatusType.success,
      data: { resetToken },
    });
  } catch (err) {
    return next(new AppError(err.message, err.statusCode));
  }
};
