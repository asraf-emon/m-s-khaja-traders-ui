export const shop = {
  name: 'M/S Khaja Traders',
  address: 'Khaja Vila, Tongi Bazar, Kachari Road, Arot Potti, Tongi, Gazipur-1710, Bangladesh',
  phones: ['01711610784', '02-9801596'],
  facebook: 'https://www.facebook.com/KhajaTraders/',
} as const;

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const UNITS = ['kg', 'gram', 'liter', 'piece', 'box', 'carton', 'packet', 'dozen', 'bag'] as const;

export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'credit_card', 'debit_card', 'bkash', 'nagad', 'rocket', 'stripe'] as const;

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

export const DISTRICTS = [
  'Gazipur', 'Dhaka', 'Narayanganj', 'Narsingdi', 'Tangail', 'Mymensingh', 'Kishoreganj',
  'Manikganj', 'Munshiganj', 'Faridpur', 'Rajshahi', 'Chattogram', 'Sylhet', 'Khulna', 'Barishal', 'Rangpur',
];
