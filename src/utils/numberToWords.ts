// src/utils/numberToWords.ts

const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 
              'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 
              'seventeen', 'eighteen', 'nineteen'];

const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function convertChunk(num: number): string {
  let str = '';
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += tens[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + ones[num % 10] : '') + ' ';
  } else if (num > 0) {
    str += ones[num] + ' ';
  }
  return str.trim();
}

export function numberToBirrWords(amount: number): string {
  if (!amount || amount === 0) return 'Zero birr only';

  const intPart = Math.floor(Math.abs(amount));
  if (intPart === 0) return 'Zero birr only';

  const billions = Math.floor(intPart / 1000000000);
  const millions = Math.floor((intPart % 1000000000) / 1000000);
  const thousands = Math.floor((intPart % 1000000) / 1000);
  const remainder = intPart % 1000;

  let words = '';
  if (billions) words += convertChunk(billions) + ' billion ';
  if (millions) words += convertChunk(millions) + ' million ';
  if (thousands) words += convertChunk(thousands) + ' thousand ';
  if (remainder) words += convertChunk(remainder);

  words = words.trim();
  // Capitalize first letter
  words = words.charAt(0).toUpperCase() + words.slice(1) + ' birr only';
  return words;
}
