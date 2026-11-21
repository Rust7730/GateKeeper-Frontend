export interface Page<T> {
  items: T[];
  page: number; // empieza en 1
  pageSize: number;
  total: number;
}
