
// npm init
 
// npm i dotenv
const dotenv = require("dotenv")
dotenv.config()
 
// npm i express
 
// http://localhost:3000​/cliente
 
const express = require("express")
const app = express()
const port = process.env.API_PORT
app.use(express.json())
 
// npm i mysql2
const db = require("./db")
 
// npm i bcrypt
const bcrypt = require("bcrypt")
 
// npm i jsonwebtoken
const jwt = require("jsonwebtoken")
 
// npm i cors
const cors = require("cors")
app.use(cors())

// Erro com status HTTP para validações nas rotas
function falha(status, mensagem) {
    const erro = new Error(mensagem)
    erro.status = status
    return erro
}

// AV3 - IMAGENS DOS PRODUTOS
// Aceita uma URL externa pronta (http/https) ou um link/id do Google Drive e
// devolve a URL direta da imagem. Nenhuma imagem é gravada no repositório.
function urlImagemExterna(valor) {
    if (typeof valor !== "string" || !valor.trim()) return null
    const link = valor.trim()

    // https://drive.google.com/file/d/ID/view?usp=sharing
    // https://drive.google.com/open?id=ID
    const match = link.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/)
    if (match) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`
    }

    // ID puro do arquivo no Google Drive
    if (/^[\w-]{20,}$/.test(link)) {
        return `https://drive.google.com/uc?export=view&id=${link}`
    }

    if (/^https?:\/\//i.test(link)) return link

    throw falha(400, "Informe uma URL http(s) válida ou um link do Google Drive")
}

