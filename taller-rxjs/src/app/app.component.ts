import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap, of } from 'rxjs'; // Operadores explicados en la clase

import { ApiService } from './services/api.service';
import { User } from './interfaces/user';
import { Post } from './interfaces/post';
import { Comment } from './interfaces/comment';

import { UserDataComponent } from './components/user-data/user-data.component';
import { UserPostsComponent } from './components/user-posts/user-posts.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, UserDataComponent, UserPostsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  usernameToSearch: string = '';
  user: User | null = null;
  posts: Post[] = [];
  commentsByPost: { [postId: number]: Comment[] } = {};
  errorMessage: string = '';

  apiService: ApiService= inject(ApiService);

  buscarUsuario() {
    if (!this.usernameToSearch.trim()) return;

    // Reiniciamos el estado antes de cada búsqueda
    this.errorMessage = '';
    this.user = null;
    this.posts = [];
    this.commentsByPost = {};

    // Usamos switchMap para encadenar la búsqueda de los posts
    this.apiService.getUserByUsername(this.usernameToSearch).pipe(
      switchMap((response) => {
        if (response.users && response.users.length > 0) {
          this.user = response.users[0];
          // switchMap toma este Observable (posts) y lo envía al subscribe
          return this.apiService.getPostsByUser(this.user.id);
        } else {
          this.errorMessage = 'El nombre de usuario no existe. Por favor, intenta con otro.';
          // 'of'  emite null para no continuar la búsqueda de posts
          return of(null);
        }
      })
    ).subscribe({
      next: (postResponse) => {
        if (postResponse) {
          this.posts = postResponse.posts;

          // Por cada post encontrado, consultamos sus comentarios
          this.posts.forEach((post) => {
            this.buscarComentarios(post.id);
          });
        }
      },
      error: (err) => {
        this.errorMessage = 'Ocurrió un error al consultar el servidor.';
        console.error(err);
      }
    });
  }

  buscarComentarios(postId: number) {
    this.apiService.getCommentsByPost(postId).subscribe({
      next: (response) => {
        this.commentsByPost[postId] = response.comments;
      },
      error: (err) => console.error(`Error al cargar comentarios del post ${postId}`, err)
    });
  }
}