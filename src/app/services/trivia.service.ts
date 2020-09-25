import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { TriviaCategoryResponse } from '../models/trivia-category-response';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TriviaService {

  private readonly triviaBaseURL: string = "https://opentdb.com";
  constructor(private httpClient: HttpClient) { }

  getCategories(): Observable<TriviaCategoryResponse> {
    return this.httpClient.get<TriviaCategoryResponse>(`${this.triviaBaseURL}/api_category.php`);
  }
}
