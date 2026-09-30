// Philippine tax rules used by the calculators. Every figure here should be
// re-checked against current BIR issuances before each filing season.

// NIRC Sec. 109(CC) as amended by TRAIN: VAT registration threshold.
export const VAT_THRESHOLD = 3_000_000_00;

// NIRC Sec. 24(A)(2)(b): 8% option, first ₱250,000 exempt for purely
// self-employed individuals and professionals (not for mixed-income earners).
export const EIGHT_PERCENT_RATE = 0.08;
export const EIGHT_PERCENT_EXEMPTION = 250_000_00;

// NIRC Sec. 34(L): Optional Standard Deduction for individuals, 40% of gross sales/receipts.
export const OSD_RATE = 0.4;

// NIRC Sec. 24(A)(2)(a) graduated rates, effective January 1, 2023 (TRAIN second schedule).
// [lower bound, base tax, marginal rate on the excess over lower bound], in centavos.
export const GRADUATED_2023 = [
  [8_000_000_00, 2_202_500_00, 0.35],
  [2_000_000_00, 402_500_00, 0.3],
  [800_000_00, 102_500_00, 0.25],
  [400_000_00, 22_500_00, 0.2],
  [250_000_00, 0, 0.15],
  [0, 0, 0],
];

export const FIRST_SUPPORTED_YEAR = 2023;

// NIRC Sec. 116 percentage tax for non-VAT persons. CREATE Act cut it to 1%
// from July 1, 2020 to June 30, 2023; it has been 3% since July 1, 2023.
export function percentageTaxRate(isoDate) {
  return isoDate >= '2020-07-01' && isoDate <= '2023-06-30' ? 0.01 : 0.03;
}

// RR 8-2024 (EOPT) taxpayer classification by gross sales.
export const CLASSIFICATIONS = [
  { id: 'large', min: 1_000_000_000_00, label: 'Large' },
  { id: 'medium', min: 20_000_000_00, label: 'Medium' },
  { id: 'small', min: 3_000_000_00, label: 'Small' },
  { id: 'micro', min: 0, label: 'Micro' },
];

// NIRC Secs. 248-249 as amended by EOPT: reduced surcharge and interest for
// micro and small taxpayers.
export const PENALTY_RATES = {
  micro: { surcharge: 0.1, annualInterest: 0.06 },
  small: { surcharge: 0.1, annualInterest: 0.06 },
  medium: { surcharge: 0.25, annualInterest: 0.12 },
  large: { surcharge: 0.25, annualInterest: 0.12 },
};
