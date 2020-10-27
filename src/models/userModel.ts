import { model, Error as mError, Schema, HookNextFunction } from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { IUserSchema, IUserDocument } from "../utils/types";
import { AppError } from "../utils/AppError";
import { NextFunction } from "express";

/* USER SCHEMA includes
fullname, email, password, avatar address, auth0Id, streetAddress, unitNumber, phone, passwordChangedAt
*/
const userSchema: Schema<IUserSchema> = new Schema(
  {
    fullname: {
      type: String,
      lowercase: true,
      required: [true, "A user must have a name"],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: { type: String, required: true, select: false },
    avatar: { type: String },
    auth0Id: { type: String },
    streetAddress: { type: String },
    unitNumber: { type: Number },
    phone: { type: Number },
    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

userSchema.pre(/^find/, function (this: IUserSchema, next) {
  this.start = Date.now();
  next();
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
// ENCRYPTION OF THE PASSWORD
userSchema.pre<IUserSchema>("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();
  const SALT_WORK_FACTOR = 12;
  // Hash the password with bcrypt salt rounds of 12
  const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
  const hash = await bcrypt.hash(this.password, salt);
  const theyMatch = await bcrypt.compare(this.password, hash);
  console.log(theyMatch);
  console.log("HASHED PASSWORD");
  console.log(hash);
  this.passwordChangedAt = new Date(Date.now());
  this.passwordResetToken = new String();
  this.passwordResetExpires = new Date(Date.now());
  this.password = hash;
  next();
});

// CREATING THE AVATAR FROM GRAVATAR
userSchema.pre<IUserSchema>("save", async function () {
  // The Gravatar image service
  const gravatarUrl = "https://s.gravatar.com/avatar";
  // The size query. We want 60px images
  const query = "s=60";
  // Returns the Gravatar image for an email
  // Gravatar uses MD5 hashes from an email address (all lowercase) to get the image
  const hash = crypto
    .createHash("md5")
    .update(this.email.toLowerCase())
    .digest("hex");
  // Return the full avatar URL
  this.avatar = `${gravatarUrl}/${hash}?${query}`;
});

// INSTANCE METHOD FOR CHECKING THE PASSWORD
// AN INSTANT METHOD IS AVAILABLE FOR ALL DOCUMENTS IN THE COLLECTION
userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
) {
  const result = await bcrypt.compare(candidatePassword, userPassword);
  return result;
};

// INSTANCE METHOD FOR CHECKING IF PASSWORD WAS CHANGED
userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime();

    return JWTTimestamp > changedTimestamp;
  }
  return false;
};

// INSTANCE METHOD FOR CREATING A PASSWORD RESET TOKEN
// IT USES CRYPTO 32 RANDOM BYTES STRING
userSchema.methods.createPasswordResetToken = async function (
  this: IUserSchema,
  user: IUserSchema
): Promise<string | undefined> {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const cryptoResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = cryptoResetToken;
  const t: Date = new Date(Date.now() + 10 * 60 * 1000);
  user.passwordResetExpires = t;

  try {
    const result = await user.save();
    return resetToken;
  } catch (err) {
    console.log("There was an error");
    return undefined;
  }
};

userSchema.post(/^find/, function (this: IUserSchema, docs, next) {
  this.start
    ? console.log(`Query took ${Date.now() - this.start} milliseconds!`)
    : console.log("Query start time is undefined");
  next();
});

userSchema.post<IUserSchema>("findOneAndUpdate", async function (doc) {
  // if (!doc.isModified()) return;
  doc.markModified("password");
  doc.passwordChangedAt = new Date(Date.now());
  doc.passwordResetExpires = new Date(Date.now());
  await doc.save();
});

export const User = model<IUserDocument>("users", userSchema);
