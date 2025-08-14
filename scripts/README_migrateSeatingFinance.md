---
Descripción: Migrar datos antiguos de Seating y Finanzas a la nueva estructura anidada
---

# Migrar SeatingPlan y Finance a `weddings/{weddingId}`

Este script copia los documentos que aún viven en colecciones de usuario a las nuevas rutas dentro de la boda.

```
node scripts/migrateSeatingFinance.js --uid=<UID_USUARIO> --weddingId=<ID_BODA> [--delete]
```

Parámetros:

| Opción        | Descripción                                                                 |
|---------------|-----------------------------------------------------------------------------|
| `--uid`       | UID Firebase Authentication del usuario dueño de los datos                   |
| `--weddingId` | ID del documento de boda destino                                             |
| `--delete`    | (opcional) Borra los documentos originales una vez copiados                  |

Requisitos previos:
1. Variable `GOOGLE_APPLICATION_CREDENTIALS` apuntando al key JSON de la cuenta de servicio.
2. Proyecto Firebase correcto (`GOOGLE_CLOUD_PROJECT` o `FIREBASE_CONFIG`).

> ⚠️ Recomendado ejecutar primero **sin** `--delete` y verificar en Firestore que los datos aparecen correctamente.

## Qué migra
| Origen                                    | Destino                                       |
|-------------------------------------------|-----------------------------------------------|
| `users/{uid}/userSeatingPlan/seating-autosave` | `weddings/{weddingId}/seatingAutosave`          |
| `users/{uid}/userFinanceMovements/lovendaMovements` | `weddings/{weddingId}/importedMovements`       |

Si el documento de origen no existe simplemente se ignora con una advertencia.

## Ejemplo

```
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
node scripts/migrateSeatingFinance.js --uid=9EstYa0T8WRBm9j0XwnE8zU1iFo1 --weddingId=61ffb907-7fcb-4361-b764-0300b317fe06
```
