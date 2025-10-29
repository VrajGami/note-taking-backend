import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { NotesService, Note } from '../../services/notes.service';
import { FoldersService, Folder } from '../../services/folders.service';
import { NoteListComponent } from '../notes/note-list/note-list.component';
import { NoteEditorComponent } from '../notes/note-editor/note-editor.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, NoteListComponent, NoteEditorComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  notes: Note[] = [];
  folders: Folder[] = [];
  selectedNote: Note | null = null;
  selectedFolder: Folder | null = null;
  isCreatingNote = false;
  searchQuery = '';
  loading = true;

  constructor(
    private authService: AuthService,
    private notesService: NotesService,
    private foldersService: FoldersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadNotes();
    this.loadFolders();
    
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  private loadUserData(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: () => {
        this.logout();
      }
    });
  }

  private loadNotes(): void {
    this.notesService.getAllNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notes:', error);
        this.loading = false;
      }
    });
  }

  private loadFolders(): void {
    this.foldersService.getAllFolders().subscribe({
      next: (folders) => {
        this.folders = folders;
      },
      error: (error) => {
        console.error('Error loading folders:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Force logout even if API call fails
        this.router.navigate(['/login']);
      }
    });
  }

  onNoteSelected(note: Note): void {
    this.selectedNote = note;
    this.isCreatingNote = false;
  }

  onNewNote(): void {
    this.selectedNote = null;
    this.isCreatingNote = true;
  }

  onNoteSaved(note: Note): void {
    this.loadNotes(); // Refresh notes list
    this.selectedNote = note;
    this.isCreatingNote = false;
  }

  onNoteDeleted(): void {
    this.loadNotes(); // Refresh notes list
    this.selectedNote = null;
    this.isCreatingNote = false;
  }

  onFolderSelected(folder: Folder | null): void {
    this.selectedFolder = folder;
  }

  getFilteredNotes(): Note[] {
    let filteredNotes = this.notes;

    // Filter by folder
    if (this.selectedFolder) {
      filteredNotes = filteredNotes.filter(note => note.folder_id === this.selectedFolder!.folder_id);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(note =>
        note.note_title.toLowerCase().includes(query) ||
        note.note_content.toLowerCase().includes(query)
      );
    }

    return filteredNotes;
  }

  onSearchChange(event: any): void {
    this.searchQuery = event.target.value;
  }
}
