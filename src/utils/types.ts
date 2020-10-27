import { Document } from "mongoose";
import { Request } from "express";

export enum EResponseStatusType {
  success = "success",
  fail = "fail",
}

export enum EProductType {
  taffy,
  bonbon,
  cake,
}

// BASIC PRODUCT INTERFACE
export interface IProduct {
  name: string;
  weight: number;
  description: string;
  price: number;
  type: string;
  quantity: number;
}

export interface IBox {
  productId: string;
  quantity: number;
}

export interface IBoxResponse {
  productName: string;
  productPrice: number;
  quantity: number;
}

// BASIC ORDER INTERFACE
export interface IOrder {
  userId: string;
  nOfItems: number;
  totalCost: number;
  productList: IBox[];
}

export interface IOrderResponse extends Omit<IOrder, "productList"> {
  productList: IBoxResponse[];
}

export interface IOrderDocument extends IOrder, Document {
  start?: number;
}
export interface IOrderSchema extends IOrderDocument {}

// MONGODB PRODUCT DOCUMENT INTERFACE
// THIS CONTAINS ALL THE FIELDS TO BE PRESENT AS DATA
// IN THE SCHEMA
export interface IProductDocument extends IProduct, Document {
  start?: number;
}

// MONGODB PRODUCT SCHEMA INTERFACE
// THIS EXTENDS THE DOCUMENT AND LISTS METHODS IN THE SCHEMA
export interface IProductSchema extends IProductDocument {}

// BASIC USER INTERFACE
export interface IUser {
  fullname: string;
  email: string;
  password: string;
  passwordChangedAt?: Date;
  passwordResetToken?: String;
  passwordResetExpires?: Date;
  active?: boolean;
}
// MONGODB USER DOCUMENT INTERFACE
// THIS CONTAINS ALL THE FIELDS TO BE PRESENT AS DATA
// IN THE SCHEMA
export interface IUserDocument extends IUser, Document {
  avatar?: string;
  auth0Id?: string;
  streetAdress?: string;
  unitNumber?: number;
  phone?: number;
  start?: number;
}

// MONGODB USER SCHEMA INTERFACE
// THIS EXTENDS THE DOCUMENT AND LISTS METHODS IN THE SCHEMA
export interface IUserSchema extends IUserDocument {
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(user: IUserSchema): Promise<string | undefined>;
}

// MONGODB ORDER SCHEMA INTERFACE
// THIS EXTENDS THE DOCUMENT AND LISTS METHODS IN THE SCHEMA

// A REQUEST INTERFACE WITH THE CORRECT TYPE
// FOR THE BODY INSTEAD OF THE STANDARD FROM EXPRESS
// WHICH IS :any
export interface IRequestWithBody extends Request {
  body: { [key: string]: string | undefined };
}
