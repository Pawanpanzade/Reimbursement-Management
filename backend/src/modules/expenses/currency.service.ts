import axios from 'axios';

import { AppError } from '../../utils/app-error';

type ExchangeRateApiResponse = {
  rates?: Record<string, number>;
};

export const getConversionRate = async (
  fromCurrency: string,
  toCurrency: string,
): Promise<number> => {
  const source = fromCurrency.trim().toUpperCase();
  const target = toCurrency.trim().toUpperCase();

  if (!source || !target) {
    throw new AppError(400, 'Currency is required.');
  }

  if (source === target) {
    return 1;
  }

  try {
    const response = await axios.get<ExchangeRateApiResponse>(
      `https://api.exchangerate-api.com/v4/latest/${source}`,
      { timeout: 5000 },
    );

    const rate = response.data.rates?.[target];

    if (!rate) {
      throw new AppError(400, 'Invalid currency.');
    }

    return rate;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(502, 'Failed to fetch currency conversion rate.');
  }
};
