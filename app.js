var axios = require('axios');
var https = require('https');
let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let path = require("path");
let cors = require("cors");
let fs = require("fs");

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, "public")));

// Servir la encuesta desde el directorio principal
app.use('/encuesta', express.static(path.join(__dirname, "..", "Encuesta_Empaque")));

// Ruta principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "Encuesta_Empaque", "index.html"));
});

// Ruta para la encuesta
app.get("/encuesta", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "Encuesta_Empaque", "index.html"));
});
// Función para preprocesar y limpiar los datos de la encuesta
function preprocessSurveyData(rawData) {
    console.log("🔄 Preprocesando datos de la encuesta...");
    
    const processedData = {};
    const transformations = [];
    
    // 1. Mapeo y transformación de campos principales
    const fieldMappings = {
        'nombre_marca': 'Nombre marca',
        'personalidad_marca': 'Personalidad marca', 
        'valores_marca': 'Valores marca',
        'audiencia_producto': 'Tipo de audiencia',
        'emociones_marca': 'Emociones marca',
        'informacion_producto': 'Información pertinente',
        'propuesta_valor': 'Propuesta de valor',
        'colores_marca': 'Colores',
        'estilo_grafico': 'Estilo grafico',
        'tamano_empaque': 'Tamaño del empaque',
        'referencia_cultural': 'Referencia cultural',
        'referencia_competidor': 'Referencia de algún competidor',
        'factor_diferenciador': 'Factor diferenciador',
        'elementos_juntos': 'Elementos gráficos Juntos',
        'elementos_similares': 'Elementos gráficos Similares',
        'elementos_completos': 'Elementos gráficos Completos',
        'elementos_continuos': 'Elementos gráficos Posicion'
    };

    // 2. Procesar cada campo principal y verificar si tiene campo "otro" asociado
    Object.keys(fieldMappings).forEach(originalKey => {
        const newKey = fieldMappings[originalKey];
        let value = rawData[originalKey];
        
        if (value !== undefined && value !== null && value !== '') {
            // Verificar si existe un campo "otro" asociado y si tiene valor
            const otherFieldMap = {
                'personalidad_marca': 'otro_personalidad_texto',
                'valores_marca': 'otro_valor_texto',
                'audiencia_producto': 'otro_audiencia_texto',
                'emociones_marca': 'otro_emocion_texto',
                'informacion_producto': 'otro_informacion_texto',
                'propuesta_valor': 'otro_valor_propuesta_texto',
                'colores_marca': 'otro_color_texto',
                'estilo_grafico': 'otro_estilo_texto',
                'referencia_cultural': 'otra_cultura_texto',
                'referencia_competidor': 'otro_competidor_texto',
                'factor_diferenciador': 'otro_diferenciador_texto'
            };

            // Si tiene campo "otro" asociado, verificar si debe reemplazar el valor
            if (otherFieldMap[originalKey]) {
                const otherField = otherFieldMap[originalKey];
                const otherValue = rawData[otherField];
                
                // Si el valor principal es "Otro" y hay texto en el campo "otro"
                if ((value === 'Otro' || value === 'Otra') && otherValue && otherValue.trim()) {
                    value = otherValue.trim();
                    transformations.push(`Valor "Otro" reemplazado en '${newKey}': "${otherValue}"`);
                }
                // Si el valor contiene "Otro" en una lista, reemplazarlo
                else if (typeof value === 'string' && value.includes('Otro') && otherValue && otherValue.trim()) {
                    value = value.replace(/,?\s*Otro\s*,?/gi, `, ${otherValue.trim()}`);
                    value = value.replace(/^,\s*|,\s*$/g, ''); // Limpiar comas al inicio/final
                    transformations.push(`Valor "Otro" reemplazado en lista '${newKey}': "${otherValue}"`);
                }
            }

            // Procesar el valor final
            processedData[newKey] = processValue(value, newKey, transformations);
        }
    });

    // 3. Limpiar campos que no aparecieron en el mapeo
    // Solo agregar metadatos básicos sin toda la información de debug
    processedData.processed_at = new Date().toISOString();
    processedData.data_version = '2.0';

    console.log("✅ Datos preprocesados correctamente");
    console.log("📊 Campos finales:", Object.keys(processedData).length);
    console.log("🔄 Transformaciones aplicadas:", transformations.length);
    
    return processedData;
}