// CADASTRAR CLIENTE
app.post("/cliente", async (req, res) => {
    try {
        const cliente = req.body
 
        const senhaCript = bcrypt.hashSync(cliente.senha, 10)
        cliente.senha = senhaCript
 
        const resultado = await db.pool.query(
            `INSERT INTO cliente (
                nome, cpf, celular, email, senha
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                cliente.nome,
                cliente.cpf,
                cliente.celular,
                cliente.email,
                cliente.senha
            ]
        )
 
        res.status(201).json({
            msg: "Cliente cadastrado, ID = " + resultado[0].insertId
        })
 
    } catch (error) {
        res.status(500).json({
            erro: error.message
        })
    }
})
 
app.post("/login", async (req,res) => {
    try { 
        const user = req.body
        const resultado = await db.pool.query(
            "SELECT id, nome, email, senha FROM cliente WHERE email = ?", [user.email]
        )
        const dados_bd = resultado[0][0]
        if(!dados_bd) {
            return res.status(401).json({msg: "Email não cadastrado!"})
        }
        
        const senha_valida = await bcrypt.compare(user.senha, dados_bd.senha)
 
        if(!senha_valida) {
            return res.status(401).json({msg: "Credenciais inválidas!"})
        }
        const payload ={
            id: dados_bd.id,
            email: dados_bd.email
        }
        
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h'})
        return res.status(200).json({nome: dados_bd.nome, token: token})
        
    } catch (error) {
        res.status(500).json({
            erro: error.message
        })
    }
})
 
 
// CONSULTAR TODOS OS CLIENTES
app.get("/cliente", async (req, res) => {
    try {
 
        const resultado = await db.pool.query(
            "SELECT * FROM cliente"
        )
 
        res.status(200).json(resultado[0])
 
    } catch (error) {
        res.status(500).json({
            erro: error.message
        })
    }
})
 
// CONSULTAR UM CLIENTE ESPECÍFICO
app.get("/cliente/perfil", autenticar, async (req, res) => {
    try {
 
        const id = req.usuario.id
 
        const resultado = await db.pool.query(
            "SELECT * FROM cliente WHERE id = ?",
            [id]
        );
    
        if (resultado[0].length === 0) {
            return res.status(404).json({
                mensagem: "Cliente não encontrado"
            })
        }
        
        const perfil = resultado[0][0]
        // delete perfil.senha
 
        res.status(200).json(perfil)
 
    } catch (error) {
        res.status(500).json({
            erro: error.message
        })
    }
})
 
// ALTERAR CLIENTE
app.put("/cliente/:id", async (req, res) => {
    try {
 
        const id = req.params.id
        const cliente = req.body
 
        const senhaCript = bcrypt.hashSync(cliente.senha, 10)
 
        const resultado = await db.pool.query(
            `UPDATE cliente
             SET nome = ?,
                 cpf = ?,
                 celular = ?,
                 email = ?,
                 senha = ?
             WHERE id = ?`,
            [
                cliente.nome,
                cliente.cpf,
                cliente.celular,
                cliente.email,
                senhaCript,
                id
            ]
        )
 
        if (resultado[0].affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Cliente não encontrado"
            })
        }
 
        res.status(200).json({
            mensagem: "Cliente alterado com sucesso"
        })
 
    } catch (error) {
        res.status(500).json({
            erro: error.message
        })
    }
})
 
// EXCLUIR CLIENTE
app.delete("/cliente/:id", async (req, res) => {
    try {
 
        const id = req.params.id
 
        const resultado = await db.pool.query(
            "DELETE FROM cliente WHERE id = ?",
            [id]
        )
 
        if (resultado[0].affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Cliente não encontrado"
            })
        }
 
        res.status(200).json({
            mensagem: "Cliente excluído com sucesso"
        })
 
    } catch (error) {
        res.status(500).json({
            erro: error.message
        })
    }
})
 
// CONSULTAR PRODUTOS (busca, filtros, ordenação e paginação)
app.get("/produto", async (req, res) => {
    try {
        let sql = "SELECT * FROM produto WHERE 1=1"
        const params = []
 
        // Query Parameters
        const {
            busca,
            ordenacao,
            marca,
            preco_min,
            preco_max,
            pagina
        } = req.query
 
        // Filtro de busca por nome
        if (busca) {
            sql += " AND nome LIKE ?"
            params.push(`%${busca}%`)
        }
 
        // Filtro por marca
        if (marca) {
            sql += " AND marca = ?"
            params.push(marca)
        }
 
        // Filtro por preço mínimo
        if (preco_min) {
            sql += " AND preco >= ?"
            params.push(preco_min)
        }
 
        // Filtro por preço máximo
        if (preco_max) {
            sql += " AND preco <= ?"
            params.push(preco_max)
        }
 
        // Ordenação por menor ou maior preço
        let orderBy = " ORDER BY id ASC"
        if (ordenacao) {
            const ordem = String(ordenacao).toLowerCase()
            if (ordem === "maior preco" || ordem === "maior_preco" || ordem === "desc") {
                orderBy = " ORDER BY preco DESC"
            } else if (ordem === "menor preco" || ordem === "menor_preco" || ordem === "asc") {
                orderBy = " ORDER BY preco ASC"
            }
        }
        sql += orderBy
 
        // Paginação: quantidade fixa de 10 produtos por página
        const limite = 10
        let paginaAtual = parseInt(pagina)
        if (isNaN(paginaAtual) || paginaAtual < 1) {
            paginaAtual = 1
        }
        const offset = (paginaAtual - 1) * limite
 
        sql += " LIMIT ? OFFSET ?"
        params.push(limite, offset)
 
        const resultado = await db.pool.query(sql, params)
        res.status(200).json(resultado[0])
    } catch (error) {
        res.status(500).json({erro: error.message})
    }
})
 
app.get("/produto/:id", async (req, res) => {
    try {
        // Path Parameter
        const id = req.params.id
        const resultado = await db.pool.query("SELECT * FROM produto WHERE id = ?", [id])
        const produto = resultado[0][0]
        res.status(200).json(produto)
    } catch (error) {
        res.status(500).json({erro: error.message})
    }
})

// AV3 - IMAGENS DOS PRODUTOS NO LADO DO SERVIDOR
// O servidor recebe apenas a URL da imagem (ex.: Google Drive) e a grava no
// banco. O arquivo em si nunca é enviado para o GitHub.
app.post("/produto", async (req, res) => {
    try {
        const { nome, preco, marca, codigo, caminho_img } = req.body

        if (!nome || !preco || !marca || !codigo) {
            throw falha(400, "nome, preco, marca e codigo são obrigatórios")
        }

        const imagem = caminho_img ? urlImagemExterna(caminho_img) : null

        const resultado = await db.pool.query(
            `INSERT INTO produto (nome, preco, marca, codigo, caminho_img)
             VALUES (?, ?, ?, ?, ?)`,
            [nome, preco, marca, codigo, imagem]
        )

        res.status(201).json({
            msg: "Produto cadastrado, ID = " + resultado[0].insertId,
            caminho_img: imagem
        })
    } catch (error) {
        res.status(error.status || 500).json({erro: error.message})
    }
})

// Atualiza a imagem de um produto a partir de um link do Google Drive
// (aceita também qualquer URL http(s) externa).
app.put("/produto/:id/imagem", async (req, res) => {
    try {
        const id = req.params.id
        const imagem = urlImagemExterna(req.body.caminho_img)
        if (!imagem) {
            throw falha(400, "caminho_img é obrigatório")
        }

        const resultado = await db.pool.query(
            "UPDATE produto SET caminho_img = ? WHERE id = ?",
            [imagem, id]
        )

        if (resultado[0].affectedRows === 0) {
            throw falha(404, "Produto não encontrado")
        }

        res.status(200).json({
            msg: "Imagem do produto atualizada",
            caminho_img: imagem
        })
    } catch (error) {
        res.status(error.status || 500).json({erro: error.message})
    }
})

// AV3 - COMPRAS
// Consulta base para o histórico: uma linha por item, agrupada depois em compras.
const SQL_COMPRAS = `
    SELECT c.id AS compra_id,
           c.data_compra,
           c.valor_total,
           ci.id AS item_id,
           ci.produto_id,
           p.nome AS produto_nome,
           ci.quantidade,
           ci.preco_unitario,
           ci.subtotal
    FROM compra c
    LEFT JOIN compra_item ci ON ci.compra_id = c.id
    LEFT JOIN produto p ON p.id = ci.produto_id
    WHERE c.cliente_id = ?`

function agrupar_compras(linhas) {
    const compras = []
    const porId = new Map()

    for (const linha of linhas) {
        let compra = porId.get(linha.compra_id)
        if (!compra) {
            compra = {
                id: linha.compra_id,
                data_compra: linha.data_compra,
                valor_total: Number(linha.valor_total),
                itens: []
            }
            porId.set(linha.compra_id, compra)
            compras.push(compra)
        }

        if (linha.item_id !== null) {
            compra.itens.push({
                produto_id: linha.produto_id,
                produto_nome: linha.produto_nome,
                quantidade: linha.quantidade,
                preco_unitario: Number(linha.preco_unitario),
                subtotal: Number(linha.subtotal)
            })
        }
    }

    return compras
}

// CADASTRAR COMPRA (exige JWT e recebe uma lista de produtos)
// Body: { "produtos": [{ "id": 1, "quantidade": 2 }, { "id": 5, "quantidade": 1 }] }
// Também aceita a lista diretamente: [{ "id": 1, "quantidade": 2 }]
app.post("/compra", autenticar, async (req, res) => {
    const connection = await db.pool.getConnection()

    try {
        const itens = Array.isArray(req.body) ? req.body : req.body && req.body.produtos

        if (!Array.isArray(itens) || itens.length === 0) {
            throw falha(400, 'Envie uma lista de produtos: { "produtos": [{ "id": 1, "quantidade": 2 }] }')
        }

        const pedidos = itens.map((item, indice) => {
            const id = Number(item && (item.id !== undefined ? item.id : item.produto_id))
            const quantidade = Number(item && item.quantidade !== undefined ? item.quantidade : 1)

            if (!Number.isInteger(id) || id <= 0) {
                throw falha(400, `Item ${indice + 1}: "id" do produto inválido`)
            }
            if (!Number.isInteger(quantidade) || quantidade < 1) {
                throw falha(400, `Item ${indice + 1}: "quantidade" deve ser um inteiro maior que zero`)
            }

            return { id, quantidade }
        })

        await connection.beginTransaction()

        // O preço vem do banco, nunca do cliente.
        const produtos = []
        for (const pedido of pedidos) {
            const [linhas] = await connection.execute(
                "SELECT id, nome, preco FROM produto WHERE id = ?",
                [pedido.id]
            )
            const produto = linhas[0]
            if (!produto) {
                throw falha(404, `Produto id ${pedido.id} não encontrado`)
            }

            const precoUnitario = Number(produto.preco)
            produtos.push({
                id: produto.id,
                nome: produto.nome,
                quantidade: pedido.quantidade,
                preco_unitario: precoUnitario,
                subtotal: Number((precoUnitario * pedido.quantidade).toFixed(2))
            })
        }

        const valorTotal = Number(
            produtos.reduce((soma, produto) => soma + produto.subtotal, 0).toFixed(2)
        )

        const [compra] = await connection.execute(
            "INSERT INTO compra (cliente_id, valor_total) VALUES (?, ?)",
            [req.usuario.id, valorTotal]
        )
        const compraId = compra.insertId

        for (const produto of produtos) {
            await connection.execute(
                `INSERT INTO compra_item
                    (compra_id, produto_id, quantidade, preco_unitario, subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [compraId, produto.id, produto.quantidade, produto.preco_unitario, produto.subtotal]
            )
        }

        await connection.commit()

        res.status(201).json({
            msg: "Compra cadastrada com sucesso",
            id: compraId,
            cliente_id: req.usuario.id,
            data_compra: new Date(),
            valor_total: valorTotal,
            itens: produtos
        })
    } catch (error) {
        try {
            await connection.rollback()
        } catch (e) {}
        res.status(error.status || 500).json({erro: error.message})
    } finally {
        connection.release()
    }
})

