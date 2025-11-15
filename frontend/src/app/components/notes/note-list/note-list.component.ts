import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Note } from '../../../services/notes.service';
import { NotesService } from '../../../services/notes.service';
import { Folder } from '../../../services/folders.service';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-note-list',
  imports: [CommonModule, ConfirmationDialogComponent],
  templateUrl: './note-list.component.html',
  styleUrl: './note-list.component.css'
})
export class NoteListComponent {
  @Input() notes: Note[] = [];
  @Input() selectedNote: Note | null = null;
  @Output() noteSelected = new EventEmitter<Note>();
  @Output() noteDeleted = new EventEmitter<void>();
  draggedNote: Note | null = null;
  
  // Confirmation dialog state
  showDeleteDialog = false;
  noteToDelete: Note | null = null;
  constructor(private notesService: NotesService) {}

  onNoteClick(note: Note): void {
    this.noteSelected.emit(note);
  }

  onDeleteNote(event: Event, note: Note): void {
    event.stopPropagation();
    
    // Show confirmation dialog
    this.noteToDelete = note;
    this.showDeleteDialog = true;
  }
  
  confirmDeleteNote(): void {
    if (!this.noteToDelete) return;
    
    this.notesService.deleteNote(this.noteToDelete.note_id).subscribe({
      next: () => {
        this.showDeleteDialog = false;
        this.noteToDelete = null;
        this.noteDeleted.emit();
      },
      error: (error) => {
        console.error('Error deleting note:', error);
        this.showDeleteDialog = false;
        this.noteToDelete = null;
        alert('Failed to delete note. Please try again.');
      }
    });
  }
  
  cancelDeleteNote(): void {
    this.showDeleteDialog = false;
    this.noteToDelete = null;
  }
  
  getDeleteMessage(): string {
    if (!this.noteToDelete) return 'Are you sure you want to delete this note?';
    return `Are you sure you want to delete "${this.noteToDelete.note_title}"?`;
  }
  onDragStart(note: Note) {
  this.draggedNote = note;
}

onDragEnd() {
  this.draggedNote = null;
}

onFolderDragOver(event: DragEvent) {
  event.preventDefault(); // Required to allow dropping
}

onFolderDrop(folder: Folder | null) {
  event?.preventDefault();

  if (!this.draggedNote) return;

  const targetFolderId = folder ? folder.folder_id : undefined;

  this.notesService.updateNote(this.draggedNote.note_id, {
    note_title: this.draggedNote.note_title,
    note_content: this.draggedNote.note_content,
    folder_id: targetFolderId
  }).subscribe({
    next: (updatedNote) => {
      // Immediately update front-end list
      const idx = this.notes.findIndex(n => n.note_id === updatedNote.note_id);
      if (idx !== -1) this.notes[idx] = updatedNote;

      this.draggedNote = null;
    },
    error: err => console.error("Move failed:", err)
  });
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