// Función auxiliar para procesar valores individuales
function processValue(value, fieldName, transformations) {
    if (!value) return value;
    
    let processedValue = value.toString().trim();
    const original = processedValue;
    
    // Procesar campos numéricos (escalas Likert)
    if (fieldName.includes('Elementos gráficos')) {
        const numValue = parseInt(processedValue);
        if (numValue >= 1 && numValue <= 7) {
            return numValue.toString();
        } else {
            console.warn(`⚠️ Valor fuera de rango para ${fieldName}: ${processedValue}`);
            return processedValue;
        }
    }
    
    // Normalizar referencia de competidor
    if (fieldName === 'Referencia de algún competidor') {
        const lowerValue = processedValue.toLowerCase();
        if (lowerValue.includes('no') || lowerValue.includes('ninguno') || 
            lowerValue.includes('no tengo') || lowerValue === 'no tiene referencia específica') {
            transformations.push(`Referencia competidor normalizada: "${original}" → "No"`);
            return 'No';
        }
    }
    
    // Capitalizar primera letra si es texto
    if (processedValue.length > 0) {
        processedValue = processedValue.charAt(0).toUpperCase() + processedValue.slice(1);
    }
    
    // Limpiar opciones múltiples separadas por comas
    if (processedValue.includes(',')) {
        const items = processedValue.split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .map(item => item.charAt(0).toUpperCase() + item.slice(1));
        processedValue = items.join(', ');
        
        if (original !== processedValue) {
            transformations.push(`Opciones múltiples procesadas en '${fieldName}'`);
        }
    }
    
    return processedValue;
}

