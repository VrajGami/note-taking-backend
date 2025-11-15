import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Note, NotesService } from '../../../services/notes.service';
import { Folder } from '../../../services/folders.service';
import { ChangeDetectorRef } from '@angular/core';
import { ConfirmationDialogComponent } from '../../shared/confirmation-dialog/confirmation-dialog.component';

declare var webkitSpeechRecognition: any;
interface NoteForm {
  note_title: string;
  note_content: string;
  folder_id: number | undefined;
}

@Component({
  selector: 'app-note-editor',
  imports: [CommonModule, FormsModule, ConfirmationDialogComponent],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.css'
})
export class NoteEditorComponent implements OnChanges {
  @Input() note: Note | null = null;
  @ViewChild('titleInput') titleInput!: ElementRef;

  @Input() isCreating: boolean = false;
  @Input() folders: Folder[] = [];
  @Output() noteSaved = new EventEmitter<Note>();
  @Output() noteDeleted = new EventEmitter<void>();
  @Input() selectedFolder: Folder | null = null;

  isRecording = false;
  recognition: any;

  

  noteForm: NoteForm = {
    note_title: '',
    note_content: '',
    folder_id: undefined
  };
  
  loading = false;
  error = '';
  isEditing = false;
  autoSaveTimer: any;
  selectedNote: Note | null = null;
  liveInterim = '';
  
  // Confirmation dialog state
  showDeleteDialog = false;


  constructor(private notesService: NotesService,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (SpeechRecognition) {
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = true;
    this.recognition.interimResults = true; // 🔥 LIVE TRANSCRIPTION ENABLED

    // 🔥 THIS IS WHERE YOUR LIVE TRANSCRIPTION LOGIC GOES
    this.recognition.onresult = (event: any) => {
  const resultIndex = event.resultIndex;
  const result = event.results[resultIndex];

  if (!result) return;

  const transcript = result[0].transcript.trim();

  if (result.isFinal) {
    // Add final text once
    this.noteForm.note_content += ' ' + transcript;
    this.liveInterim = '';
  } else {
    // Show live text
    this.liveInterim = transcript;
  }

  // Update UI immediately
  this.cdr.detectChanges();
};


    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isRecording = false;
    };

    this.recognition.onend = () => {
    console.log("⛔ speech ended");
    this.isRecording = false;

    // 🔥 Commit the interim live text to actual content
    if (this.liveInterim.trim()) {
      this.noteForm.note_content += ' ' + this.liveInterim;
    }

    this.liveInterim = '';
  };

  }
}



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['note'] || changes['isCreating']) {
      this.loadNoteData();
    }
    
  }

  commitInterim() {
  if (this.liveInterim.trim()) {
    this.noteForm.note_content += ' ' + this.liveInterim;
    this.liveInterim = '';
  }
}


  onNoteDeleted() {
  // When a note is deleted, show the New Note screen
  this.selectedNote = null;
  this.isCreating = true;
}
startCreatingNote() {
  this.selectedNote = null;
  this.isCreating = true;
}
selectNote(note: Note) {
  this.selectedNote = note;
  this.isCreating = false;   // Editing mode
}
  toggleRecording() {
    if (!this.recognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    if (this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    } else {
      this.recognition.start();
      this.isRecording = true;
    }
  }

  onTextChanged(event: any) {
    this.noteForm.note_content = event.target.value;
  }




 private loadNoteData(): void {
  if (this.note && !this.isCreating) {
    // Edit existing note
    this.noteForm = {
      note_title: this.note.note_title,
      note_content: this.note.note_content,
      folder_id: this.note.folder_id
    };
    this.isEditing = false;

  } else if (this.isCreating) {
    // Create new note
    this.noteForm = {
      note_title: '',
      note_content: '',
      folder_id: this.selectedFolder?.folder_id ?? undefined
    };
    this.isEditing = true;

    // 🔥 Focus on title input
    setTimeout(() => {
      this.titleInput?.nativeElement?.focus();
    }, 0);
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
  
  // Show confirmation dialog
  this.showDeleteDialog = true;
}

confirmDeleteNote(): void {
  if (!this.note) return;

  this.notesService.deleteNote(this.note.note_id).subscribe({
    next: () => {
      console.log('Note deleted successfully');
      
      // Close dialog
      this.showDeleteDialog = false;

      // Reset UI immediately
      this.clearEditor();

      // Then notify parent
      this.noteDeleted.emit();
    },
    error: (error) => {
      console.error('Error deleting note:', error);
      this.showDeleteDialog = false;
      this.error = error.error?.error || 'Failed to delete note';
    }
  });
}

cancelDeleteNote(): void {
  this.showDeleteDialog = false;
}

getDeleteMessage(): string {
  if (!this.note) return 'Are you sure you want to delete this note?';
  return `Are you sure you want to delete "${this.note.note_title}"?`;
}

private clearEditor(): void {
  this.note = null;
  this.noteForm = {
    note_title: '',
    note_content: '',
    folder_id: undefined
  };
  this.isEditing = false;
  this.error = '';
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
