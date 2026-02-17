
export interface Book {
  id: string;
  title: string;
  startDate: string; // ISO string YYYY-MM-DD
  startPage: number;
  pagesPerDay: number;
}

export interface UserProfile {
  name: string;
  habitStartDate: string; // ISO string YYYY-MM-DD
}

export interface AppState {
  profile: UserProfile;
  books: Book[];
}
