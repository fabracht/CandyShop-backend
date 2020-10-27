import { Order } from "../models/orderModel";
import { Schema } from "mongoose";
import { Product } from "../models/productModel";
import e, { NextFunction, Response } from "express";
import {
  IRequestWithBody,
  IOrder,
  IBox,
  IProduct,
  IProductSchema,
  IBoxResponse,
  IOrderResponse,
} from "../utils/types";
import { AppError } from "../utils/AppError";

export const createOrder = async (
  req: IRequestWithBody,
  res: Response,
  next: NextFunction
) => {
  const { user, nOfItems, totalCost, products } = req.body;
  let orderData: IOrder;

  // IF USER, NOFITEMS, TOTALCOST AND PRODUCTS ARE DEFINED
  // THIS VALIDATES THE INPUT
  if (user && nOfItems && totalCost && products) {
    const prodArray = Array.from(products);
    const prodParsed: IBox[] = prodArray.map((el: Object) => {
      return el as IBox;
    });
    // PARSE PRODUCT ID TO OBJECTID
    const promAll = Promise.all(
      prodParsed.map(async (box) => {
        console.log("Finding products");
        try {
          const res = await Product.find(
            { _id: box.productId },
            (err, prod) => {
              if (prod.length === 0) {
                return;
              }
              return prod;
            }
          );
          return res;
        } catch (err) {
          console.log(err);
        }
        return res;
      })
    );

    // THIS IS THE ORDER DATA OBJECT
    orderData = {
      userId: user,
      nOfItems: parseInt(nOfItems),
      totalCost: parseFloat(totalCost),
      productList: prodParsed,
    };
    // console.log(orderData);
    // CREATE THE ORDER IN THE DB
    try {
      const order = await Order.create(orderData);
      res.status(200).send(order);
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err,
      });
    }
  } else {
    res.status(500).send("Something is wrong with the Request");
  }
};

export const getOrders = async (
  req: IRequestWithBody,
  res: Response,
  next: NextFunction
) => {
  // RETRIEVE THE USER ID
  const userId = req.params.id;
  if (userId) {
    // FIND THE ORDERS FOR THAT USER
    try {
      const result = await Order.find({
        userId,
      }).exec();
      // THIS IS A SET OF PRODUCT IDS RETRIEVED FROM THE ORDER
      let t = new Set<string>();
      for (let order of result) {
        for (let box of order.productList) {
          t.add(`${box.productId}`);
        }
      }
      // USE THE PRODUCT IDS TO RETRIEVE THE PRODUCTS
      const ids = Array.from(t);
      const prodL = await Promise.all(
        ids.map(async (id) => {
          const res = await Product.find({ _id: id });
          return res[0];
        })
      );

      // RETRIEVE PRODUCT LISTS FROM EACH ORDER
      const [...productList] = result.map((el) => el.productList);
      // MAP THE PRODUCT LISTS AND RETURN THE PRODUCTS DESCRIPTIONS AS AN ARRAY OF ARRAYS OF PRODUCTS
      const replProductList = productList.map((el) =>
        el.map((iel) => {
          const product = prodL.filter(
            (iiel) => `${iiel._id}` === `${iel.productId}`
          );
          return product[0];
        })
      );

      const te = result.map((el, i) => {
        const pl = replProductList[i];
        const plB: IBoxResponse[] = pl.map((el, ii) => {
          return {
            productName: el.name,
            productPrice: el.price,
            quantity: productList[i][ii].quantity,
          };
        });
        const resp: IOrderResponse = {
          userId: el.userId,
          nOfItems: el.nOfItems,
          productList: plB,
          totalCost: el.totalCost,
        };
        return resp;
      });
      console.log(te);
      res.status(200).json({
        result: "success",
        data: {
          orders: te,
          products: prodL,
        },
      });
    } catch (err) {
      res.status(500).json({
        result: "fail",
        message: "Can't get order",
      });
    }
  } else {
    res.status(500).json({
      result: "fail",
      message: "Something wrong with the request",
    });
  }
};
