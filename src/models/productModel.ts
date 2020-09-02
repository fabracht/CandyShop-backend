import { model, Schema } from "mongoose";
import { IProduct, IProductSchema } from "../utils/types";

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, unique: true },
    weight: { type: Number, required: true },
    price: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: ["bombon", "cake", "taffy"],
    },
    quantity: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// THIS PRE MIDDLEWARE SETS THE STARTING TIME FOR THE QUERY
productSchema.pre(/^find/, function (this: IProductSchema, next) {
  this.start = Date.now();
  next();
});

// THIS POST MIDDLEWARE SETS THE END TIME FOR THE QUERY
// AND OUTPUTS THE TIME DELTA
productSchema.post(/^find/, function (this: IProductSchema, docs, next) {
  this.start
    ? console.log(`Query took ${Date.now() - this.start} milliseconds!`)
    : console.log("Query start time is undefined");
  next();
});

export const Product = model<IProductSchema>("products", productSchema);
