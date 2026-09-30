import { CLASSIFICATIONS } from './rules.js';

export function classifyTaxpayer(grossSales) {
  return CLASSIFICATIONS.find((c) => grossSales >= c.min);
}
