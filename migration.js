
const db = require("./db")

// AV3 - IMAGENS DOS PRODUTOS
// As imagens NÃO são salvas neste repositório (GitHub). O banco guarda apenas
// a URL pública da imagem no campo produto.caminho_img.
// As URLs abaixo apontam para arquivos hospedados no Wikimedia Commons.
// Para usar o Google Drive: compartilhe a imagem como "qualquer pessoa com o
// link" e envie o link para a rota PUT /produto/:id/imagem (ela converte para
// o formato direto automaticamente).
const IMAGENS_PRODUTOS = {
    'FORD-2026-001': 'https://commons.wikimedia.org/wiki/Special:FilePath/2020_Ford_Mustang_5.0_GT_V8.jpg',
    'FORD-2026-003': 'https://commons.wikimedia.org/wiki/Special:FilePath/2019_Ford_Ranger_T6_XLS_(gray).jpg',
    'FORD-2026-007': 'https://commons.wikimedia.org/wiki/Special:FilePath/2021_Ford_Bronco_Sport.jpg',
    'FORD-2026-009': 'https://commons.wikimedia.org/wiki/Special:FilePath/2020_Ford_F-150_Platinum_au_SIAM_2020.jpg',
    'FORD-2026-027': 'https://commons.wikimedia.org/wiki/Special:FilePath/Ford_GT_High_Quality.jpg',
    'DODGE-2026-016': 'https://commons.wikimedia.org/wiki/Special:FilePath/Dodge_Charger_R-T_(5482372577).jpg',
    'DODGE-2026-018': 'https://commons.wikimedia.org/wiki/Special:FilePath/Dodge_Challenger_Et%C3%A92016.jpg',
    'DODGE-2026-019': 'https://commons.wikimedia.org/wiki/Special:FilePath/Dodge_Challenger_SRT-8_NASCAR_(MIAS_%2714).JPG',
    'DODGE-2026-024': 'https://commons.wikimedia.org/wiki/Special:FilePath/CIAS_2013_-_2013_Dodge_Viper_SRT_GTS_(8478784053).jpg',
    'DODGE-2026-025': 'https://commons.wikimedia.org/wiki/Special:FilePath/Dodge_Ram_1500_(15687505043).jpg',
    'FORD-2026-002': 'https://commons.wikimedia.org/wiki/Special:FilePath/Ford_Mustang_Mach-E.jpg',
    'FORD-2026-004': 'https://commons.wikimedia.org/wiki/Special:FilePath/Ford_Ranger_(T6%2C_P703)_Wildtrak_IMG_7320.jpg',
    'FORD-2026-008': 'https://commons.wikimedia.org/wiki/Special:FilePath/2018_Ford_F-150_Limited_au_SIAM_2018.jpg',
    'FORD-2026-010': 'https://commons.wikimedia.org/wiki/Special:FilePath/Ford_Escape_(fourth_generation)_DSC_7799.jpg',
    'FORD-2026-015': 'https://commons.wikimedia.org/wiki/Special:FilePath/2011-2015_Ford_Explorer_Limited.JPG',
    'DODGE-2026-020': 'https://commons.wikimedia.org/wiki/Special:FilePath/18_Dodge_Durango_GT.jpg',
    'DODGE-2026-021': 'https://commons.wikimedia.org/wiki/Special:FilePath/Dodge_Durango_(48610961377).jpg',
    'DODGE-2026-023': 'https://commons.wikimedia.org/wiki/Special:FilePath/23_Dodge_Hornet_GT.jpg',
    'DODGE-2026-026': 'https://commons.wikimedia.org/wiki/Special:FilePath/Dodge_Ram_1500_(16120013200).jpg',
    'DODGE-2026-029': 'https://commons.wikimedia.org/wiki/Special:FilePath/Dodge_Charger_Daytona_(2024)_MYLE_Festival_2025_DSC_9392.jpg'
}

function imagemExterna(nome, codigo) {
    if (IMAGENS_PRODUTOS[codigo]) {
        return IMAGENS_PRODUTOS[codigo]
    }
    // Produtos sem foto própria continuam com uma imagem externa provisória.
    return "https://placehold.co/640x360/222222/ffffff?text=" + encodeURIComponent(nome)
}

