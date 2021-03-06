import { Product } from "../models/productModel";
import { Response } from "express";
import {
  IRequestWithBody,
  IProductDocument,
  IProduct,
  EResponseStatusType,
} from "../utils/types";
import { AppError } from "../utils/AppError";

export const getAllProducts = async (req: IRequestWithBody, res: Response) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      result: EResponseStatusType.success,
      data: {
        results: products.length,
        products,
      },
    });
  } catch (err) {
    res.status(400).json({
      result: EResponseStatusType.fail,
      error: err,
    });
  }
};

export const getOneProduct = async (req: IRequestWithBody, res: Response) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    res.status(200).json({
      result: EResponseStatusType.success,
      data: product,
    });
  } catch (err) {
    res.status(400).json({
      result: EResponseStatusType.fail,
      error: err,
    });
  }
};

export const createProduct = async (req: IRequestWithBody, res: Response) => {
  const productData = req.body;
  try {
    const productData = (req.body as unknown) as IProduct;
    if (productData) {
      const createdProduct = await Product.create(productData);
      res.status(200).json({
        result: EResponseStatusType.success,
        data: createdProduct,
      });
    } else {
    }
  } catch (err) {
    res.status(400).json({
      result: EResponseStatusType.fail,
      error: err.message,
    });
  }
};

export const updateProduct = async (req: IRequestWithBody, res: Response) => {
  const productData: Partial<IProductDocument> = req.body || undefined;
  if (productData) {
    try {
      await Product.updateOne(
        { _id: req.params.id },
        {
          ...productData,
        }
      );

      // Load the document to see the updated value
      const updatedProduct = await Product.findOne({ _id: req.params.id });

      res.status(200).json({
        result: EResponseStatusType.success,
        data: updatedProduct,
      });
    } catch (err) {
      res.status(400).json({
        result: EResponseStatusType.fail,
        error: err,
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

export const deleteProduct = async (req: IRequestWithBody, res: Response) => {
  try {
    const result = await Product.findOneAndDelete({ _id: req.params.id });
    if (result) {
      res.status(200).json({
        result: EResponseStatusType.success,
      });
    } else {
      res.status(404).json({
        result: EResponseStatusType.fail,
        message: "Product not found",
      });
    }
  } catch (err) {
    res.status(400).json({
      result: EResponseStatusType.fail,
      error: err,
    });
  }
};
