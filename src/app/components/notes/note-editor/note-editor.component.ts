import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note, NotesService } from '../../../services/notes.service';
import { Folder } from '../../../services/folders.service';

interface NoteForm {
  note_title: string;
  note_content: string;
  folder_id: number | undefined;
}

@Component({
  selector: 'app-note-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.css'
})
export class NoteEditorComponent implements OnChanges {
  @Input() note: Note | null = null;
  @Input() isCreating: boolean = false;
  @Input() folders: Folder[] = [];
  @Output() noteSaved = new EventEmitter<Note>();
  @Output() noteDeleted = new EventEmitter<void>();

  noteForm: NoteForm = {
    note_title: '',
    note_content: '',
    folder_id: undefined
  };
  
  loading = false;
  error = '';
  isEditing = false;
  autoSaveTimer: any;

  constructor(private notesService: NotesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['note'] || changes['isCreating']) {
      this.loadNoteData();
    }
  }

  private loadNoteData(): void {
    if (this.note && !this.isCreating) {
      this.noteForm = {
        note_title: this.note.note_title,
        note_content: this.note.note_content,
        folder_id: this.note.folder_id
      };
      this.isEditing = false;
    } else if (this.isCreating) {
      this.noteForm = {
        note_title: '',
        note_content: '',
        folder_id: undefined
      };
      this.isEditing = true;
    }
    this.error = '';
  }

  startEditing(): void {
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.loadNoteData();
    this.isEditing = false;
  }

  saveNote(): void {
    if (!this.noteForm.note_title.trim() || this.loading) {
      this.error = 'Please enter a title for your note';
      return;
    }

    this.loading = true;
    this.error = '';

    console.log('Saving note:', this.noteForm);

    const noteData = { ...this.noteForm };

    if (this.isCreating) {
      this.notesService.createNote(noteData).subscribe({
        next: (savedNote) => {
          console.log('Note created successfully:', savedNote);
          this.noteSaved.emit(savedNote);
          this.loading = false;
          this.isEditing = false;
        },
        error: (error) => {
          console.error('Error creating note:', error);
          this.error = error.error?.error || 'Failed to create note';
          this.loading = false;
        }
      });
    } else if (this.note) {
      this.notesService.updateNote(this.note.note_id, noteData).subscribe({
        next: (updatedNote) => {
          console.log('Note updated successfully:', updatedNote);
          this.noteSaved.emit(updatedNote);
          this.loading = false;
          this.isEditing = false;
        },
        error: (error) => {
          console.error('Error updating note:', error);
          this.error = error.error?.error || 'Failed to update note';
          this.loading = false;
        }
      });
    }
  }

  deleteNote(): void {
    if (!this.note) return;

    if (confirm(`Are you sure you want to delete "${this.note.note_title}"?`)) {
      this.notesService.deleteNote(this.note.note_id).subscribe({
        next: () => {
          console.log('Note deleted successfully');
          this.noteDeleted.emit();
        },
        error: (error) => {
          console.error('Error deleting note:', error);
          this.error = error.error?.error || 'Failed to delete note';
        }
      });
    }
  }

  onContentChange(): void {
    if (this.isEditing && this.note && !this.isCreating) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = setTimeout(() => {
        this.autoSave();
      }, 2000);
    }
  }

  private autoSave(): void {
    if (!this.isEditing || !this.note || this.isCreating) {
      return;
    }

    const noteData = { ...this.noteForm };
    this.notesService.updateNote(this.note.note_id, noteData).subscribe({
      next: () => {
        console.log('Auto-saved note');
      },
      error: (error) => {
        console.error('Auto-save failed:', error);
      }
    });
  }

  getWordCount(): number {
    const content = this.noteForm.note_content || '';
    return content.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
  }

  getCharCount(): number {
    return this.noteForm.note_content?.length || 0;
  }
}
