# Controle de Assinaturas Backend

Serviço FastAPI mínimo para o Programa de Controle de Assinatura.

## Executar localmente

1. Criar e ativar um ambiente virtual Python.
2. Instalar dependências:
   ```bash
   pip install -r requirements.txt
   ```
3. Iniciar o servidor:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## Rota

- `GET /` retorna:
  ```json
  {"message": "Bem-vindo ao Programa de Controle de Assinatura"}
  ```
