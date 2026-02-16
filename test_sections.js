const fs = require('fs');
const path = '/app/src/pages/ProcessDatasheet/ComprehensivePumpForm.jsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    
    console.log('=== COMPREHENSIVE SECTION & FIELD VERIFICATION ===');
    
    // Check each section we implemented
    const sectionsToVerify = [
        'PUMP_CALCULATION_RESULTS',
        'MAX_SUCTION_PRESSURE', 
        'MCF_CALCULATION',
        'MAX_DISCHARGE_PRESSURE',
        'MAX_DISCHARGE_PRESSURE_OPTIONS'
    ];
    
    let totalSections = 0;
    let totalFields = 0;
    let calculatedFields = 0;
    
    sectionsToVerify.forEach(sectionName => {
        console.log(`\n--- SECTION: ${sectionName} ---`);
        
        // Check if section exists in content
        if (content.includes(`${sectionName}:`)) {
            console.log('✅ Section defined');
            totalSections++;
            
            // Extract section content roughly
            const sectionStart = content.indexOf(`${sectionName}:`);
            const sectionEnd = content.indexOf('},', sectionStart);
            const sectionContent = content.substring(sectionStart, sectionEnd);
            
            // Check section properties
            const hasTitle = sectionContent.includes('title:');
            const hasIcon = sectionContent.includes('icon:');
            const hasColor = sectionContent.includes('color:');
            const hasFields = sectionContent.includes('fields:');
            
            console.log(`  Title: ${hasTitle ? '✅' : '❌'}`);
            console.log(`  Icon: ${hasIcon ? '✅' : '❌'}`);
            console.log(`  Color: ${hasColor ? '✅' : '❌'}`);
            console.log(`  Fields: ${hasFields ? '✅' : '❌'}`);
            
            // Count fields in this section
            const fieldMatches = sectionContent.match(/{ name:/g);
            const fieldCount = fieldMatches ? fieldMatches.length : 0;
            console.log(`  Field count: ${fieldCount}`);
            totalFields += fieldCount;
            
            // Check for calculated fields in this section
            const calcMatches = sectionContent.match(/calculated: true/g);
            const calcCount = calcMatches ? calcMatches.length : 0;
            if (calcCount > 0) {
                console.log(`  Calculated fields: ${calcCount}`);
                calculatedFields += calcCount;
            }
            
            // Check for notes
            if (sectionContent.includes('notes:')) {
                console.log('  📝 Contains calculation notes');
            }
            
        } else {
            console.log('❌ Section not found');
        }
    });
    
    console.log('\n=== FIELD VERIFICATION BY SECTION ===');
    
    // Check specific fields for each section
    const sectionFieldMappings = {
        'PUMP_CALCULATION_RESULTS': [
            'dischargePressure', 'suctionPressureResult', 'differentialPressure', 
            'differentialHead', 'npshaResult'
        ],
        'MAX_SUCTION_PRESSURE': [
            'suctionVesselMaxOpPressure', 'suctionElM', 'tlToHhllM', 'maxSuctionPressure'
        ],
        'MCF_CALCULATION': [
            'pumpMinimumFlow', 'fluidDensityMcf', 'pumpDischargePressureMinFlow',
            'destinationPressure', 'elDestinationPumpCl', 'mcfLineFrictionLosses',
            'flowMeterLosses', 'miscPressureDropMcf', 'mcfCvPressureDrop'
        ],
        'MAX_DISCHARGE_PRESSURE': [
            'api610ToleranceUsed', 'apiToleranceFactor', 'shutOffPressureFactor',
            'shutOffDifferentialPressure'
        ],
        'MAX_DISCHARGE_PRESSURE_OPTIONS': [
            'maximumDischargePressureOption1', 'maximumDischargePressureOption2'
        ]
    };
    
    let totalExpectedFields = 0;
    let foundFields = 0;
    
    Object.keys(sectionFieldMappings).forEach(section => {
        console.log(`\n${section} Fields:`);
        sectionFieldMappings[section].forEach(fieldName => {
            totalExpectedFields++;
            if (content.includes(`name: '${fieldName}'`)) {
                console.log(`  ✅ ${fieldName}`);
                foundFields++;
            } else {
                console.log(`  ❌ ${fieldName}`);
            }
        });
    });
    
    console.log('\n=== CALCULATION FUNCTIONS VERIFICATION ===');
    
    const calculationFunctions = [
        'calculatePumpResults',
        'calculateMaxSuctionPressure',
        'calculateMcfCvPressureDrop', 
        'calculateShutOffDifferentialPressure',
        'calculateMaxDischargePressureOptions'
    ];
    
    let foundCalculations = 0;
    calculationFunctions.forEach(funcName => {
        if (content.includes(`const ${funcName}`)) {
            console.log(`  ✅ ${funcName}`);
            foundCalculations++;
        } else {
            console.log(`  ❌ ${funcName}`);
        }
    });
    
    console.log('\n=== AUTO-CALCULATION TRIGGERS VERIFICATION ===');
    
    // Check for auto-calculation trigger code
    const triggerPatterns = [
        'calculatePumpResults(newFormData)',
        'calculateMaxSuctionPressure(newFormData)',
        'calculateMcfCvPressureDrop(newFormData)',
        'calculateShutOffDifferentialPressure(newFormData)',
        'calculateMaxDischargePressureOptions(newFormData)'
    ];
    
    let foundTriggers = 0;
    triggerPatterns.forEach(trigger => {
        if (content.includes(trigger)) {
            console.log(`  ✅ Auto-trigger: ${trigger.split('(')[0]}`);
            foundTriggers++;
        } else {
            console.log(`  ❌ Missing trigger: ${trigger.split('(')[0]}`);
        }
    });
    
    console.log('\n=== SUMMARY REPORT ===');
    console.log(`Sections implemented: ${totalSections}/${sectionsToVerify.length}`);
    console.log(`Fields found: ${foundFields}/${totalExpectedFields}`);
    console.log(`Calculation functions: ${foundCalculations}/${calculationFunctions.length}`);
    console.log(`Auto-triggers: ${foundTriggers}/${triggerPatterns.length}`);
    console.log(`Total calculated fields: ${calculatedFields}`);
    
    const overallSuccess = totalSections === sectionsToVerify.length && 
                          foundFields === totalExpectedFields &&
                          foundCalculations === calculationFunctions.length &&
                          foundTriggers === triggerPatterns.length;
    
    console.log(`\nOVERALL STATUS: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
} catch (error) {
    console.error('Error:', error.message);
}