// CONSULTAR AS COMPRAS REALIZADAS PELO USUÁRIO LOGADO (exige JWT)
app.get("/compra", autenticar, async (req, res) => {
    try {
        const [linhas] = await db.pool.query(
            SQL_COMPRAS + " ORDER BY c.data_compra DESC, ci.id ASC",
            [req.usuario.id]
        )
        res.status(200).json(agrupar_compras(linhas))
    } catch (error) {
        res.status(500).json({erro: error.message})
    }
})

// CONSULTAR UMA COMPRA ESPECÍFICA DO USUÁRIO LOGADO (exige JWT)
app.get("/compra/:id", autenticar, async (req, res) => {
    try {
        const [linhas] = await db.pool.query(
            SQL_COMPRAS + " AND c.id = ? ORDER BY ci.id ASC",
            [req.usuario.id, req.params.id]
        )

        if (linhas.length === 0) {
            return res.status(404).json({mensagem: "Compra não encontrada para este usuário"})
        }

        res.status(200).json(agrupar_compras(linhas)[0])
    } catch (error) {
        res.status(500).json({erro: error.message})
    }
})

app.listen(port, () => {
    console.log("API rodando na porta  " + port)
})
 
// https//:dontpad.com/backendapi
function autenticar(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null){
        return res.status(401).json({erro: "Token não enviado, usar Authorization Bearer <token>"})
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
        if (err) return res.status(403).json({erro: "Token inválido"})
        req.usuario = usuario
        next()
    })   
}