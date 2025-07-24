/**
 * Script para generar y analizar informes de cobertura de código
 * Este script puede ejecutarse después de las pruebas para analizar la cobertura
 */

// Importamos el módulo fs para acceso a archivos
const fs = require('fs');
const path = require('path');

// Función para analizar los informes de cobertura
function analyzeCoverage() {
  console.log('Analizando informes de cobertura...');
  
  try {
    // Ruta al informe JSON de cobertura (ajustar según la configuración de Vitest/Jest)
    // Intentar localizar coverage-final.json automáticamente
    const coverageRoot = path.join(__dirname, '../../coverage');
    let coverageFile = path.join(coverageRoot, 'coverage-final.json');

    if (!fs.existsSync(coverageFile)) {
      // Buscar en subdirectorios como v8/, istanbul/, etc.
      const subdirs = fs.existsSync(coverageRoot)
        ? fs.readdirSync(coverageRoot).filter((entry) => fs.statSync(path.join(coverageRoot, entry)).isDirectory())
        : [];
      for (const dir of subdirs) {
        const candidate = path.join(coverageRoot, dir, 'coverage-final.json');
        if (fs.existsSync(candidate)) {
          coverageFile = candidate;
          break;
        }
      }
    }

    // Verificar si finalmente se encontró el archivo
    if (!fs.existsSync(coverageFile)) {
      console.error('No se encontró coverage-final.json. Asegúrate de ejecutar "npm run test:coverage" y que la configuración de Vitest utiliza provider v8.');
      return;
    }
    
    // Leer y parsear el informe
    const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
    
    // Variables para estadísticas
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalLines = 0;
    let coveredLines = 0;
    
    // Componentes/archivos con baja cobertura
    const lowCoverageFiles = [];
    const untested = [];
    
    // Analizar cada archivo
    Object.keys(coverageData).forEach(filePath => {
      const fileData = coverageData[filePath];
      
      // Extraer métricas de este archivo
      const statements = countCoverage(fileData.s);
      const branches = countCoverage(fileData.b);
      const functions = countCoverage(fileData.f);
      const lines = countCoverage(fileData.l);
      
      // Calcular porcentajes
      const statementPct = calculatePercentage(statements.covered, statements.total);
      const branchPct = calculatePercentage(branches.covered, branches.total);
      const functionPct = calculatePercentage(functions.covered, functions.total);
      const linePct = calculatePercentage(lines.covered, lines.total);
      
      // Sumar a los totales
      totalStatements += statements.total;
      coveredStatements += statements.covered;
      totalBranches += branches.total;
      coveredBranches += branches.covered;
      totalFunctions += functions.total;
      coveredFunctions += functions.covered;
      totalLines += lines.total;
      coveredLines += lines.covered;
      
      // Extraer nombre del archivo
      const fileName = path.basename(filePath);
      
      // Verificar si tiene baja cobertura (menos del 70%)
      if ((statementPct + branchPct + functionPct + linePct) / 4 < 70) {
        lowCoverageFiles.push({
          file: fileName,
          path: filePath,
          statementPct,
          branchPct,
          functionPct,
          linePct,
          overallPct: (statementPct + branchPct + functionPct + linePct) / 4
        });
      }
      
      // Verificar si no tiene pruebas
      if (statements.covered === 0) {
        untested.push(fileName);
      }
    });
    
    // Calcular porcentajes totales
    const overallStatementPct = calculatePercentage(coveredStatements, totalStatements);
    const overallBranchPct = calculatePercentage(coveredBranches, totalBranches);
    const overallFunctionPct = calculatePercentage(coveredFunctions, totalFunctions);
    const overallLinePct = calculatePercentage(coveredLines, totalLines);
    
    // Generar informe
    console.log('\n==================== INFORME DE COBERTURA ====================');
    console.log(`Cobertura total: ${((overallStatementPct + overallBranchPct + overallFunctionPct + overallLinePct) / 4).toFixed(2)}%`);
    console.log(`- Statements: ${overallStatementPct.toFixed(2)}% (${coveredStatements}/${totalStatements})`);
    console.log(`- Branches: ${overallBranchPct.toFixed(2)}% (${coveredBranches}/${totalBranches})`);
    console.log(`- Functions: ${overallFunctionPct.toFixed(2)}% (${coveredFunctions}/${totalFunctions})`);
    console.log(`- Lines: ${overallLinePct.toFixed(2)}% (${coveredLines}/${totalLines})`);
    
    // Archivos con baja cobertura
    console.log('\nArchivos con baja cobertura:');
    if (lowCoverageFiles.length === 0) {
      console.log('- Ninguno (todos tienen al menos 70% de cobertura)');
    } else {
      lowCoverageFiles.sort((a, b) => a.overallPct - b.overallPct);
      lowCoverageFiles.forEach(file => {
        console.log(`- ${file.file}: ${file.overallPct.toFixed(2)}%`);
      });
    }
    
    // Archivos sin pruebas
    console.log('\nArchivos sin pruebas:');
    if (untested.length === 0) {
      console.log('- Ninguno (todos los archivos tienen alguna cobertura)');
    } else {
      untested.forEach(file => {
        console.log(`- ${file}`);
      });
    }
    
    // Sugerencias de mejora
    console.log('\nSugerencias de mejora:');
    if (lowCoverageFiles.length > 0) {
      console.log('1. Priorizar la implementación de pruebas para estos archivos con baja cobertura:');
      lowCoverageFiles.slice(0, 5).forEach(file => {
        console.log(`   - ${file.file}`);
      });
    }
    
    if (overallBranchPct < 70) {
      console.log('2. Enfocar en mejorar la cobertura de ramas (condicionales, switch, etc.)');
    }
    
    console.log('\n===============================================================');
    
  } catch (error) {
    console.error('Error al analizar la cobertura:', error);
  }
}

// Función auxiliar para contar elementos cubiertos
function countCoverage(data) {
  if (!data) return { total: 0, covered: 0 };
  
  const total = Object.keys(data).length;
  let covered = 0;
  
  // Para branches (que son arrays)
  if (Array.isArray(data[Object.keys(data)[0]])) {
    for (const key in data) {
      const branches = data[key];
      let branchCovered = 0;
      for (let i = 0; i < branches.length; i++) {
        if (branches[i] > 0) branchCovered++;
      }
      covered += branchCovered;
      total += branches.length - 1; // Ajustar el total para branches
    }
  } 
  // Para otros tipos (statements, functions, lines)
  else {
    for (const key in data) {
      if (data[key] > 0) covered++;
    }
  }
  
  return { total, covered };
}

// Función auxiliar para calcular porcentaje
function calculatePercentage(covered, total) {
  return total === 0 ? 100 : (covered / total) * 100;
}

// Ejecutar el análisis
analyzeCoverage();