// ESTRUTURA DA TABELA CLIENTE
const ESTRUTURA_CLIENTE = `
DROP TABLE IF EXISTS cliente;
CREATE TABLE cliente (
    id int NOT NULL AUTO_INCREMENT,
    nome varchar(50) NOT NULL,
    cpf char(14) NOT NULL,
    celular char(14) NOT NULL,
    email varchar(50) NOT NULL,
    senha varchar(512)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY cpf (cpf),
    UNIQUE KEY email (email)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 ;`

// DADOS DA TABELA CLIENTE
const DADOS_CLIENTE = `
INSERT INTO cliente (nome, cpf, celular, email, senha) VALUES
('Lucas Silva', '222.333.444-55', '(42)99888-1111', 'lucas.silva@gmail.com', 'JSUAHSIDHAISUHD'),
('Mariana Costa', '333.444.555-66', '(41)99777-2222', 'mari.costa@hotmail.com', 'KASJDKAJSHDKAJS'),
('Carlos Eduardo', '444.555.666-77', '(11)99666-3333', 'carlos.edu@outlook.com', 'QWEOIUQWOIEUQWO'),
('Ana Beatriz', '555.666.777-88', '(21)99555-4444', 'ana.bia@gmail.com', 'ZMXNCBVMZNCBVZ'),
('Rodrigo Souza', '666.777.888-99', '(31)99444-5555', 'rodrigo.souza@yahoo.com', 'PLMOKNJBHIUYT'),
('Juliana Mendes', '777.888.999-00', '(42)99333-6666', 'ju.mendes@gmail.com', 'OEIUROYTIREUYT'),
('Fernando Dias', '888.999.000-11', '(43)99222-7777', 'fernando.dias@outlook.com', 'ASDFGHJKLPOIUY'),
('Beatriz Rocha', '999.000.111-22', '(41)99111-8888', 'bia.rocha@hotmail.com', 'MNBVCXZLKJHGFD'),
('Ricardo Alves', '000.111.222-33', '(11)99000-9999', 'ricardo.alves@gmail.com', 'POIUYTREWQASDF'),
('Patrício Antunes', '123.456.789-10', '(21)98999-0000', 'paty.antunes@gmail.com', 'ZXCVBNMASDFGHJ');`

// ESTRUTURA DA TABELA PRODUTO (com campo de imagem externa)
const ESTRUTURA_PRODUTO = `
DROP TABLE IF EXISTS produto;
CREATE TABLE produto (
    id int NOT NULL AUTO_INCREMENT,
    nome varchar(100) NOT NULL,
    preco decimal(10,2) NOT NULL,
    marca varchar(50) NOT NULL,
    codigo varchar(30) NOT NULL,
    caminho_img varchar(1000) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY codigo (codigo)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 ;`

// DADOS DA TABELA PRODUTO
const PRODUTOS = [
    ['Ford Mustang GT', 320000.00, 'Ford', 'FORD-2026-001'],
    ['Ford Mustang Mach-E', 350000.00, 'Ford', 'FORD-2026-002'],
    ['Ford Ranger XLS', 220000.00, 'Ford', 'FORD-2026-003'],
    ['Ford Ranger Limited', 310000.00, 'Ford', 'FORD-2026-004'],
    ['Ford Maverick Lariat', 240000.00, 'Ford', 'FORD-2026-005'],
    ['Ford Territory Titanium', 215000.00, 'Ford', 'FORD-2026-006'],
    ['Ford Bronco Sport', 260000.00, 'Ford', 'FORD-2026-007'],
    ['Ford F-150 Lariat', 480000.00, 'Ford', 'FORD-2026-008'],
    ['Ford F-150 Platinum', 550000.00, 'Ford', 'FORD-2026-009'],
    ['Ford Escape Titanium', 230000.00, 'Ford', 'FORD-2026-010'],
    ['Ford Focus Titanium', 95000.00, 'Ford', 'FORD-2026-011'],
    ['Ford Fiesta SE', 55000.00, 'Ford', 'FORD-2026-012'],
    ['Ford EcoSport Titanium', 85000.00, 'Ford', 'FORD-2026-013'],
    ['Ford Edge ST', 280000.00, 'Ford', 'FORD-2026-014'],
    ['Ford Explorer Limited', 390000.00, 'Ford', 'FORD-2026-015'],
    ['Dodge Charger R/T', 350000.00, 'Dodge', 'DODGE-2026-016'],
    ['Dodge Charger SRT Hellcat', 650000.00, 'Dodge', 'DODGE-2026-017'],
    ['Dodge Challenger R/T', 330000.00, 'Dodge', 'DODGE-2026-018'],
    ['Dodge Challenger SRT Demon', 750000.00, 'Dodge', 'DODGE-2026-019'],
    ['Dodge Durango GT', 310000.00, 'Dodge', 'DODGE-2026-020'],
    ['Dodge Durango SRT', 480000.00, 'Dodge', 'DODGE-2026-021'],
    ['Dodge Journey SXT', 90000.00, 'Dodge', 'DODGE-2026-022'],
    ['Dodge Hornet GT', 220000.00, 'Dodge', 'DODGE-2026-023'],
    ['Dodge Viper GTS', 850000.00, 'Dodge', 'DODGE-2026-024'],
    ['Dodge Ram 1500', 420000.00, 'Dodge', 'DODGE-2026-025'],
    ['Dodge Ram 2500', 500000.00, 'Dodge', 'DODGE-2026-026'],
    ['Ford GT', 2500000.00, 'Ford', 'FORD-2026-027'],
    ['Ford Bronco Wildtrak', 350000.00, 'Ford', 'FORD-2026-028'],
    ['Dodge Charger Daytona', 400000.00, 'Dodge', 'DODGE-2026-029'],
    ['Dodge Challenger SXT', 280000.00, 'Dodge', 'DODGE-2026-030']
]

