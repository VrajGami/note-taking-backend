import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Note } from '../../../services/notes.service';
import { NotesService } from '../../../services/notes.service';

@Component({
  selector: 'app-note-list',
  imports: [CommonModule],
  templateUrl: './note-list.component.html',
  styleUrl: './note-list.component.css'
})
export class NoteListComponent {
  @Input() notes: Note[] = [];
  @Input() selectedNote: Note | null = null;
  @Output() noteSelected = new EventEmitter<Note>();
  @Output() noteDeleted = new EventEmitter<void>();

  constructor(private notesService: NotesService) {}

  onNoteClick(note: Note): void {
    this.noteSelected.emit(note);
  }

  onDeleteNote(event: Event, note: Note): void {
    event.stopPropagation();
    
    if (confirm(`Are you sure you want to delete "${note.note_title}"?`)) {
      this.notesService.deleteNote(note.note_id).subscribe({
        next: () => {
          this.noteDeleted.emit();
        },
        error: (error) => {
          console.error('Error deleting note:', error);
          alert('Failed to delete note. Please try again.');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 3600);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  truncateContent(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
}
