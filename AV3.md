# AV3 — imagens externas e compras

## Configuração

Crie o arquivo `.env` na raiz (modelo em `dotenv.txt`):

```
API_PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=senha_do_lab
DB_DATABASE=Antonio3DSC
JWT_SECRET=senha_muit0_forte_2h13u12h3i1uuhia
```

`npm start` executa a migration ( recria as tabelas ) e inicia a API.

## 1. Imagens dos produtos no servidor

Nenhum arquivo de imagem é salvo no repositório. O banco guarda apenas a URL
externa no campo `produto.caminho_img`, que já é devolvida por `GET /produto`
e `GET /produto/:id`.

Os 10 carros com foto cadastrada usam URLs do Wikimedia Commons
(`Special:FilePath/...`, hospedadas fora do repositório). Os demais mantêm
uma imagem externa provisória.

Para usar o Google Drive:

1. Faça upload da imagem no Drive.
2. Compartilhe com "Qualquer pessoa com o link" (visualização).
3. Envie o link de compartilhamento ou o ID do arquivo para a API:

```http
PUT /produto/1/imagem
Authorization: Bearer <token>
Content-Type: application/json

{ "caminho_img": "https://drive.google.com/file/d/ID_DO_ARQUIVO/view?usp=sharing" }
```

A API converte o link para `https://drive.google.com/uc?export=view&id=ID_DO_ARQUIVO`
e grava essa URL no banco. URLs `http(s)` de outros hosts também são aceitas.

Também é possível cadastrar um produto já com imagem:

```http
POST /produto
Content-Type: application/json

{
  "nome": "Ford Mustang GT",
  "preco": 320000.00,
  "marca": "Ford",
  "codigo": "FORD-2026-031",
  "caminho_img": "https://drive.google.com/uc?export=view&id=ID_DO_ARQUIVO"
}
```

## 2. Cadastrar compra (exige JWT)

```http
POST /compra
Authorization: Bearer <token>
Content-Type: application/json

{
  "produtos": [
    { "id": 1, "quantidade": 2 },
    { "id": 5, "quantidade": 1 }
  ]
}
```

Também aceita a lista diretamente no corpo: `[{ "id": 1, "quantidade": 2 }]`.

- Sem token: `401`. Token inválido/expirado: `403`.
- Lista vazia ou quantidade inválida: `400`.
- Produto inexistente: `404` (a transação é revertida).
- Os preços são buscados no banco, nunca recebidos do cliente.
- Tudo é gravado em uma transação: `compra` + `compra_item`.

Resposta `201`:

```json
{
  "msg": "Compra cadastrada com sucesso",
  "id": 1,
  "cliente_id": 1,
  "data_compra": "2026-11-25T12:00:00.000Z",
  "valor_total": 400,
  "itens": [
    { "id": 1, "nome": "Carro A", "quantidade": 2, "preco_unitario": 100, "subtotal": 200 }
  ]
}
```

## 3. Consultar compras do usuário (exige JWT)

```http
GET /compra
Authorization: Bearer <token>
```

Retorna somente as compras do cliente identificado pelo token, com os itens:

```json
[
  {
    "id": 1,
    "data_compra": "2026-11-25T12:00:00.000Z",
    "valor_total": 400,
    "itens": [
      { "produto_id": 1, "produto_nome": "Carro A", "quantidade": 2,
        "preco_unitario": 100, "subtotal": 200 }
    ]
  }
]
```

Para buscar uma compra específica: `GET /compra/:id` (também exige JWT e só
retorna compras do próprio usuário).

## Front-end

Em `Site/`: `produtos.js` adiciona produtos ao carrinho (localStorage),
`carrinho.html` envia a lista para `POST /compra` e `compras.html` exibe o
histórico vindo de `GET /compra`.
