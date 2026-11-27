/**
 * Store configuration for Pre Order With Tabsah.
 * Keep default deposit percentage, delivery fees,
 * and store contact details in this single config file.
 * Flutterwave checkout settings live in src/config/flutterwave.ts.
 */

export interface DeliveryZoneFee {
  id: string;
  label: string;
  description: string;
  feeNaira: number;
  estimatedDays: string;
}

export interface BrandThemeTokens {
  primaryPink: string;
  primaryPinkHover: string;
  secondaryPurple: string;
  secondaryPurpleHover: string;
  softPinkTint: string;
  borderPink: string;
  inkDark: string;
  backgroundWhite: string;
}

export interface StoreConfig {
  storeName: string;
  businessName: string;
  currencySymbol: string;
  currencyCode: string;
  upfrontOptions: number[];
  defaultUpfrontPercentage: number;
  depositPercentage: number;
  storeWhatsAppNumber: string;
  storeEmail: string;
  storeAddress: string;
  storeInstagramHandle: string;
  storeInstagramUrl: string;
  brandTheme: BrandThemeTokens;
  deliveryFees: DeliveryZoneFee[];
}

export const STORE_CONFIG: StoreConfig = {
  storeName: 'Pre Order With Tabsah',
  businessName: 'Tabsah Preorder & Importation',
  currencySymbol: '₦',
  currencyCode: 'NGN',
  upfrontOptions: [50, 75, 100],
  defaultUpfrontPercentage: 50,
  depositPercentage: 50,
  storeWhatsAppNumber: '+2349020059393',
  storeEmail: 'toluwalopeesther80@gmail.com',
  storeAddress: 'House 91, Abuja Estate, Aleke, Ikorodu, Lagos State',
  storeInstagramHandle: '@tabsahs_holdings',
  storeInstagramUrl: 'https://www.instagram.com/tabsahs_holdings',
  brandTheme: {
    primaryPink: '#E8005F',
    primaryPinkHover: '#C4004F',
    secondaryPurple: '#52005C',
    secondaryPurpleHover: '#3D0045',
    softPinkTint: '#FFF1F6',
    borderPink: '#F0D9E3',
    inkDark: '#222222',
    backgroundWhite: '#FFFFFF',
  },
  deliveryFees: [
    {
      id: 'lagos-island',
      label: 'Lagos Island (Lekki, VI, Ikoyi, Ajah)',
      description: 'Same day or next day dispatch once your batch arrives in Lagos.',
      feeNaira: 4500,
      estimatedDays: '1 to 2 working days after arrival',
    },
    {
      id: 'lagos-mainland',
      label: 'Lagos Mainland (Ikeja, Surulere, Yaba, Gbagada)',
      description: 'Doorstep courier delivery across all Lagos Mainland areas.',
      feeNaira: 3500,
      estimatedDays: '1 to 2 working days after arrival',
    },
    {
      id: 'abuja-ph',
      label: 'Abuja & Port Harcourt',
      description: 'Tracked interstate express delivery to your doorstep or pickup park.',
      feeNaira: 6500,
      estimatedDays: '2 to 4 working days after arrival',
    },
    {
      id: 'nationwide',
      label: 'Other Nigerian States (Ibadan, Enugu, Kano, Benin, Others)',
      description: 'Reliable nationwide logistics to all 36 states.',
      feeNaira: 7500,
      estimatedDays: '3 to 5 working days after arrival',
    },
  ],
};
