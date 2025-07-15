// Script de prueba para el preprocesamiento de datos
const axios = require('axios');

// Datos de ejemplo exactos del usuario
const testData = {
    "nombre_marca": "marcian",
    "personalidad_marca": "Tradicional, Moderna",
    "otro_personalidad_texto": "",
    "valores_marca": "Autenticidad, Excelencia",
    "otro_valor_texto": "",
    "audiencia_producto": "Jóvenes (18-30 años), Adultos jóvenes (30-45 años), Estudiantes",
    "otro_audiencia_texto": "",
    "emociones_marca": "Lujo",
    "otro_emocion_texto": "",
    "informacion_producto": "Instrucciones de conservación",
    "otro_informacion_texto": "",
    "propuesta_valor": "Calidad superior del grano, Origen único/exclusivo",
    "otro_valor_propuesta_texto": "",
    "colores_marca": "Blanco/Grises claros",
    "otro_color_texto": "",
    "estilo_grafico": "Vintage",
    "otro_estilo_texto": "",
    "tamano_empaque": "250 gr",
    "referencia_cultural": "Tradiciones Indígenas",
    "otra_cultura_texto": "",
    "referencia_competidor": "Águila Roja",
    "otro_competidor_texto": "",
    "factor_diferenciador": "Impacto social positivo",
    "otro_diferenciador_texto": "",
    "elementos_juntos": "6",
    "elementos_similares": "5",
    "elementos_completos": "5",
    "elementos_continuos": "6"
};

// Formato esperado de salida
const expectedOutput = {
    "Colores": "Blanco/Grises claros",
    "Nombre marca": "Marcian",
    "Valores marca": "Autenticidad, Excelencia",
    "Estilo grafico": "Vintage",
    "Emociones marca": "Lujo",
    "Tipo de audiencia": "Jóvenes (18-30 años), Adultos jóvenes (30-45 años), Estudiantes",
    "Personalidad marca": "Tradicional, Moderna",
    "Propuesta de valor": "Calidad superior del grano, Origen único/exclusivo",
    "Referencia cultural": "Tradiciones Indígenas",
    "Tamaño del empaque": "250 gr",
    "Factor diferenciador": "Impacto social positivo",
    "Información pertinente": "Instrucciones de conservación",
    "Elementos gráficos Juntos": "6",
    "Elementos gráficos Posicion": "6",
    "Elementos gráficos Completos": "5",
    "Elementos gráficos Similares": "5",
    "Referencia de algún competidor": "Águila Roja"
};

async function testPreprocessing() {
    try {
        console.log("🧪 Probando preprocesamiento de datos...");
        console.log("📥 Datos de entrada:");
        console.log(JSON.stringify(testData, null, 2));
        
        const response = await axios.post('http://localhost:3000/api/test-preprocessing', testData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log("\n✅ Respuesta del servidor:");
        console.log("Status:", response.status);
        console.log("Success:", response.data.success);
        
        console.log("\n📊 Datos procesados:");
        const processedData = response.data.processed_data;
        
        // Filtrar solo los campos principales (sin metadatos)
        const cleanedData = {};
        Object.keys(processedData).forEach(key => {
            if (!key.includes('processed_at') && !key.includes('data_version')) {
                cleanedData[key] = processedData[key];
            }
        });
        
        console.log(JSON.stringify(cleanedData, null, 2));
        
        console.log("\n🎯 Formato esperado:");
        console.log(JSON.stringify(expectedOutput, null, 2));
        
        // Comparar campos importantes
        console.log("\n🔍 Comparación de campos clave:");
        const keyFields = [
            'Nombre marca', 'Personalidad marca', 'Valores marca',
            'Tipo de audiencia', 'Emociones marca', 'Información pertinente',
            'Propuesta de valor', 'Colores', 'Estilo grafico',
            'Tamaño del empaque', 'Referencia cultural', 'Referencia de algún competidor',
            'Factor diferenciador', 'Elementos gráficos Juntos', 'Elementos gráficos Similares',
            'Elementos gráficos Completos', 'Elementos gráficos Posicion'
        ];
        
        let matches = 0;
        keyFields.forEach(field => {
            const processed = cleanedData[field];
            const expected = expectedOutput[field];
            const match = processed === expected;
            matches += match ? 1 : 0;
            
            console.log(`${match ? '✅' : '❌'} ${field}:`);
            if (!match) {
                console.log(`   Procesado: "${processed}"`);
                console.log(`   Esperado:  "${expected}"`);
            }
        });
        
        console.log(`\n📈 Coincidencias: ${matches}/${keyFields.length} (${Math.round(matches/keyFields.length*100)}%)`);
        
    } catch (error) {
        console.error("❌ Error en la prueba:", error.message);
        if (error.response) {
            console.error("Respuesta del servidor:", error.response.data);
        }
    }
}

// Ejecutar prueba solo si el script se ejecuta directamente
if (require.main === module) {
    testPreprocessing();
}

module.exports = { testPreprocessing, testData, expectedOutput };
