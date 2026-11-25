const LINK_API = "http://localhost:3000";
const CHAVE_CARRINHO = "carrinho";

const lista_carrinho = document.getElementById("itens-carrinho");
const total_carrinho = document.getElementById("total-carrinho");
const btn_finalizar = document.getElementById("btn-finalizar");

function ler_carrinho() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_CARRINHO)) || [];
    } catch (erro) {
        return [];
    }
}

function salvar_carrinho(carrinho) {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
}

function formatar_moeda(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function atualizar_badge_carrinho() {
    const badge = document.getElementById("badge-carrinho");
    if (!badge) return;

    const quantidade = ler_carrinho().reduce((total, item) => total + item.quantidade, 0);
    badge.textContent = quantidade;
    badge.style.display = quantidade > 0 ? "inline-block" : "none";
}

function renderizar_carrinho() {
    const carrinho = ler_carrinho();
    lista_carrinho.replaceChildren();

    if (carrinho.length === 0) {
        const mensagem = document.createElement("p");
        mensagem.className = "mensagem sem-produtos";
        mensagem.textContent = "Seu carrinho está vazio. Escolha produtos na página inicial.";
        lista_carrinho.appendChild(mensagem);
        total_carrinho.textContent = "";
        btn_finalizar.disabled = true;
        return;
    }

    btn_finalizar.disabled = false;

    carrinho.forEach((item, indice) => {
        const card = document.createElement("article");
        card.className = "carrinho-item";

        const nome = document.createElement("h2");
        nome.textContent = item.nome;

        const preco = document.createElement("p");
        preco.textContent = "Preço unitário: " + formatar_moeda(item.preco);

        const controles = document.createElement("div");
        controles.className = "acoes-produto";

        const quantidade = document.createElement("input");
        quantidade.type = "number";
        quantidade.min = "1";
        quantidade.value = item.quantidade;
        quantidade.className = "qtd-compra";
        quantidade.setAttribute("aria-label", "Quantidade de " + item.nome);
        quantidade.addEventListener("change", () => {
            const valor = Number(quantidade.value);
            if (!Number.isInteger(valor) || valor < 1) {
                quantidade.value = item.quantidade;
                mostrarToast("❌ A quantidade deve ser maior que zero.", "bg-danger");
                return;
            }
            item.quantidade = valor;
            salvar_carrinho(carrinho);
            renderizar_carrinho();
        });

        const remover = document.createElement("button");
        remover.type = "button";
        remover.className = "btn-secundario";
        remover.textContent = "Remover";
        remover.addEventListener("click", () => {
            carrinho.splice(indice, 1);
            salvar_carrinho(carrinho);
            renderizar_carrinho();
        });

        const subtotal = document.createElement("p");
        subtotal.className = "preco";
        subtotal.textContent = "Subtotal: " + formatar_moeda(item.preco * item.quantidade);

        controles.append(quantidade, remover);
        card.append(nome, preco, controles, subtotal);
        lista_carrinho.appendChild(card);
    });

    const total = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
    total_carrinho.textContent = "Total: " + formatar_moeda(total);
}

// AV3 - envia a lista de produtos para a rota POST /compra (exige JWT).
btn_finalizar.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    const carrinho = ler_carrinho();

    if (!token) {
        mostrarToast("❌ Faça login para finalizar a compra.", "bg-danger");
        window.location.href = "login.html";
        return;
    }
    if (carrinho.length === 0) return;

    btn_finalizar.disabled = true;
    btn_finalizar.textContent = "Enviando...";

    try {
        const resposta = await fetch(LINK_API + "/compra", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            // O back-end recalcula os preços; enviamos apenas id e quantidade.
            body: JSON.stringify({
                produtos: carrinho.map(item => ({ id: item.id, quantidade: item.quantidade }))
            })
        });

        const json = await resposta.json();

        if (!resposta.ok) {
            if (resposta.status === 401 || resposta.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("nome_cliente");
                throw new Error("Sessão expirada. Faça login novamente.");
            }
            throw new Error(json.erro || json.msg || "Erro ao registrar a compra");
        }

        salvar_carrinho([]);
        renderizar_carrinho();
        atualizar_badge_carrinho();
        mostrarToast("✅ Compra realizada! Pedido #" + json.id, "bg-success");

        setTimeout(() => {
            window.location.href = "compras.html";
        }, 1500);
    } catch (erro) {
        mostrarToast("❌ " + erro.message, "bg-danger");
    } finally {
        btn_finalizar.textContent = "Finalizar compra";
        btn_finalizar.disabled = ler_carrinho().length === 0;
    }
});

window.addEventListener("DOMContentLoaded", () => {
    renderizar_carrinho();
    atualizar_badge_carrinho();
});
