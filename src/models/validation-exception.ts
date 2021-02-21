import { ValidationKeyword } from '../enums';

export class ValidationException {
  static readonly STATUS = 400;
  json: any;
  constructor(
    dataPath: string,
    keyword: ValidationKeyword,
    message: string
  ) {
    this.json = { errors: [{ dataPath, message, keyword }] };
  }
}