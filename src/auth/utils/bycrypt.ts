import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;

const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, saltOrRounds);
};

const comparePasswords = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export { hashPassword, comparePasswords };
