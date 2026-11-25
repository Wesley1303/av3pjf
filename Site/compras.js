const LINK_API = "http://localhost:3000";

const lista_compras = document.getElementById("lista-compras");

function formatar_moeda(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mostrar_mensagem(texto) {
    const mensagem = document.createElement("p");
    mensagem.className = "mensagem sem-produtos";
    mensagem.textContent = texto;
    lista_compras.appendChild(mensagem);
}

function criar_compra(compra) {
    const card = document.createElement("article");
    card.className = "compra-card";

    const cabecalho = document.createElement("div");
    cabecalho.className = "compra-cabecalho";

    const titulo = document.createElement("h2");
    titulo.textContent = "Pedido #" + compra.id;

    const data = document.createElement("span");
    data.textContent = new Date(compra.data_compra).toLocaleString("pt-BR");

    cabecalho.append(titulo, data);

    const itens = document.createElement("ul");
    itens.className = "compra-itens";

    (compra.itens || []).forEach(item => {
        const linha = document.createElement("li");
        linha.textContent = item.quantidade + "x " + item.produto_nome +
            " — " + formatar_moeda(item.subtotal);
        itens.appendChild(linha);
    });

    const total = document.createElement("p");
    total.className = "preco";
    total.textContent = "Total: " + formatar_moeda(compra.valor_total);

    card.append(cabecalho, itens, total);
    return card;
}

// AV3 - consulta as compras do usuário autenticado (GET /compra com JWT).
async function carregar_compras() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const resposta = await fetch(LINK_API + "/compra", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (!resposta.ok) {
            if (resposta.status === 401 || resposta.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("nome_cliente");
                window.location.href = "login.html";
                return;
            }
            throw new Error("Erro " + resposta.status + " na API");
        }

        const compras = await resposta.json();
        lista_compras.replaceChildren();

        if (compras.length === 0) {
            mostrar_mensagem("Você ainda não realizou nenhuma compra.");
            return;
        }

        compras.forEach(compra => lista_compras.appendChild(criar_compra(compra)));
    } catch (erro) {
        lista_compras.replaceChildren();
        mostrar_mensagem("Não foi possível carregar suas compras. " + erro.message);
    }
}

window.addEventListener("DOMContentLoaded", carregar_compras);
