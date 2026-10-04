import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para el ngModel de la barra de búsqueda
import { ApiService } from './services/api.service';
import { User } from './interfaces/user';
import { Post } from './interfaces/post';
import { Comment } from './interfaces/comment';

import { UserDataComponent } from './components/user-data/user-data.component';
import { UserPostsComponent } from './components/user-posts/user-posts.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule, FormsModule, UserDataComponent, UserPostsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // Variables de estado
  usernameToSearch: string = '';
  user: User | null = null;
  posts: Post[] = [];
  
  // Usamos un diccionario (objeto) para guardar los comentarios asociados al ID de cada post
  commentsByPost: { [postId: number]: Comment[] } = {};
  
  errorMessage: string = '';

  // Inyectamos el servicio
  constructor(private apiService: ApiService) {}

  // Función que se ejecuta al enviar el buscador
  buscarUsuario() {
    if (!this.usernameToSearch.trim()) return;

    // Reiniciamos el estado antes de cada búsqueda
    this.errorMessage = '';
    this.user = null;
    this.posts = [];
    this.commentsByPost = {};

    // 1. Consultamos el usuario y nos suscribimos al resultado
    this.apiService.getUserByUsername(this.usernameToSearch).subscribe({
      next: (response) => {
        // La API devuelve un arreglo; verificamos si tiene datos
        if (response.users && response.users.length > 0) {
          this.user = response.users[0];
          this.buscarPosts(this.user.id); // Si existe, buscamos sus posts
        } else {
          // Si el arreglo está vacío, el usuario no existe
          this.errorMessage = 'El nombre de usuario no existe. Por favor, intenta con otro.';
        }
      },
      error: (err) => {
        this.errorMessage = 'Ocurrió un error al consultar el servidor.';
        console.error(err);
      }
    });
  }

  // 2. Consultamos los posts del usuario encontrado
  buscarPosts(userId: number) {
    this.apiService.getPostsByUser(userId).subscribe({
      next: (response) => {
        this.posts = response.posts;
        
        // 3. Por cada post encontrado, disparamos la consulta de sus comentarios
        this.posts.forEach(post => {
          this.buscarComentarios(post.id);
        });
      },
      error: (err) => console.error('Error al cargar posts', err)
    });
  }

  // 4. Consultamos los comentarios de un post específico
  buscarComentarios(postId: number) {
    this.apiService.getCommentsByPost(postId).subscribe({
      next: (response) => {
        // Guardamos los comentarios en el diccionario usando el ID del post como llave
        this.commentsByPost[postId] = response.comments;
      },
      error: (err) => console.error(`Error al cargar comentarios del post ${postId}`, err)
    });
  }
}