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
  styleUrl: './dashboard.component.css',
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
  draggedNote: Note | null = null;
  newFolderName = '';
  newParentFolderId: number | null = null;


  constructor(
    private authService: AuthService,
    private notesService: NotesService,
    private foldersService: FoldersService,
    private router: Router
  ) {}

  ngOnInit(): void {
  this.loadUserData();

  // Load notes
  this.loadNotes().subscribe(notes => {
    this.notes = notes;
    this.loading = false;

    if (this.notes.length > 0) {
      this.selectedNote = this.notes[0];
      this.isCreatingNote = false;
    } else {
      this.selectedNote = null;
      this.isCreatingNote = true;
    }
  });

  // 🔥 Subscribe to folder updates
  this.foldersService.folders$.subscribe(folders => {
    this.folders = folders;
  });

  // 🔥 Load folders initially
  this.foldersService.refreshFolders();

  // User subscription
  this.authService.currentUser$.subscribe((user) => {
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
      },
    });
  }

 private loadNotes() {
  return this.notesService.getAllNotes().pipe(
  );
}
onDragStart(note: Note) {
  this.draggedNote = note;
}

onDragEnd() {
  this.draggedNote = null;
}

onFolderDragOver(event: DragEvent) {
  event.preventDefault(); // Needed for drop to work
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
    next: () => {

      console.log("✔ Note moved to folder:", folder);

      // REFRESH notes so UI updates
      this.loadNotes();

      // Stay inside the folder you dropped into
      this.selectedFolder = folder;

      // Clear drag state
      this.draggedNote = null;
    },
    error: err => console.error("Move failed:", err)
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
      },
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

  onNoteSaved(note: Note) {
  this.notesService.getAllNotes().subscribe({
    next: (notes) => {
      this.notes = notes;

      // Find the newly created note in the list
      const saved = this.notes.find(n => n.note_id === note.note_id);

      this.selectedNote = saved || note; // fallback if needed
      this.isCreatingNote = false;
    },
    error: (err) => console.error(err)
  });
}
onCreateFolder() {
  const folderName = prompt("Enter folder name:");

  if (!folderName?.trim()) return;

  const parentId = this.selectedFolder ? this.selectedFolder.folder_id : undefined;

  this.foldersService.createFolder({
    folder_name: folderName.trim(),
    parent_folder_id: parentId
  }).subscribe({
    next: (createdFolder) => {
      console.log("Folder created:", createdFolder);
      // Automatically refreshes due to service refreshFolders()
    },
    error: (err) => {
      console.error("Error creating folder:", err);
      alert("Folder creation failed");
    }
  });
}

getFolderDepth(id: number): number {
  let depth = 0;
  let folder = this.folders.find(f => f.folder_id === id);

  while (folder && folder.parent_folder_id) {
    depth++;
    folder = this.folders.find(f => f.folder_id === folder!.parent_folder_id);
  }

  return depth;
}

getFolderPath(id: number): string {
  const folder = this.folders.find(f => f.folder_id === id);
  if (!folder) return '';

  if (!folder.parent_folder_id) return folder.folder_name;

  return this.getFolderPath(folder.parent_folder_id) + ' / ' + folder.folder_name;
}



  onNoteDeleted() {

  this.loadNotes().subscribe(notes => {
    this.notes = notes;

    const notesInFolder = this.selectedFolder
      ? this.notes.filter(n => n.folder_id === this.selectedFolder!.folder_id)
      : this.notes;

    if (notesInFolder.length > 0) {
      this.selectedNote = notesInFolder[0];
      this.isCreatingNote = false;
    } else {
      this.selectedNote = null;
      this.isCreatingNote = true;
    }
  });
}



  onFolderSelected(folder: Folder | null): void {
  this.selectedFolder = folder;

  // Filter notes belonging to selected folder
  const notesInFolder = this.notes.filter(n => n.folder_id === folder?.folder_id);

  if (notesInFolder.length > 0) {
    // Folder contains notes → show first
    this.selectedNote = notesInFolder[0];
    this.isCreatingNote = false;
  } else {
    // Folder empty → show New Note screen
    this.selectedNote = null;
    this.isCreatingNote = true;
  }
}


  getFilteredNotes(): Note[] {
    let filteredNotes = this.notes;

    // Filter by folder
    if (this.selectedFolder) {
      filteredNotes = filteredNotes.filter(
        (note) => note.folder_id === this.selectedFolder!.folder_id
      );
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(
        (note) =>
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
