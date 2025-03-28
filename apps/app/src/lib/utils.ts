import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBalance(num: number) {
  const numStr = num.toString();

  if (numStr.includes(".")) {
    const [integerPart, decimalPart] = numStr.split(".");
    let startingZeros = 0;
    for (let i = 0; i < decimalPart.length; i++) {
      const curr = decimalPart[i];
      if (curr === "0") {
        startingZeros += 1;
      } else {
        break;
      }
    }
    const trimmedDecimalPart = decimalPart.slice(startingZeros);
    const fixedDecimalPart = Number(`0.${trimmedDecimalPart}`)
      .toFixed(2)
      .toString()
      .split(".")[1];
    return Number(
      `${integerPart}.${
        startingZeros === 0
          ? fixedDecimalPart
          : fixedDecimalPart.padStart(startingZeros + 2, "0")
      }`
    );
  }
  return num;
}
