const qtdversos = require('./qtdversos');
const biblia = require('./blv');
const hebraico = require('./heb');
const grego = require('./grc');
const transliteracao = require('./translit');
const blv = require('./blvetor');
const base1 = require('./base1');
const base2 = require('./base2');
const base3 = require('./base3');
const base4 = require('./base4');
const base5 = require('./base5');


exports.get_refs = () => {
    return [
        "GEN","EXO","LEV","NUM","DEU","JOS","JDG","RUT","1SA","2SA",
        "1KI","2KI","1CH","2CH","EZR","NEH","EST","JOB","PSA","PRO",
        "ECC","SOL","ISA","JER","LAM","EZE","DAN","HOS","JOE","AMO",
        "OBA","JON","MIC","NAH","HAB","ZEP","HAG","ZEC","MAL","MAT",
        "MAR","LUK","JOH","ACT","ROM","1CO","2CO","GAL","EPH","PHI",
        "COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAM","1PE",
        "2PE","1JO","2JO","3JO","JUD","REV"
    ];
    
}

exports.montar_inserts = () => {
   const conteudo = blv.get_blv_vetor();
   for (let item of conteudo) {
     let codigos = item['referencia'].split('_');
     let liv = codigos[0];
     let cap = parseInt(codigos[1]);
     let ver = parseInt(codigos[2]);
     let tx = item['texto'].trim();
     console.log("INSERT INTO BIBLIA(CO_LIVRO, CO_CAPITULO, CO_VERSICULO, DS_TEXTO, FL_LIKE) VALUES ('",liv,"',",cap,",",ver,",'",tx,"',","0);");
   }
}

exports.montar_referencia_biblia = (chave) => {
    let vetor = chave.split('_');
    let valor = '';
    if (vetor.length > 2) {
        const livro = vetor[0];
        const capitulo = vetor[1];
        const versiculo = vetor[2];
        const indice = this.get_refs().indexOf(livro);
        const nomelivro = this.get_livro(indice);
        valor = nomelivro+ " " + capitulo +":" + versiculo;
    } else {
        const livro = vetor[0];
        const capitulo = vetor[1];
        const indice = this.get_refs().indexOf(livro);
        const nomelivro = this.get_livro(indice);
        valor = nomelivro+ " " + capitulo;
    }
    return valor;
}

exports.get_livros = () => { 
    return [
    "GÊNESIS","ÊXODO","LEVÍTICO","NÚMEROS","DEUTERONÔMIO",
    "JOSUÉ","JUÍZES","RUTE","I SAMUEL","II SAMUEL",
    "I REIS","II REIS","I CRÔNICAS","II CRÔNICAS","ESDRAS",
    "NEEMIAS","ESTER","JÓ","SALMOS","PROVÉRBIOS","ECLESIASTES",
    "CANTARES","ISAÍAS","JEREMIAS","LAMENTAÇÕES","EZEQUIEL","DANIEL",
    "OSÉIAS","JOEL","AMÓS","OBADIAS","JONAS","MIQUÉIAS","NAUM",
    "HABACUQUE","SOFONIAS","AGEU","ZACARIAS","MALAQUIAS","MATEUS",
    "MARCOS","LUCAS","JOÃO","ATOS","ROMANOS","I CORÍNTIOS","II CORÍNTIOS",
    "GÁLATAS","EFÉSIOS","FILIPENSES","COLOSSENSES","I TESSALONICENSES",
    "II TESSALONICENSES","I TIMÓTEO","II TIMÓTEO","TITO","FILEMON",
    "HEBREUS","TIAGO","I PEDRO","II PEDRO","I JOÃO","II JOÃO",
    "III JOÃO","JUDAS","APOCALIPSE"
];
}

exports.get_livro = (i) => { 
    const livros = this.get_livros();
    return livros[i];
}

exports.get_ref = (i) => { 
    const refs = this.get_refs();
    return refs[i];
}

