import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface Folder {
  folder_id: number;
  folder_name: string;
  parent_folder_id?: number;
  user_id: number;
  created_at: string;
}

export interface CreateFolderRequest {
  folder_name: string;
  parent_folder_id?: number;
}

export interface UpdateFolderRequest {
  folder_name: string;
  parent_folder_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FoldersService {
  private readonly API_URL = 'http://localhost:3000/api';
  private foldersSubject = new BehaviorSubject<Folder[]>([]);
  public folders$ = this.foldersSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllFolders(): Observable<Folder[]> {
    return this.http.get<Folder[]>(`${this.API_URL}/folders`)
      .pipe(
        tap(folders => this.foldersSubject.next(folders))
      );
  }

  getFolderById(id: number): Observable<Folder> {
    return this.http.get<Folder>(`${this.API_URL}/folders/${id}`);
  }

  createFolder(folder: CreateFolderRequest): Observable<Folder> {
    return this.http.post<Folder>(`${this.API_URL}/folders`, folder)
      .pipe(
        tap(() => this.refreshFolders())
      );
  }

  updateFolder(id: number, folder: UpdateFolderRequest): Observable<Folder> {
    return this.http.put<Folder>(`${this.API_URL}/folders/${id}`, folder)
      .pipe(
        tap(() => this.refreshFolders())
      );
  }

  deleteFolder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/folders/${id}`)
      .pipe(
        tap(() => this.refreshFolders())
      );
  }

  private refreshFolders(): void {
    this.getAllFolders().subscribe();
  }

  // Helper methods for folder organization
  getCurrentFolders(): Folder[] {
    return this.foldersSubject.value;
  }

  getRootFolders(): Folder[] {
    return this.getCurrentFolders().filter(folder => !folder.parent_folder_id);
  }

  getSubfolders(parentId: number): Folder[] {
    return this.getCurrentFolders().filter(folder => folder.parent_folder_id === parentId);
  }

  getFolderPath(folderId: number): string {
    const folders = this.getCurrentFolders();
    const folder = folders.find(f => f.folder_id === folderId);
    
    if (!folder) return '';
    
    if (!folder.parent_folder_id) {
      return folder.folder_name;
    }
    
    const parentPath = this.getFolderPath(folder.parent_folder_id);
    return `${parentPath} / ${folder.folder_name}`;
  }
}