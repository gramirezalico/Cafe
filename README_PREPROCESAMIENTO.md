# 🔄 Sistema de Preprocesamiento de Datos de Encuesta

## 📋 Descripción

El backend ahora incluye un sistema automático de preprocesamiento que transforma y normaliza los datos de la encuesta antes de enviarlos al webhook de n8n. Esto asegura que los datos lleguen en un formato consistente y limpio.

## ✨ Transformaciones Aplicadas

### 1. **Normalización de Nombres de Campos**
Convierte los nombres técnicos de campos a nombres más legibles:

| Campo Original | Campo Procesado |
|----------------|-----------------|
| `nombre_marca` | `Nombre marca` |
| `personalidad_marca` | `Personalidad marca` |
| `valores_marca` | `Valores marca` |
| `audiencia_producto` | `Tipo de audiencia` |
| `emociones_marca` | `Emociones marca` |
| `informacion_producto` | `Información pertinente` |
| `propuesta_valor` | `Propuesta de valor` |
| `colores_marca` | `Colores` |
| `estilo_grafico` | `Estilo grafico` |
| `tamano_empaque` | `Tamaño del empaque` |
| `referencia_cultural` | `Referencia cultural` |
| `referencia_competidor` | `Referencia de algún competidor` |
| `factor_diferenciador` | `Factor diferenciador` |
| `elementos_juntos` | `Elementos gráficos Juntos` |
| `elementos_similares` | `Elementos gráficos Similares` |
| `elementos_completos` | `Elementos gráficos Completos` |
| `elementos_continuos` | `Elementos gráficos Posicion` |

### 2. **Limpieza de Texto**
- Elimina espacios extra al inicio y final
- Capitaliza la primera letra de cada campo
- Normaliza la estructura de texto

### 3. **Procesamiento de Opciones Múltiples**
Para campos que contienen múltiples valores separados por comas:
- Limpia cada opción individualmente
- Capitaliza cada elemento
- Reensambla con formato consistente

**Ejemplo:**
```
Entrada: "lenta, pegada"
Salida: "Lenta, Pegada"
```

### 4. **Normalización de Referencias de Competidor**
Convierte respuestas negativas a un formato estándar:
- `"No"` → `"No tiene referencia específica"`
- `"ninguno"` → `"No tiene referencia específica"`
- `"no tengo"` → `"No tiene referencia específica"`

### 5. **Validación de Escalas Likert**
Para campos numéricos (1-7):
- Valida que estén en el rango correcto
- Convierte a string normalizado
- Registra advertencias para valores fuera de rango

### 6. **Metadatos de Procesamiento**
Agrega información adicional:
```json
{
  "processed_at": "2025-07-14T20:58:04.977Z",
  "data_version": "2.0",
  "processing_notes": "Datos preprocesados y normalizados",
  "transformations_applied": [...]
}
```

## 🧪 Ejemplo de Transformación

### Datos de Entrada (Raw):
```json
{
  "nombre_marca": "EPICOFFEE",
  "personalidad_marca": "lenta, pegada",
  "referencia_competidor": "No",
  "elementos_juntos": "4"
}
```

### Datos de Salida (Procesados):
```json
{
  "Nombre marca": "EPICOFFEE",
  "Personalidad marca": "Lenta, Pegada",
  "Referencia de algún competidor": "No tiene referencia específica",
  "Elementos gráficos Juntos": "4",
  "processed_at": "2025-07-14T20:58:04.977Z",
  "data_version": "2.0",
  "processing_notes": "Datos preprocesados y normalizados"
}
```

## 🔗 Endpoints Disponibles

### 1. **POST /api/encuesta** (Principal)
- Recibe datos de encuesta
- Aplica preprocesamiento automático
- Envía a webhook n8n
- Guarda localmente

### 2. **POST /api/test-preprocessing** (Pruebas)
- Permite probar el preprocesamiento sin enviar a n8n
- Retorna tanto datos originales como procesados
- Incluye log de transformaciones aplicadas

### 3. **GET /api/encuestas** (Consulta)
- Retorna todas las encuestas guardadas
- Datos ya procesados

## 📊 Beneficios

1. **Consistencia**: Todos los datos llegan al webhook en formato uniforme
2. **Legibilidad**: Nombres de campos más descriptivos
3. **Validación**: Detección automática de datos fuera de rango
4. **Trazabilidad**: Log completo de transformaciones aplicadas
5. **Robustez**: Manejo de errores con guardado local como respaldo

## 🚀 Uso

### Para Probar el Preprocesamiento:
```bash
cd backend
node test_preprocessing.js
```

### Para Ver el Servidor en Acción:
```bash
cd backend
node app.js
```

### Para Enviar Datos de Prueba:
```bash
curl -X POST http://localhost:3000/api/test-preprocessing \
  -H "Content-Type: application/json" \
  -d '{"nombre_marca": "EPICOFFEE", "personalidad_marca": "lenta, pegada"}'
```

## ⚠️ Notas Importantes

- El preprocesamiento es **no destructivo** - los datos originales se preservan en logs
- Si el webhook n8n falla, los datos procesados se guardan localmente
- Todas las transformaciones son registradas para auditoría
- El sistema es **retrocompatible** con datos existentes
