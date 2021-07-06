export interface SugarTalkResponse<T> {
  code: number;
  message: string;
  data: T;
}
