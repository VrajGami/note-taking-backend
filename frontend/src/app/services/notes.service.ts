import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface Note {
  note_id: number;
  note_title: string;
  note_content: string;
  folder_id?: number;
  folder_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteRequest {
  note_title: string;
  note_content: string;
  folder_id?: number;
}

export interface UpdateNoteRequest {
  note_title: string;
  note_content: string;
  folder_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private readonly API_URL = 'http://localhost:3000/api';
  private notesSubject = new BehaviorSubject<Note[]>([]);
  public notes$ = this.notesSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllNotes(): Observable<Note[]> {
    return this.http.get<Note[]>(`${this.API_URL}/notes`)
      .pipe(
        tap(notes => this.notesSubject.next(notes))
      );
  }

  getNoteById(id: number): Observable<Note> {
    return this.http.get<Note>(`${this.API_URL}/notes/${id}`);
  }

  createNote(note: CreateNoteRequest): Observable<Note> {
    return this.http.post<Note>(`${this.API_URL}/notes`, note)
      .pipe(
        tap(() => this.refreshNotes())
      );
  }

  updateNote(id: number, note: UpdateNoteRequest): Observable<Note> {
    return this.http.put<Note>(`${this.API_URL}/notes/${id}`, note)
      .pipe(
        tap(() => this.refreshNotes())
      );
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/notes/${id}`)
      .pipe(
        tap(() => this.refreshNotes())
      );
  }

  private refreshNotes(): void {
    this.getAllNotes().subscribe();
  }

  // Helper methods for local state management
  getCurrentNotes(): Note[] {
    return this.notesSubject.value;
  }

  filterNotesByFolder(folderId: number | null): Note[] {
    const notes = this.getCurrentNotes();
    if (folderId === null) {
      return notes.filter(note => !note.folder_id);
    }
    return notes.filter(note => note.folder_id === folderId);
  }

  searchNotes(query: string): Note[] {
    const notes = this.getCurrentNotes();
    const searchTerm = query.toLowerCase();
    return notes.filter(note => 
      note.note_title.toLowerCase().includes(searchTerm) ||
      note.note_content.toLowerCase().includes(searchTerm)
    );
  }
}