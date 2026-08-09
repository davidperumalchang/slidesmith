import { asyncHandler } from "../utils/asyncHandler.js";
import { getPastors } from "../services/pastors.js";

export const listPastors = asyncHandler(async (_req, res) => {
  res.json({ pastors: getPastors() });
});