// API para recibir datos de la encuesta
app.post("/api/encuesta", async (req, res) => {
    try {
        const rawEncuestaData = req.body;
        
        console.log("📥 Datos brutos recibidos:");
        console.log(JSON.stringify(rawEncuestaData, null, 2));
        
        // Preprocesar los datos
        const encuestaData = preprocessSurveyData(rawEncuestaData);
        
        // Agregar timestamp e ID
        encuestaData.timestamp = new Date().toISOString();
        encuestaData.id = Date.now().toString();
        
        console.log("📝 Nueva encuesta procesada:");
        console.log("ID:", encuestaData.id);
        console.log("Marca:", encuestaData['Nombre marca']);
        console.log("Timestamp:", encuestaData.timestamp);
        console.log("📡 Enviando a n8n con Basic Auth (usuario: ChatBot)");
        console.log("📊 Datos procesados de la encuesta:");
        console.log(JSON.stringify(encuestaData, null, 2));
        // Configuración del webhook n8n
        const n8nIndividualWebhookUrl = 'https://apps.alico-sa.com/webhook/SaveToGenerateArte0001';
        
        // Credenciales para Basic Auth
        const username = 'ChatBot';
        const password = 'Alicosa987';
        const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
        
        // Enviar datos al webhook n8n
        const axiosResponse = await axios.post(
            n8nIndividualWebhookUrl,
            {
                ...encuestaData, // Enviar todos los datos de la encuesta
                action: 'envioIndividual'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${basicAuth}`
                },
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                timeout: 10000 // 10 segundos de timeout
            }
        );
        
        // Guardar localmente también (backup)
        const fileName = `encuesta_${encuestaData.id}.json`;
        const filePath = path.join(__dirname, "data", fileName);
        
        // Crear directorio data si no existe
        const dataDir = path.join(__dirname, "data");
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Guardar archivo individual
        fs.writeFileSync(filePath, JSON.stringify(encuestaData, null, 2));
        
        // Actualizar archivo de todas las encuestas
        const allSurveysPath = path.join(__dirname, "data", "todas_encuestas.json");
        let allSurveys = [];
        
        if (fs.existsSync(allSurveysPath)) {
            const existingData = fs.readFileSync(allSurveysPath, 'utf8');
            allSurveys = JSON.parse(existingData);
        }
        
        allSurveys.push(encuestaData);
        fs.writeFileSync(allSurveysPath, JSON.stringify(allSurveys, null, 2));
        
        console.log("✅ Encuesta enviada a n8n y guardada localmente");
        
        res.status(200).json({ 
            success: true,
            message: 'Encuesta procesada correctamente',
            id: encuestaData.id,
            timestamp: encuestaData.timestamp,
            n8nResponse: axiosResponse.data
        });

    } catch (error) {
        console.error("❌ Error al procesar encuesta:", error);
        
        // Intentar guardar localmente aunque falle el webhook
        try {
            const rawEncuestaData = req.body;
            const encuestaData = preprocessSurveyData(rawEncuestaData);
            encuestaData.timestamp = new Date().toISOString();
            encuestaData.id = Date.now().toString();
            encuestaData.error_webhook = error.message;
            encuestaData.error_details = {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };
            
            const dataDir = path.join(__dirname, "data");
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            const fileName = `encuesta_${encuestaData.id}_error.json`;
            const filePath = path.join(__dirname, "data", fileName);
            fs.writeFileSync(filePath, JSON.stringify(encuestaData, null, 2));
            
            console.log("💾 Encuesta procesada y guardada localmente a pesar del error");
            
            // Responder con éxito parcial ya que los datos se guardaron
            res.status(200).json({
                success: true,
                message: "Encuesta procesada y guardada localmente. Error en webhook externo.",
                id: encuestaData.id,
                timestamp: encuestaData.timestamp,
                warning: "Webhook externo falló, pero datos guardados correctamente",
                error_details: error.message
            });
            
        } catch (saveError) {
            console.error("❌ Error adicional al guardar localmente:", saveError);
            res.status(500).json({
                success: false,
                message: "Error crítico del servidor",
                error: error.message,
                save_error: saveError.message
            });
        }
    }
});

// API para obtener todas las encuestas
app.get("/api/encuestas", (req, res) => {
    try {
        const allSurveysPath = path.join(__dirname, "data", "todas_encuestas.json");

        if (fs.existsSync(allSurveysPath)) {
            const data = fs.readFileSync(allSurveysPath, 'utf8');
            const surveys = JSON.parse(data);
            res.json({
                success: true,
                count: surveys.length,
                data: surveys
            });
        } else {
            res.json({
                success: true,
                count: 0,
                data: []
            });
        }
    } catch (error) {
        console.error("❌ Error al obtener encuestas:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener encuestas",
            error: error.message
        });
    }
});

// API para obtener una encuesta específica
app.get("/api/encuesta/:id", (req, res) => {
    try {
        const id = req.params.id;
        const filePath = path.join(__dirname, "data", `encuesta_${id}.json`);

        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            const survey = JSON.parse(data);
            res.json({
                success: true,
                data: survey
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Encuesta no encontrada"
            });
        }
    } catch (error) {
        console.error("❌ Error al obtener encuesta:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener encuesta",
            error: error.message
        });
    }
});

// API para probar el preprocesamiento de datos
app.post("/api/test-preprocessing", (req, res) => {
    try {
        const rawData = req.body;
        console.log("🧪 Probando preprocesamiento con datos:", rawData);
        
        const processedData = preprocessSurveyData(rawData);
        
        res.json({
            success: true,
            message: "Preprocesamiento completado",
            original_data: rawData,
            processed_data: processedData,
            changes_summary: {
                fields_processed: Object.keys(processedData).length,
                processing_time: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error("❌ Error en preprocesamiento de prueba:", error);
        res.status(500).json({
            success: false,
            message: "Error en preprocesamiento",
            error: error.message
        });
    }
});

// Ruta de prueba
app.get("/api/data", (req, res) => {
    res.json({ message: "Backend funcionando correctamente!" });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📝 Encuesta disponible en http://localhost:${PORT}/encuesta`);
    console.log(`📊 API de encuestas en http://localhost:${PORT}/api/encuestas`);
});