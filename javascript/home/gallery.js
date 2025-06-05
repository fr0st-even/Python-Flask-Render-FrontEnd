// importamos modulos externos de javascript
import { URI } from "../uri.js";
import { fetchComments, fetchImages, toggleLike } from "./services/api.js";

export async function loadGallery(users, onlyMine = false) {
    const userId = parseInt(localStorage.getItem("user_id"));
    const container = document.getElementById("gallery");
    const loader = document.getElementById("loader");

    loader.style.display = 'block';
    container.innerHTML = '';

    // Manda a traer las imágenes
    const images = await fetchImages();
    images.forEach(img => {
        // Pregunta si el usuario que subió la foto es el mismo que está logueado
        const isMine = parseInt(img.user_id) === userId;

        // Es para saber si la persona logueada es la misma de las fotos o no
        if (onlyMine && !isMine) return;
        if (!onlyMine && isMine) return;

        // Encontramos a la persona que cargó la imagen
        const uploader = users.find(u => u.id == img.user_id);
        
        // Crear enlace al perfil del usuario
        let uploaderNameHtml;
        if (uploader) {
            if (uploader.id === userId) {
                uploaderNameHtml = '<strong>Tú</strong>';
            } else {
                uploaderNameHtml = `<a class="profile-link" href="profile.html?user_id=${uploader.id}" style="color: #64788d; text-decoration: none;"><strong>${uploader.username}</strong></a>`;
            }
        } else {
            uploaderNameHtml = '<strong>Desconocido</strong>';
        }

        const commentsHtml = img.comments.map(c => {
            // Encontramos a la persona que comentó en la base de datos
            const commenter = users.find(u => u.id === c.user_id);

            // Crear enlace al perfil del comentarista
            let commenterNameHtml;
            if (commenter) {
                if (commenter.id === userId) {
                    commenterNameHtml = '<strong>Tú</strong>';
                } else {
                    commenterNameHtml = `<a class="profile-link" href="profile.html?user_id=${commenter.id}" style="color: #64788d; text-decoration: none;"><strong>${commenter.username}</strong></a>`;
                }
            } else {
                commenterNameHtml = '<strong>Anónimo</strong>';
            }

            return `<p>${commenterNameHtml}: ${c.text}</p>`;
        }).join('');

        // Verificar si el usuario actual ya dio like a esta imagen
        const userLiked = img.likes && img.likes.includes(userId);
        const likesCount = img.likes ? img.likes.length : 0;
        
        // Configurar el ícono y color del botón de like
        const likeIcon = userLiked ? 'favorite' : 'favorite_border';
        const likeButtonClass = userLiked ? 'red' : 'grey';
        const likeIconClass = userLiked ? 'white-text' : '';

        // <div class='col s12 m6 l4'></div>
        const card = document.createElement('div');
        card.className = 'col s12 m6 l4';
        card.innerHTML = /*html*/`
            <div class='card hoverable z-depth-3'>
                <div class='card-image'>
                    <img class='materialboxed' src='data:image/jpg;base64,${img.filedata}' />
                </div>
                <div class='card-content'>
                    <div class='like-section'>
                        <span class="likes-count" style="position: absolute; top: 100%; left: 290px; 
                              transform: translateY(-50%); background: rgba(0,0,0,0.7); 
                              color: white; padding: 4px 8px; border-radius: 15px; 
                              font-size: 12px; font-weight: bold; z-index: 1;">
                            ${likesCount}
                        </span>
                        <a class='btn-floating halfway-fab waves-effect waves-light ${likeButtonClass} 
                            like-btn' data-imageid='${img.id}'>
                            <i class='material-icons ${likeIconClass}'>${likeIcon}</i>
                        </a>
                    </div>
                    <span class='card-title'>Subido por: ${uploaderNameHtml}</span>
                    <div class="comments-section" style="margin-top: 15px; max-height: 150px; overflow-y: auto;">
                        ${commentsHtml || '<p class="grey-text">Sin comentarios aún</p>'}
                    </div>
                    
                    <div class='comment-section row' style="margin-top: 15px;">
                        <div class="input-field" style="display: flex; align-items: center; border: 1px solid #ccc; border-radius: 30px; padding: 0 10px;">
                            <input id="comment-${img.id}" type="text" placeholder="Envía un mensaje" style="border: none; box-shadow: none; margin: 0; flex: 1;">    
                            <a data-imageid="${img.id}" class="btn-flat waves-effect waves-grey comment-btn" style="min-width: auto; padding: 0;">
                                <i class="material-icons">send</i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    M.Materialbox.init(document.querySelectorAll('.materialboxed'));

    // Evento para agregar comentario
    container.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const imageId = btn.getAttribute('data-imageid');
            const input = document.getElementById(`comment-${imageId}`);
            const text = input.value.trim();
            if (!text) return;
            
            try {
                await fetchComments(imageId, userId, text);
                input.value = ''; // Limpiar el input
                // Recargar la galería para mostrar el nuevo comentario
                loadGallery(users, onlyMine);
            } catch (error) {
                console.error('Error al agregar comentario:', error);
                M.toast({html: 'Error al agregar comentario', classes: 'red'});
            }
        });
    });

    // Evento para manejar likes
    container.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const imageId = parseInt(btn.getAttribute('data-imageid'));
            const icon = btn.querySelector('i');
            const countSpan = btn.parentElement.querySelector('.likes-count');

            try {
                const response = await toggleLike(imageId, userId);
                
                if (response.success) {
                    // Actualizar la UI basado en la respuesta del servidor
                    if (response.liked) {
                        icon.textContent = 'favorite';
                        icon.classList.add('white-text');
                        btn.classList.add('red');
                        btn.classList.remove('grey');
                    } else {
                        icon.textContent = 'favorite_border';
                        icon.classList.remove('white-text');
                        btn.classList.remove('red');
                        btn.classList.add('grey');
                    }
                    
                    // Actualizar contador de likes
                    countSpan.textContent = response.likes_count;
                    
                    // Mostrar notificación de éxito
                    const message = response.liked ? 'Like agregado' : 'Like removido';
                    M.toast({html: message, classes: 'green'});
                }
            } catch (error) {
                console.error('Error al procesar like:', error);
                M.toast({html: 'Error al procesar like', classes: 'red'});
            }
        });
    });

    loader.style.display = 'none';
}