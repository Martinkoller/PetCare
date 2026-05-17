# Backup e Restore do Banco de Dados — AgiliPet

## Requisitos

- `mysqldump` instalado (`sudo apt install mysql-client` no Ubuntu)
- Variável `DATABASE_URL` configurada em `server/.env`

## Fazer Backup

```bash
./scripts/backup-mysql.sh
```

O dump será salvo em `./backups/petcare_YYYYMMDD_HHMMSS.sql.gz`.

### Variáveis opcionais

| Variável       | Default      | Descrição                              |
|---------------|--------------|----------------------------------------|
| `BACKUP_DIR`  | `./backups`  | Pasta onde os dumps são salvos         |
| `KEEP_DAYS`   | `30`         | Dias de retenção (dumps mais antigos são deletados) |

### Cron (backup diário às 02h)

```cron
0 2 * * * cd /path/to/petcare && ./scripts/backup-mysql.sh >> ./backups/backup.log 2>&1
```

## Restaurar Backup

```bash
# Identificar o arquivo de backup
ls backups/

# Restaurar (substitua os valores conforme seu .env)
gunzip -c backups/petcare_YYYYMMDD_HHMMSS.sql.gz | \
  mysql -h HOST -P PORT -u USER -pPASS DBNAME
```

### Exemplo com DATABASE_URL

```bash
# Extrai variáveis do .env e restaura
source server/.env
# Parse da URL: mysql://user:pass@host:port/dbname
gunzip -c backups/petcare_20260517_020000.sql.gz | \
  mysql -h localhost -P 3306 -u root -psenha petcare
```

## Verificar integridade do dump

```bash
gunzip -c backups/petcare_YYYYMMDD_HHMMSS.sql.gz | head -20
```

A saída deve mostrar o cabeçalho do mysqldump com `-- MySQL dump`.
