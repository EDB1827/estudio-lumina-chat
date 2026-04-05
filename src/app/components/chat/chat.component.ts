import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('scrollAnchor') private scrollAnchor!: ElementRef;

  chatService = inject(ChatService);
  userInput = signal<string>('');

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }
  private scrollToBottom(): void {
  try {
    this.scrollAnchor.nativeElement.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    // Si falla porque aún no se ha cargado la vista, no pasa nada
  }
}

  send(): void {
    const msg = this.userInput().trim();
    if (!msg) return;
    this.userInput.set('');
    this.chatService.sendMessage(msg);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  // Parseo simple de negritas **texto**
  parseMarkdown(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }
}