exports.get_capitulos = (i) => { 
    const capitulosPorLivro = [
    50, 40, 27, 36, 34,  // Pentateuco
    24, 21, 4, 31, 24,   // Josué – 2 Samuel
    22, 25, 29, 36, 10,  // 1 Reis – Esdras
    13, 10, 42, 150, 31, // Neemias – Provérbios
    12, 8, 66, 52, 5,    // Eclesiastes – Lamentações
    48, 12, 14, 3, 9,    // Ezequiel – Amós
    1, 4, 7, 3, 3,       // Obadias – Sofonias
    2, 14, 4,            // Ageu – Malaquias
    28, 16, 24, 21, 28,  // Evangelhos e Atos
    16, 16, 13, 6, 6,    // Romanos – Efésios
    4, 4, 5, 3, 6,       // Filipenses – 1 Timóteo
    4, 3, 1, 13, 5,      // 2 Timóteo – Tiago
    5, 3, 5, 1, 1,       // 1 Pedro – 3 João
    1, 22               // Judas – Apocalipse
  ];
   return capitulosPorLivro[i];
}

exports.get_qtd_versos = (posicaoLivro, capitulo) => {
    return qtdversos.get_qtd_versos(posicaoLivro, capitulo);
}

exports.get_texto_chave = (chave) => {
        return biblia.get_texto(chave);
}

exports.get_grego_chave = (chave) => {
        return grego.get_texto(chave);
}

exports.get_hebraico_chave = (chave) => {
        return hebraico.get_texto(chave);
}

exports.get_translit_chave = (chave) => {
        return transliteracao.get_texto(chave);
}

exports.get_palavra_biblia = (palavra) => {
    const conteudo = blv.get_blv_vetor();
    let saida = [];

    for (let item of conteudo) {
        if (item.texto.toLowerCase().indexOf(palavra.toLowerCase()) >= 0) {
            saida.push(item);
        }
    }

    return saida;
}


exports.buscar_palavra_dicionario = (palavra) => {
    //teste com base 1
    let significado = [];
    consultar_na_base(palavra, significado, base1);
    //a - d
    if (teste_A_a_D(palavra)) {
        consultar_na_base(palavra, significado, base2);
    }
    //e - i
    else if (teste_E_a_I(palavra)) {
        consultar_na_base(palavra, significado, base3);
    }
    //j - o
    else if (teste_J_a_O(palavra)) {
        consultar_na_base(palavra, significado, base4);
    }
    //p - z
    else {
        consultar_na_base(palavra, significado, base5);
    }

    return significado;
}

exports.get_palavras_dicionario_por_letra = (letra) => {

    let palavras = getPalavrasBase(letra, base1);

    if (teste_A_a_D(letra)) {
       const temp = getPalavrasBase(letra, base2);
       palavras = concatenar(palavras, temp);
    } 
    else if (teste_E_a_I(letra)) {
        const temp = getPalavrasBase(letra, base3);
        palavras = concatenar(palavras, temp); 
    }
    else if (teste_J_a_O(letra)) {
        const temp = getPalavrasBase(letra, base4);
        palavras = concatenar(palavras, temp); 
    }
    else {
        const temp = getPalavrasBase(letra, base5);
        palavras = concatenar(palavras, temp); 
    }

    return palavras.sort();
}



function concatenar(temp1, temp2) {
    let palavras = [];
    for (let item of temp2) {
        if ( temp1.indexOf( item.toLowerCase() ) < 0 ) {
            palavras.add(item.toLowerCase())
        }
    }
    return palavras.concat(temp1);
}


function getPalavrasBase(letra, base) {
    let palavras = [];
    for (let x of base.get_base()) {
        if (x.palavra[0].toLowerCase() == letra.toLowerCase()) {
            palavras.push(x.palavra);
        }
    }
    return palavras;
}

function teste_J_a_O(palavra) {
    return palavra[0].toLowerCase() == "j" || palavra[0].toLowerCase() == "k" ||
        palavra[0].toLowerCase() == "l" || palavra[0].toLowerCase() == "m" ||
        palavra[0].toLowerCase() == "n" || palavra[0].toLowerCase() == "o";
}

function teste_E_a_I(palavra) {
    return palavra[0].toLowerCase() == "e" || palavra[0].toLowerCase() == "f" ||
        palavra[0].toLowerCase() == "g" || palavra[0].toLowerCase() == "h" ||
        palavra[0].toLowerCase() == "i";
}

function teste_A_a_D(palavra) {
    return palavra[0].toLowerCase() == "a" || palavra[0].toLowerCase() == "b" ||
        palavra[0].toLowerCase() == "c" || palavra[0].toLowerCase() == "d";
}

function consultar_na_base(palavra, significado, base) {
    for (let item of base.get_base()) {
        if (item.palavra.trim().toLowerCase() === palavra.toLowerCase()) {
            significado.push(item.texto);
            break;
        }
    }
}

