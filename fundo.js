/* ==========================================================================
   FUNDO INTERATIVO — DSC Shop
   Blobs flutuantes com parallax, partículas que reagem ao cursor e
   ondulação suave ao clicar. Não interfere em cliques nem na leitura.
   ========================================================================== */

(function () {
    "use strict";

    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function criar_fundo() {
        // Evita duplicar o fundo se o script for carregado mais de uma vez.
        if (document.querySelector(".bg-interativo")) return;

        const camada = document.createElement("div");
        camada.className = "bg-interativo";
        camada.setAttribute("aria-hidden", "true");

        const blobs = document.createElement("div");
        blobs.className = "bg-blobs";

        const cores = [
            "linear-gradient(135deg, #2563eb, #60a5fa)",
            "linear-gradient(135deg, #38bdf8, #818cf8)",
            "linear-gradient(135deg, #0ea5e9, #22d3ee)",
            "linear-gradient(135deg, #6366f1, #a78bfa)",
            "linear-gradient(135deg, #3b82f6, #93c5fd)"
        ];

        cores.forEach((cor, indice) => {
            const blob = document.createElement("span");
            blob.className = "bg-blob bg-blob-" + (indice + 1);
            blob.style.background = cor;
            blobs.appendChild(blob);
        });

        const grade = document.createElement("div");
        grade.className = "bg-grade";

        const particulas = document.createElement("div");
        particulas.className = "bg-particulas";

        const total = window.innerWidth < 700 ? 12 : 20;
        for (let i = 0; i < total; i++) {
            const pontinho = document.createElement("span");
            pontinho.className = "bg-particula";
            // Posição normalizada: se ajusta sozinha quando a janela muda.
            pontinho.dataset.x = String(Math.random());
            pontinho.dataset.y = String(Math.random());
            pontinho.style.animationDelay = (Math.random() * 5).toFixed(2) + "s";
            particulas.appendChild(pontinho);
        }

        camada.append(blobs, grade, particulas);
        document.body.prepend(camada);

        return { camada, blobs, grade, pontinhos: Array.from(particulas.children) };
    }

    function iniciar_interacao(elementos) {
        if (!elementos || reduzirMovimento) return;

        let atualX = window.innerWidth / 2;
        let atualY = window.innerHeight / 2;
        let alvoX = atualX;
        let alvoY = atualY;

        function mover(clientX, clientY) {
            alvoX = clientX;
            alvoY = clientY;
        }

        window.addEventListener("mousemove", evento => mover(evento.clientX, evento.clientY), { passive: true });
        window.addEventListener("touchmove", evento => {
            if (evento.touches && evento.touches[0]) {
                mover(evento.touches[0].clientX, evento.touches[0].clientY);
            }
        }, { passive: true });

        // Ondulação ao clicar em qualquer lugar da página.
        document.addEventListener("pointerdown", evento => {
            if (evento.target.closest("a, button, input, select, textarea, label")) return;

            const onda = document.createElement("span");
            onda.className = "bg-ripple";
            onda.style.left = evento.clientX + "px";
            onda.style.top = evento.clientY + "px";
            elementos.camada.appendChild(onda);
            onda.addEventListener("animationend", () => onda.remove(), { once: true });
        });

        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) {
                alvoX = atualX;
                alvoY = atualY;
            }
        });

        function animar() {
            if (document.hidden) {
                requestAnimationFrame(animar);
                return;
            }

            atualX += (alvoX - atualX) * 0.08;
            atualY += (alvoY - atualY) * 0.08;

            const largura = window.innerWidth;
            const altura = window.innerHeight;

            // Parallax suave dos blobs e da grade.
            const deslocaX = (atualX / largura - 0.5) * 34;
            const deslocaY = (atualY / altura - 0.5) * 34;
            elementos.blobs.style.transform =
                "translate3d(" + deslocaX.toFixed(1) + "px, " + deslocaY.toFixed(1) + "px, 0)";
            elementos.grade.style.backgroundPosition =
                (50 + deslocaX * 1.5).toFixed(1) + "% " + (50 + deslocaY * 1.5).toFixed(1) + "%";

            // Partículas se afastam levemente do cursor.
            const raio = 170;
            elementos.pontinhos.forEach(pontinho => {
                const baseX = Number(pontinho.dataset.x) * largura;
                const baseY = Number(pontinho.dataset.y) * altura;
                const dx = baseX - atualX;
                const dy = baseY - atualY;
                const distancia = Math.hypot(dx, dy);

                if (distancia < raio && distancia > 0) {
                    const forca = (1 - distancia / raio) * 28;
                    const x = baseX + (dx / distancia) * forca;
                    const y = baseY + (dy / distancia) * forca;
                    pontinho.style.transform = "translate3d(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px, 0)";
                } else {
                    pontinho.style.transform =
                        "translate3d(" + baseX.toFixed(1) + "px, " + baseY.toFixed(1) + "px, 0)";
                }
            });

            requestAnimationFrame(animar);
        }

        animar();
    }

    function posicionar_particulas() {
        const largura = window.innerWidth;
        const altura = window.innerHeight;
        document.querySelectorAll(".bg-particula").forEach(pontinho => {
            const x = Number(pontinho.dataset.x) * largura;
            const y = Number(pontinho.dataset.y) * altura;
            pontinho.style.transform = "translate3d(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px, 0)";
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            iniciar_interacao(criar_fundo());
            posicionar_particulas();
        }, { once: true });
    } else {
        iniciar_interacao(criar_fundo());
        posicionar_particulas();
    }
})();
