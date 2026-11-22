import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { specification } from "../utils/specification";

export const specController = {
  getApiSpecification: catchAsync(
    async (_req: Request, res: Response): Promise<void> => {
      res.status(200).json(specification);
    },
  ),
};
