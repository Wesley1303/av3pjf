// Deve coincidir com o LIMITE fixado no back-end (index.js - rota /produto)
const LIMITE_POR_PAGINA = 10;
 
// URL base da API, mesmo padrão do pages.js
const LINK_API = "http://localhost:3000";
 
const lista_produtos = document.getElementById("lista-produtos");
const filtro_busca = document.getElementById("filtro-busca");
const filtro_marca = document.getElementById("filtro-marca");
const filtro_preco_min = document.getElementById("filtro-preco-min");
const filtro_preco_max = document.getElementById("filtro-preco-max");
const filtro_ordenacao = document.getElementById("filtro-ordenacao");
const btn_filtrar = document.getElementById("btn-filtrar");
const btn_limpar = document.getElementById("btn-limpar");
const btn_anterior = document.getElementById("btn-anterior");
const btn_proximo = document.getElementById("btn-proximo");
const info_pagina = document.getElementById("info-pagina");
 
let pagina_atual = 1;
 
// Monta os query parameters (filtros vindos do back-end: busca, marca,
// preco_min, preco_max, ordenacao e pagina)
function construir_filtros() {
    const params = new URLSearchParams();
 
    const busca = filtro_busca.value.trim();
    if (busca) {
        params.set("busca", busca);
    }
 
    if (filtro_marca.value) {
        params.set("marca", filtro_marca.value);
    }
 
    if (filtro_preco_min.value !== "") {
        params.set("preco_min", filtro_preco_min.value);
    }
 
    if (filtro_preco_max.value !== "") {
        params.set("preco_max", filtro_preco_max.value);
    }
 
    if (filtro_ordenacao.value) {
        params.set("ordenacao", filtro_ordenacao.value);
    }
 
    params.set("pagina", pagina_atual);
 
    return params;
}
 
// Atualiza o rodapé da paginação: número da página e botões desabilitados
function atualizar_paginacao(quantidade_retornada) {
    info_pagina.textContent = "Página " + pagina_atual;
 
    btn_anterior.disabled = pagina_atual <= 1;
 
    // Se a página veio com menos produtos que o limite, não existe próxima página
    btn_proximo.disabled = quantidade_retornada < LIMITE_POR_PAGINA;
}
 
async function carregar_produtos() {
    try {
        const resposta = await fetch(LINK_API + "/produto?" + construir_filtros());
 
        if (!resposta.ok) {
            let detalhe = "";
            try {
                const corpo = await resposta.json();
                detalhe = corpo.erro || corpo.mensagem || "";
            } catch (e) {}
            throw new Error("Erro " + resposta.status + " na API. " + detalhe);
        }
 
        const produtos = await resposta.json();
        mostrar_produtos(produtos);
        atualizar_paginacao(produtos.length);
    } catch (erro) {
        console.error(erro);
        lista_produtos.replaceChildren();
        mostrar_mensagem("Não foi possível carregar os produtos. " + erro.message +
            " (Confira se a API está rodando em " + LINK_API + ")");
        atualizar_paginacao(0);
    }
}
 
function criar_card(produto) {
    const card = document.createElement("article");
    card.className = "produto-estoque";
 
    // A tabela ainda não tem imagem: mostra um espaço reservado com a marca
    let imagem;
    if (produto.caminho_img) {
        imagem = document.createElement("img");
        imagem.src = produto.caminho_img;
        imagem.alt = produto.nome;
        imagem.onerror = () => {
            imagem.replaceWith(criar_placeholder(produto.marca));
        };
    } else {
        imagem = criar_placeholder(produto.marca);
    }
 
    const nome = document.createElement("h2");
    nome.textContent = produto.nome;
 
    const marca = document.createElement("p");
    marca.textContent = "Marca: " + produto.marca;
 
    const codigo = document.createElement("p");
    codigo.textContent = "Código: " + (produto.codigo ?? produto.numero_serie ?? "-");
 
    const preco = document.createElement("p");
    preco.className = "preco";
    preco.textContent = Number(produto.preco).toLocaleString(
        "pt-BR",
        { style: "currency", currency: "BRL" }
    );

    // AV3 - ação de compra (o envio usa o token JWT guardado no localStorage)
    const acoes = document.createElement("div");
    acoes.className = "acoes-produto";

    const quantidade = document.createElement("input");
    quantidade.type = "number";
    quantidade.min = "1";
    quantidade.value = "1";
    quantidade.className = "qtd-compra";
    quantidade.setAttribute("aria-label", "Quantidade");

    const btn_comprar = document.createElement("button");
    btn_comprar.type = "button";
    btn_comprar.className = "btn-comprar";
    btn_comprar.addEventListener("click", () => {
        // O token é lido no clique (e não só na criação do card), para o botão
        // funcionar mesmo se o login tiver sido feito em outra aba.
        if (!token_presente()) {
            mostrarToast("🔒 Faça login para adicionar ao carrinho.", "bg-danger");
            window.location.href = "login.html";
            return;
        }
        adicionar_ao_carrinho(produto, Number(quantidade.value));
    });

    acoes.append(quantidade, btn_comprar);
    card.append(imagem, nome, marca, codigo, preco, acoes);

    return card;
}

