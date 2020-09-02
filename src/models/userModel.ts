import { model, Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { IUserSchema, IUserDocument } from "../utils/types";

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
    passwordChangedAt: Date,
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

  // Hash the password with bcrypt cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// CREATING THE AVATAR FROM GRAVATAR
userSchema.pre<IUserSchema>("save", async function (next) {
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
  return await bcrypt.compare(candidatePassword, userPassword);
};

// INSTANCE METHOD FOR CHECKING IF PASSWORD WAS CHANGED
userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    // this.passwordChangedAt;
    // Parse time to int base 10
    const changedTimestamp = this.passwordChangedAt.getTime();

    return JWTTimestamp > changedTimestamp;
  }
  return false;
};

userSchema.post(/^find/, function (this: IUserSchema, docs, next) {
  this.start
    ? console.log(`Query took ${Date.now() - this.start} milliseconds!`)
    : console.log("Query start time is undefined");
  next();
});

export const User = model<IUserDocument>("users", userSchema);
