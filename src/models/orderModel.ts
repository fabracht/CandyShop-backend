import { model, Schema } from "mongoose";
import { IOrderSchema } from "../utils/types";

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "users" },
    nOfItems: { type: Number, required: true },
    totalCost: { type: Number },
    productList: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "products" },
        quantity: { type: Number, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Order = model<IOrderSchema>("orders", orderSchema);
