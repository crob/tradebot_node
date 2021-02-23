import { Exception } from '@tsed/exceptions';
import { ValidationKeyword } from '../enums';

export class ValidationException extends Exception {
  static readonly STATUS = 400;
  constructor(
    dataPath: string,
    keyword: ValidationKeyword,
    message: string,
    origin?: Error | string | any
  ) {
    super(
      ValidationException.STATUS,
      JSON.stringify({ errors: [{ dataPath, message, keyword }] }),
      origin
    );
  }
}

export interface ValidationError {
  field: string;
  message: string;
}