import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'

@Injectable({
  providedIn: 'root'
})
export class DiscordService {

  private readonly suggestionsWebhook: string = "https://discordapp.com/api/webhooks/759094003634405386/cq2yX71N-docLvzpCTsyfDC6e_k5plgWpsFWeXFIvb0mxdC3lOfVQlcVQDqkAxm5izTU";
  constructor(private httpClient: HttpClient) { }

  sendSuggestion(suggestion: string) {
    console.log("Sending Suggestion...");
    const suggestionMessage = {
      username: "Site Suggestions",
      content: suggestion,
    }
    this.httpClient.post(this.suggestionsWebhook, suggestionMessage).subscribe();
  }
}