const DADOS_PRODUTO = "INSERT INTO produto (nome, preco, marca, codigo, caminho_img) VALUES " +
    PRODUTOS.map(([nome, preco, marca, codigo]) =>
        `('${nome.replace(/'/g, "''")}', ${preco.toFixed(2)}, '${marca}', '${codigo}', '${imagemExterna(nome, codigo)}')`
    ).join(",\n") + ";"

// AV3 - ESTRUTURA DAS TABELAS DE COMPRA
// Uma compra tem vários itens; cada item guarda o preço unitário no momento
// da compra para que o histórico não mude se o preço do produto for alterado.
const LIMPAR_COMPRAS = `
DROP TABLE IF EXISTS compra_item;
DROP TABLE IF EXISTS compra;`

const ESTRUTURA_COMPRA = `
CREATE TABLE compra (
    id int NOT NULL AUTO_INCREMENT,
    cliente_id int NOT NULL,
    data_compra datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_total decimal(12,2) NOT NULL,
    PRIMARY KEY (id),
    KEY fk_compra_cliente (cliente_id),
    CONSTRAINT fk_compra_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ;`

const ESTRUTURA_COMPRA_ITEM = `
CREATE TABLE compra_item (
    id int NOT NULL AUTO_INCREMENT,
    compra_id int NOT NULL,
    produto_id int NOT NULL,
    quantidade int NOT NULL,
    preco_unitario decimal(12,2) NOT NULL,
    subtotal decimal(12,2) NOT NULL,
    PRIMARY KEY (id),
    KEY fk_item_compra (compra_id),
    KEY fk_item_produto (produto_id),
    CONSTRAINT fk_item_compra FOREIGN KEY (compra_id) REFERENCES compra (id) ON DELETE CASCADE,
    CONSTRAINT fk_item_produto FOREIGN KEY (produto_id) REFERENCES produto (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ;`

// FUNÇÃO PARA CRIAR AS TABELAS
async function criar_tabelas() {
    const connection = await db.pool.getConnection();

    try {
        await connection.beginTransaction();

        // As tabelas de compra são removidas antes das tabelas pai (cliente/produto)
        // por causa das chaves estrangeiras.
        console.log("Limpando tabelas de compra...");
        await connection.query(LIMPAR_COMPRAS);

        console.log("Criando tabela 'cliente'...");
        await connection.query(ESTRUTURA_CLIENTE);
        await connection.query(DADOS_CLIENTE);

        console.log("Criando tabela 'produto'...");
        await connection.query(ESTRUTURA_PRODUTO);
        await connection.query(DADOS_PRODUTO);

        console.log("Criando tabelas 'compra' e 'compra_item'...");
        await connection.query(ESTRUTURA_COMPRA);
        await connection.query(ESTRUTURA_COMPRA_ITEM);

        await connection.commit();

        console.log("Migration executada com sucesso!");
        process.exit(0);

    } catch (error) {
        await connection.rollback();
        console.log(error);
        process.exit(1);

    } finally {
        connection.release();
    }
}

criar_tabelas()
