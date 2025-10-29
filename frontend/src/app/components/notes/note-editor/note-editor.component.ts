import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Note, NotesService } from '../../../services/notes.service';
import { Folder } from '../../../services/folders.service';

@Component({
  selector: 'app-note-editor',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.css'
})
export class NoteEditorComponent implements OnChanges {
  @Input() note: Note | null = null;
  @Input() isCreating: boolean = false;
  @Input() folders: Folder[] = [];
  @Output() noteSaved = new EventEmitter<Note>();
  @Output() noteDeleted = new EventEmitter<void>();

  noteForm: FormGroup;
  loading = false;
  error = '';
  autoSaveTimer: any;

  constructor(
    private fb: FormBuilder,
    private notesService: NotesService
  ) {
    this.noteForm = this.fb.group({
      note_title: ['', [Validators.required]],
      note_content: [''],
      folder_id: [null]
    });

    // Auto-save after 2 seconds of inactivity
    this.noteForm.valueChanges.subscribe(() => {
      if (this.note && !this.isCreating) {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
          this.saveNote();
        }, 2000);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['note'] || changes['isCreating']) {
      this.loadNoteData();
    }
  }

  private loadNoteData(): void {
    if (this.note && !this.isCreating) {
      this.noteForm.patchValue({
        note_title: this.note.note_title,
        note_content: this.note.note_content,
        folder_id: this.note.folder_id
      });
    } else if (this.isCreating) {
      this.noteForm.reset();
    }
    this.error = '';
  }

  saveNote(): void {
    if (this.noteForm.invalid || this.loading) return;

    this.loading = true;
    this.error = '';

    const noteData = this.noteForm.value;

    if (this.isCreating) {
      this.notesService.createNote(noteData).subscribe({
        next: (savedNote) => {
          this.noteSaved.emit(savedNote);
          this.loading = false;
        },
        error: (error) => {
          this.error = error.error?.error || 'Failed to create note';
          this.loading = false;
        }
      });
    } else if (this.note) {
      this.notesService.updateNote(this.note.note_id, noteData).subscribe({
        next: (updatedNote) => {
          this.noteSaved.emit(updatedNote);
          this.loading = false;
        },
        error: (error) => {
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
          this.noteDeleted.emit();
        },
        error: (error) => {
          this.error = error.error?.error || 'Failed to delete note';
        }
      });
    }
  }

  get title() { return this.noteForm.get('note_title'); }
  get content() { return this.noteForm.get('note_content'); }
  get folderId() { return this.noteForm.get('folder_id'); }

  getWordCount(): number {
    const content = this.noteForm.get('note_content')?.value || '';
    return content.trim().split(/\s+/).filter((word: string) => word.length > 0).length;
  }

  getCharCount(): number {
    return this.noteForm.get('note_content')?.value?.length || 0;
  }
}
