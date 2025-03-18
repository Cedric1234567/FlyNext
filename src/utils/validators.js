/**
 * This code was egenerated with the help of ChatGPT to validate a users 
 * credit card information.
 */

// Validate card number using Luhn algorithm
export function validateCard(cardNumber, expiryDate, cvv) {
    if (!isValidCardNumber(cardNumber)) {
      return false;
    }
  
    const [month, year] = expiryDate.split('/').map((part) => part.trim());
    const expiryMonth = parseInt(month, 10);
    const expiryYear = parseInt(year, 10);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
  
    if (
      expiryMonth < 1 ||
      expiryMonth > 12 ||
      expiryYear < currentYear ||
      (expiryYear === currentYear && expiryMonth < currentMonth)
    ) {
      return false;
    }
  
    // Validate CVV (should be 3 digits for Visa/MasterCard, 4 digits for AMEX)
    if (cvv.length !== 3 && cvv.length !== 4) {
      return false;
    }
  
    return true;
  }
  
  // Luhn Algorithm to check card number validity
  function isValidCardNumber(cardNumber) {
    const regex = /^[0-9]{13,19}$/;
    if (!regex.test(cardNumber)) {
      return false;
    }
  
    let sum = 0;
    let shouldDouble = false;
  
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
  
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
  
      sum += digit;
      shouldDouble = !shouldDouble;
    }
  
    return sum % 10 === 0;
  }
  