import fs from "node:fs";
import { PASTORS_INFO_PATH } from "../config.js";

/** @returns {Array<{id:number,name:string,title:string,location:string}>} */
export function getPastors() {
  try {
    const raw = fs.readFileSync(PASTORS_INFO_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data.pastors) ? data.pastors : [];
  } catch {
    return [];
  }
}

/** @param {number} id */
export function getPastorById(id) {
  const numericId = Number.parseInt(id, 10);
  if (Number.isNaN(numericId)) return null;
  return getPastors().find((p) => p.id === numericId) ?? null;
}
