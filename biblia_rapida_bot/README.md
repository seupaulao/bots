## Bot Telegram - Biblia Rapida

Bot Telegram

Objetivo : ter  uma biblia de acesso rápido para pesquisa e estudo

## Funções

- ler verso
- ler capítulo
- procurar palavra
- dicionário

## transformando blv para blv_vet


```bash
sed -i 's/\"\:/\"\|/g' amostra.js
sed -i 's/^/\{\"referencia\"\:/g' amostra.js 
sed -i 's/|/\, \"texto\"\:/g' amostra.js
sed -i 's/\,$/\}\,/g' amostra.js
```

