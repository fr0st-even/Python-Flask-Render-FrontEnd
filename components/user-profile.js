class UserProfile extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = /*html*/`
            <div class="container" style="margin-top: 40px;">
                <div class="row">
                    <div class="col s12 m8 offset-m2">
                        <div class="card white z-depth-4">
                            <div class="card-content center-align">
                                <div class="profile-section">
                                    <img id="profile-photo" class="profile-photo-large" src="" alt="Foto de perfil">
                                    <h4 id="profile-username" class="profile-username grey-text text-darken-2"></h4>
                                    <p id="user-stats" class="grey-text">Cargando información...</p>
                                </div>
                                <div class="profile-actions" style="margin-top: 30px;">
                                    <a href="index.html" class="btn waves-effect waves-light grey">
                                        <i class="material-icons left">arrow_back</i>
                                        Volver a la galería
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Galería de fotos del usuario -->
                <div class="row">
                    <div class="col s12">
                        <h5 class="center-align grey-text text-darken-2">Fotos subidas</h5>
                        <div id="user-gallery" class="row">
                            <!-- Las fotos se cargarán aquí -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        this.loadUserProfile();
    }

    async loadUserProfile() {
        try {
            // Obtener user_id de la URL o localStorage
            const urlParams = new URLSearchParams(window.location.search);
            const profileUserId = urlParams.get('user_id') || localStorage.getItem("user_id");
            
            if (!profileUserId) {
                this.showError("Usuario no encontrado");
                return;
            }

            // Cargar información del usuario
            const userResponse = await fetch(`http://localhost:5000/api/users`);
            const users = await userResponse.json();
            const user = users.find(u => u.id == profileUserId);

            if (!user) {
                this.showError("Usuario no encontrado");
                return;
            }

            // Cargar imágenes del usuario
            const imagesResponse = await fetch(`http://localhost:5000/api/images`);
            const allImages = await imagesResponse.json();
            const userImages = allImages.filter(img => img.user_id == profileUserId);

            // Actualizar UI
            this.updateProfileInfo(user, userImages.length);
            this.loadUserGallery(userImages);

        } catch (error) {
            console.error('Error loading profile:', error);
            this.showError("Error al cargar el perfil");
        }
    }

    updateProfileInfo(user, imageCount) {
    const usernameEl = this.querySelector('#profile-username');
    const photoEl = this.querySelector('#profile-photo');
    const statsEl = this.querySelector('#user-stats');

    usernameEl.textContent = user.username;
    statsEl.textContent = `${imageCount} fotos subidas`;

    // El campo en el backend se llama 'profile_photo'
    if (user.profile_photo) {
        // La foto está almacenada como base64 puro (sin prefijo data:image)
        photoEl.src = `data:image/jpeg;base64,${user.profile_photo}`;
        
        // Manejar errores de carga de imagen
        photoEl.onerror = () => {
            console.warn('Error cargando foto de perfil, usando avatar por defecto');
            photoEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&size=150`;
        };
    } else {
        // Foto por defecto si no hay foto
        photoEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&size=150`;
    }
}

    loadUserGallery(images) {
        const galleryEl = this.querySelector('#user-gallery');
        
        if (images.length === 0) {
            galleryEl.innerHTML = '<div class="col s12 center-align"><p class="grey-text">Este usuario no ha subido fotos aún</p></div>';
            return;
        }

        galleryEl.innerHTML = '';
        
        images.forEach(img => {
            const card = document.createElement('div');
            card.className = 'col s12 m6 l4';
            card.innerHTML = /*html*/`
                <div class='card hoverable z-depth-3'>
                    <div class='card-image'>
                        <img class='materialboxed' src='data:image/jpg;base64,${img.filedata}' />
                    </div>
                </div>
            `;
            galleryEl.appendChild(card);
        });

        // Inicializar Materialbox para zoom de imágenes
        if (window.M && M.Materialbox) {
            M.Materialbox.init(document.querySelectorAll('.materialboxed'));
        }
    }

    showError(message) {
        const usernameEl = this.querySelector('#profile-username');
        const photoEl = this.querySelector('#profile-photo');
        const statsEl = this.querySelector('#user-stats');

        usernameEl.textContent = "Error";
        statsEl.textContent = message;
        photoEl.src = "https://ui-avatars.com/api/?name=Usuario&size=150";
    }
}

customElements.define('user-profile', UserProfile);