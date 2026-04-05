import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  data: {
    message: string;
    lead_saved: boolean;
    lead_id: number | null;
  };
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly apiUrl = `${environment.apiUrl}/chat`;

  // State con Signals
  private _messages = signal<ChatMessage[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy el asistente de **Estudio Lumina** 📷 ¿En qué puedo ayudarte hoy? Puedo informarte sobre nuestros servicios de fotografía de bodas, retratos familiares o eventos corporativos.',
      timestamp: new Date(),
    },
  ]);

  private _isTyping = signal<boolean>(false);
  private _leadCaptured = signal<boolean>(false);

  // Signals públicos (readonly)
  readonly messages = this._messages.asReadonly();
  readonly isTyping = this._isTyping.asReadonly();
  readonly leadCaptured = this._leadCaptured.asReadonly();

  readonly historyForApi = computed(() =>
    this._messages()
      .filter(m => m.role !== 'assistant' || !m.content.startsWith('¡Hola!'))
      .map(({ role, content }) => ({ role, content }))
  );

  constructor(private http: HttpClient) {}

  sendMessage(userMessage: string): void {
    if (!userMessage.trim() || this._isTyping()) return;

    // Añadir mensaje del usuario
    this._messages.update(msgs => [
      ...msgs,
      { role: 'user', content: userMessage, timestamp: new Date() },
    ]);

    this._isTyping.set(true);

    const payload = {
      message: userMessage,
      history: this.historyForApi(),
    };

    this.http.post<ChatResponse>(this.apiUrl, payload).subscribe({
      next: (res) => {
        this._messages.update(msgs => [
          ...msgs,
          {
            role: 'assistant',
            content: res.data.message,
            timestamp: new Date(),
          },
        ]);

        if (res.data.lead_saved) {
          this._leadCaptured.set(true);
        }

        this._isTyping.set(false);
      },
      error: () => {
        this._messages.update(msgs => [
          ...msgs,
          {
            role: 'assistant',
            content: 'Lo siento, ha ocurrido un error técnico. Por favor, inténtalo de nuevo en unos momentos.',
            timestamp: new Date(),
          },
        ]);
        this._isTyping.set(false);
      },
    });
  }
}