// ---------- ESTADO DE LOGIN DOS BOTÕES ----------
// Atualiza todos os botões conforme o token atual. Chamado quando os cards
// são montados, quando a aba volta a ter foco e quando outra aba altera o
// localStorage (evento "storage").
function token_presente() {
    return Boolean(localStorage.getItem("token"));
}

function atualizar_botoes_compra() {
    const logado = token_presente();
    document.querySelectorAll(".btn-comprar").forEach(botao => {
        botao.textContent = logado ? "Adicionar ao carrinho" : "Faça login para comprar";
        botao.disabled = !logado;
    });
}

window.addEventListener("focus", atualizar_botoes_compra);
window.addEventListener("storage", atualizar_botoes_compra);

// ---------- CARRINHO (localStorage) ----------
const CHAVE_CARRINHO = "carrinho";

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

function adicionar_ao_carrinho(produto, quantidade) {
    if (!Number.isInteger(quantidade) || quantidade < 1) {
        mostrarToast("❌ Informe uma quantidade válida.", "bg-danger");
        return;
    }

    const carrinho = ler_carrinho();
    const item = carrinho.find(item => item.id === produto.id);

    if (item) {
        item.quantidade += quantidade;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: Number(produto.preco),
            quantidade: quantidade,
            caminho_img: produto.caminho_img || ""
        });
    }

    salvar_carrinho(carrinho);
    atualizar_badge_carrinho();
    mostrarToast("✅ " + produto.nome + " adicionado ao carrinho.", "bg-success");
}

function atualizar_badge_carrinho() {
    const badge = document.getElementById("badge-carrinho");
    if (!badge) return;

    const quantidade = ler_carrinho().reduce((total, item) => total + item.quantidade, 0);
    badge.textContent = quantidade;
    badge.style.display = quantidade > 0 ? "inline-block" : "none";
}

window.addEventListener("DOMContentLoaded", () => {
    atualizar_badge_carrinho();
    atualizar_botoes_compra();
});
 
function criar_placeholder(texto) {
    const placeholder = document.createElement("div");
    placeholder.className = "sem-imagem";
    placeholder.textContent = texto || "Sem imagem";
    return placeholder;
}
 
function mostrar_produtos(produtos) {
    lista_produtos.replaceChildren();
 
    if (produtos.length === 0) {
        mostrar_mensagem("Nenhum produto encontrado com esses filtros.");
        return;
    }
 
    produtos.forEach(produto => {
        lista_produtos.appendChild(criar_card(produto));
    });

    atualizar_botoes_compra();
}
 
function mostrar_mensagem(texto) {
    const mensagem = document.createElement("p");
    mensagem.className = "mensagem sem-produtos";
    mensagem.textContent = texto;
    lista_produtos.appendChild(mensagem);
}
 
// Aplica os filtros: sempre volta para a primeira página
function aplicar_filtros() {
    pagina_atual = 1;
    carregar_produtos();
}
 
btn_filtrar.addEventListener("click", aplicar_filtros);
 
// Permite filtrar apertando Enter nos campos de texto/number
[filtro_busca, filtro_preco_min, filtro_preco_max].forEach(campo => {
    campo.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter") {
            aplicar_filtros();
        }
    });
});
 
// Ordenação aplica imediatamente
filtro_ordenacao.addEventListener("change", aplicar_filtros);
 
btn_limpar.addEventListener("click", () => {
    filtro_busca.value = "";
    filtro_marca.value = "";
    filtro_preco_min.value = "";
    filtro_preco_max.value = "";
    filtro_ordenacao.value = "";
    aplicar_filtros();
});
 
btn_anterior.addEventListener("click", () => {
    if (pagina_atual > 1) {
        pagina_atual--;
        carregar_produtos();
    }
});
 
btn_proximo.addEventListener("click", () => {
    pagina_atual++;
    carregar_produtos();
});
 
carregar_produtos();
 