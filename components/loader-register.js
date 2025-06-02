// Extends es para heredar de super clases
class RegisterLoader extends HTMLElement {
    constructor() {
        super();
        // this es como el self de python
        this.innerHTML = /*html*/`
            <div id="register-loader" class="center-align" style="margin-top: 20px;">
                <div class="preloader-wrapper big active">
                    <div class="spinner-layer spinner-blue-only">
                        <div class="circle-clipper left">
                            <div class="circle"></div>
                        </div>
                        <div class="gap-patch">
                            <div class="circle"></div>
                        </div>
                        <div class="circle-clipper right">
                            <div class="circle"></div>
                        </div>
                    </div>
                </div>
                <p>Registrando, por favor espere</p>
            </div>
        `;
    }
}

customElements.define('register-loader', RegisterLoader);