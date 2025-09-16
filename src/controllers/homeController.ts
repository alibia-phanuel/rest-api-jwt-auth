import { Request, Response } from "express";

export const getHome = (req: Request, res: Response) => {
  res.send(
    "REST API Authentication and Authorization - Explanation + Full Node.js Tutorial"
  );
};
