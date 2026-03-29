import { Prisma, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';

import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../utils/app-error';

const SALT_ROUNDS = 12;

type SignupInput = {
  name: string;
  email: string;
  password: string;
  country: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type SanitizedUser = Omit<User, 'password'>;

type AuthTokenPayload = {
  sub: string;
  companyId: string;
  role: string;
  email: string;
};

type CountryApiResponse = {
  currencies?: Record<string, { name: string; symbol?: string }>;
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const sanitizeUser = (user: User): SanitizedUser => {
  const { password, ...safeUser } = user;
  void password;
  return safeUser;
};

const buildTokenPayload = (user: Pick<User, 'id' | 'companyId' | 'role' | 'email'>): AuthTokenPayload => {
  return {
    sub: user.id,
    companyId: user.companyId,
    role: user.role,
    email: user.email,
  };
};

const generateToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '24h' });
};

const fetchCurrencyCode = async (country: string): Promise<string> => {
  const normalizedCountry = country.trim().toUpperCase();

  try {
    const response = await axios.get<CountryApiResponse[]>(
      `https://restcountries.com/v3.1/alpha/${normalizedCountry}`,
      {
        timeout: 5000,
      },
    );

    const countryData = response.data[0];
    const currencyCode = countryData?.currencies ? Object.keys(countryData.currencies)[0] : undefined;

    if (!currencyCode) {
      throw new AppError(400, 'Unable to determine currency for provided country code.');
    }

    return currencyCode;
  } catch {
    throw new AppError(400, 'Invalid country code.');
  }
};

export const signup = async (input: SignupInput): Promise<{ token: string; user: SanitizedUser; company: { id: string; name: string; currency: string; createdAt: Date } }> => {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const country = input.country.trim();

  if (!name || !email || !password || !country) {
    throw new AppError(400, 'name, email, password and country are required.');
  }

  if (!isValidEmail(email)) {
    throw new AppError(400, 'Invalid email format.');
  }

  if (password.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters long.');
  }

  const currency = await fetchCurrencyCode(country);
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: `${name}'s Company`,
          currency,
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'admin',
          companyId: company.id,
        },
      });

      return { company, user };
    });

    const token = generateToken(buildTokenPayload(result.user));

    return {
      token,
      user: sanitizeUser(result.user),
      company: result.company,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'Email already exists.');
    }

    throw error;
  }
};

export const login = async (input: LoginInput): Promise<{ token: string; user: SanitizedUser }> => {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    throw new AppError(400, 'email and password are required.');
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(401, 'Invalid credentials.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid credentials.');
  }

  const token = generateToken(buildTokenPayload(user));

  return {
    token,
    user: sanitizeUser(user),
  };
};
