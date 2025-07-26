import React from 'react';
import EditableNumberField from '../common/EditableNumberField';

const AssumptionsSheet = ({ assumptions, setAssumptions, editMode }) => (
    <div className="p-6 space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Assunzioni Generali e di Costo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                <div>
                    <h4 className="font-semibold text-gray-700 mb-2">General Parameters</h4>
                    <EditableNumberField label="Initial Equity" value={assumptions.initialEquity} onChange={val => setAssumptions({...assumptions, initialEquity: val})} unit="€M" disabled={!editMode} isInteger/>
                    <EditableNumberField label="Tax Rate" value={assumptions.taxRate} onChange={val => setAssumptions({...assumptions, taxRate: val})} unit="%" disabled={!editMode} isPercentage/>
                    <EditableNumberField label="EURIBOR" value={assumptions.euribor} onChange={val => setAssumptions({...assumptions, euribor: val})} unit="%" disabled={!editMode} isPercentage/>
                    <EditableNumberField label="Cost of Funding" value={assumptions.costOfFundsRate} onChange={val => setAssumptions({...assumptions, costOfFundsRate: val})} unit="% on Assets" disabled={!editMode} isPercentage/>
                    <EditableNumberField label="Operating Assets Ratio" value={assumptions.operatingAssetsRatio} onChange={val => setAssumptions({...assumptions, operatingAssetsRatio: val})} unit="% on Loans" disabled={!editMode} isPercentage/>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Average Personnel Cost</h4>
                     <EditableNumberField label="Costo medio per persona" value={assumptions.avgCostPerFte} onChange={val => setAssumptions({...assumptions, avgCostPerFte: val})} unit="k€" disabled={!editMode} isInteger/>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Other Operating Costs (Year 1)</h4>
                    <EditableNumberField label="Back Office Costs" value={assumptions.backOfficeCostsY1} onChange={val => setAssumptions({...assumptions, backOfficeCostsY1: val})} unit="€M" disabled={!editMode}/>
                    <EditableNumberField label="Administrative Costs" value={assumptions.adminCostsY1} onChange={val => setAssumptions({...assumptions, adminCostsY1: val})} unit="€M" disabled={!editMode}/>
                    <EditableNumberField label="Marketing" value={assumptions.marketingCostsY1} onChange={val => setAssumptions({...assumptions, marketingCostsY1: val})} unit="€M" disabled={!editMode}/>
                </div>
                 <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Funding Mix (Liabilities)</h4>
                    <EditableNumberField label="Depositi a Vista" value={assumptions.fundingMix.sightDeposits} onChange={val => setAssumptions({...assumptions, fundingMix: {...assumptions.fundingMix, sightDeposits: val}})} unit="%" disabled={!editMode} isPercentage/>
                    <EditableNumberField label="Depositi Vincolati" value={assumptions.fundingMix.termDeposits} onChange={val => setAssumptions({...assumptions, fundingMix: {...assumptions.fundingMix, termDeposits: val}})} unit="%" disabled={!editMode} isPercentage/>
                    <EditableNumberField label="Finanziamento Intergruppo" value={assumptions.fundingMix.groupFunding} onChange={val => setAssumptions({...assumptions, fundingMix: {...assumptions.fundingMix, groupFunding: val}})} unit="%" disabled={!editMode} isPercentage/>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Real Estate Division Assumptions</h3>
            <div className="mb-8 border-b pb-8">
                 <h4 className="text-lg font-semibold text-gray-900 mb-4">Division Personnel</h4>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <EditableNumberField label="FTE Anno 1" value={assumptions.realEstateDivision.fteY1} onChange={val => setAssumptions(prev => ({...prev, realEstateDivision: {...prev.realEstateDivision, fteY1: val}}))} disabled={!editMode} isInteger/>
                    <EditableNumberField label="FTE Anno 5" value={assumptions.realEstateDivision.fteY5} onChange={val => setAssumptions(prev => ({...prev, realEstateDivision: {...prev.realEstateDivision, fteY5: val}}))} disabled={!editMode} isInteger/>
                 </div>
            </div>
            
            {/* Real Estate Products */}
            {Object.entries(assumptions.products).filter(([key]) => key.startsWith('re')).map(([key, product], index) => (
                <div key={key} className="mb-8 border-b pb-8 last:border-b-0 last:pb-0">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{`RE Product ${index + 1}: ${product.name}`}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                         <EditableNumberField label="Nuovi Impieghi Anno 1" value={product.volumes.y1} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], volumes: {...product.volumes, y1: val}}}}))} unit="€M" disabled={!editMode} isInteger/>
                         <EditableNumberField label="Nuovi Impieghi Anno 5" value={product.volumes.y5} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], volumes: {...product.volumes, y5: val}}}}))} unit="€M" disabled={!editMode} isInteger/>
                         <EditableNumberField label="Finanziamento Medio" value={product.avgLoanSize || 1.0} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], avgLoanSize: val}}}))} unit="€M" disabled={!editMode}/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Parametri Finanziari</h5>
                            <EditableNumberField label="Spread" value={product.spread} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], spread: val}}}))} unit="% over EURIBOR" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Fees" value={product.commissionRate} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], commissionRate: val}}}))} unit="% su nuovo" disabled={!editMode} isPercentage/>
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Parametri Strutturali</h5>
                            <EditableNumberField label="Durata" value={product.durata} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], durata: val}}}))} unit="anni" disabled={!editMode}/>
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Modalità Ammortamento</label>
                                <select 
                                    value={product.type || 'amortizing'}
                                    onChange={e => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], type: e.target.value}}}))}
                                    disabled={!editMode}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="amortizing">Ammortamento alla Francese</option>
                                    <option value="bullet">Bullet (pagamento finale)</option>
                                </select>
                            </div>
                            <EditableNumberField label="RWA Density" value={product.rwaDensity} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], rwaDensity: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                        </div>
                         <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Risk Parameters</h5>
                            <EditableNumberField label="Tasso di Default (Danger Rate)" value={product.dangerRate} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], dangerRate: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Loan-to-Value (LTV)" value={product.ltv} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], ltv: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Recovery Costs" value={product.recoveryCosts} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], recoveryCosts: val}}}))} unit="% su Collaterale" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Haircut su Collaterale" value={product.collateralHaircut} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], collateralHaircut: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6">SME Division Assumptions</h3>
            <div className="mb-8 border-b pb-8">
                 <h4 className="text-lg font-semibold text-gray-900 mb-4">Division Personnel</h4>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <EditableNumberField label="FTE Anno 1" value={assumptions.smeDivision?.fteY1 || 0} onChange={val => setAssumptions(prev => ({...prev, smeDivision: {...prev.smeDivision, fteY1: val}}))} disabled={!editMode} isInteger/>
                    <EditableNumberField label="FTE Anno 5" value={assumptions.smeDivision?.fteY5 || 0} onChange={val => setAssumptions(prev => ({...prev, smeDivision: {...prev.smeDivision, fteY5: val}}))} disabled={!editMode} isInteger/>
                 </div>
            </div>
            
            {/* SME Products */}
            {Object.entries(assumptions.products).filter(([key]) => key.startsWith('sme')).map(([key, product], index) => (
                <div key={key} className="mb-8 border-b pb-8 last:border-b-0 last:pb-0">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{`SME Product ${index + 1}: ${product.name}`}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                         <EditableNumberField label="Nuovi Impieghi Anno 1" value={product.volumes.y1} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], volumes: {...product.volumes, y1: val}}}}))} unit="€M" disabled={!editMode} isInteger/>
                         <EditableNumberField label="Nuovi Impieghi Anno 5" value={product.volumes.y5} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], volumes: {...product.volumes, y5: val}}}}))} unit="€M" disabled={!editMode} isInteger/>
                         <EditableNumberField label="Finanziamento Medio" value={product.avgLoanSize || 1.0} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], avgLoanSize: val}}}))} unit="€M" disabled={!editMode}/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Parametri Finanziari</h5>
                            <EditableNumberField label="Spread" value={product.spread} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], spread: val}}}))} unit="% over EURIBOR" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Fees" value={product.commissionRate} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], commissionRate: val}}}))} unit="% su nuovo" disabled={!editMode} isPercentage/>
                            {product.equityUpside && <EditableNumberField label="Equity Upside" value={product.equityUpside} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], equityUpside: val}}}))} unit="%" disabled={!editMode} isPercentage/>}
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Parametri Strutturali</h5>
                            <EditableNumberField label="Durata" value={product.durata} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], durata: val}}}))} unit="anni" disabled={!editMode}/>
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Modalità Ammortamento</label>
                                <select 
                                    value={product.type || 'amortizing'}
                                    onChange={e => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], type: e.target.value}}}))}
                                    disabled={!editMode}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="amortizing">Ammortamento alla Francese</option>
                                    <option value="bullet">Bullet (pagamento finale)</option>
                                </select>
                            </div>
                            <EditableNumberField label="RWA Density" value={product.rwaDensity} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], rwaDensity: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                            {product.gracePeriod && <EditableNumberField label="Grace Period" value={product.gracePeriod} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], gracePeriod: val}}}))} unit="anni" disabled={!editMode}/>}
                        </div>
                         <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Risk Parameters</h5>
                            <EditableNumberField label="Tasso di Default (Danger Rate)" value={product.dangerRate} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], dangerRate: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Loan-to-Value (LTV)" value={product.ltv} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], ltv: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Recovery Costs" value={product.recoveryCosts} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], recoveryCosts: val}}}))} unit="% su Collaterale" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Haircut su Collaterale" value={product.collateralHaircut} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], collateralHaircut: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Automotive Division Assumptions</h3>
            <div className="mb-8 border-b pb-8">
                 <h4 className="text-lg font-semibold text-gray-900 mb-4">Division Personnel</h4>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <EditableNumberField label="FTE Anno 1" value={assumptions.automotiveDivision?.fteY1 || 0} onChange={val => setAssumptions(prev => ({...prev, automotiveDivision: {...prev.automotiveDivision, fteY1: val}}))} disabled={!editMode} isInteger/>
                    <EditableNumberField label="FTE Anno 5" value={assumptions.automotiveDivision?.fteY5 || 0} onChange={val => setAssumptions(prev => ({...prev, automotiveDivision: {...prev.automotiveDivision, fteY5: val}}))} disabled={!editMode} isInteger/>
                 </div>
            </div>
            
            {/* Automotive Products */}
            {Object.entries(assumptions.products).filter(([key]) => key.startsWith('auto')).map(([key, product], index) => (
                <div key={key} className="mb-8 border-b pb-8 last:border-b-0 last:pb-0">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{`Auto Product ${index + 1}: ${product.name}`}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                         <EditableNumberField label="Nuovi Impieghi Anno 1" value={product.volumes.y1} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], volumes: {...product.volumes, y1: val}}}}))} unit="€M" disabled={!editMode} isInteger/>
                         <EditableNumberField label="Nuovi Impieghi Anno 5" value={product.volumes.y5} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], volumes: {...product.volumes, y5: val}}}}))} unit="€M" disabled={!editMode} isInteger/>
                         <EditableNumberField label="Finanziamento Medio" value={product.avgLoanSize || 1.0} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], avgLoanSize: val}}}))} unit="€M" disabled={!editMode}/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Parametri Finanziari</h5>
                            <EditableNumberField label="Spread" value={product.spread} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], spread: val}}}))} unit="% over EURIBOR" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Fees" value={product.commissionRate} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], commissionRate: val}}}))} unit="% su nuovo" disabled={!editMode} isPercentage/>
                            {product.isGreen && <span className="text-green-600 text-xs font-medium">✓ ESG Green Product</span>}
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Parametri Strutturali</h5>
                            <EditableNumberField label="Durata" value={product.durata} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], durata: val}}}))} unit="anni" disabled={!editMode}/>
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Modalità Ammortamento</label>
                                <select 
                                    value={product.type || 'amortizing'}
                                    onChange={e => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], type: e.target.value}}}))}
                                    disabled={!editMode}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="amortizing">Ammortamento alla Francese</option>
                                    <option value="bullet">Bullet (pagamento finale)</option>
                                </select>
                            </div>
                            <EditableNumberField label="RWA Density" value={product.rwaDensity} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], rwaDensity: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                        </div>
                         <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Risk Parameters</h5>
                            <EditableNumberField label="Tasso di Default (Danger Rate)" value={product.dangerRate} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], dangerRate: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Loan-to-Value (LTV)" value={product.ltv} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], ltv: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Recovery Costs" value={product.recoveryCosts} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], recoveryCosts: val}}}))} unit="% su Collaterale" disabled={!editMode} isPercentage/>
                            <EditableNumberField label="Haircut su Collaterale" value={product.collateralHaircut} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], collateralHaircut: val}}}))} unit="%" disabled={!editMode} isPercentage/>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Digital Banking Division */}
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Digital Banking Division Assumptions</h3>
            <div className="mb-8 border-b pb-8">
                 <h4 className="text-lg font-semibold text-gray-900 mb-4">Division Personnel (Tech-Focused Team)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <EditableNumberField label="FTE Anno 1" value={assumptions.digitalBankingDivision?.fteY1 || 0} onChange={val => setAssumptions(prev => ({...prev, digitalBankingDivision: {...prev.digitalBankingDivision, fteY1: val}}))} disabled={!editMode} isInteger/>
                    <EditableNumberField label="FTE Anno 5" value={assumptions.digitalBankingDivision?.fteY5 || 0} onChange={val => setAssumptions(prev => ({...prev, digitalBankingDivision: {...prev.digitalBankingDivision, fteY5: val}}))} disabled={!editMode} isInteger/>
                 </div>
            </div>
            
            {/* Digital Banking Products */}
            {Object.entries(assumptions.products).filter(([key]) => key.startsWith('digital')).map(([key, product], index) => (
                <div key={key} className="mb-8 border-b pb-8 last:border-b-0 last:pb-0">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{`Digital Service ${index + 1}: ${product.name}`}</h4>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-blue-700 text-sm">
                            <strong>📱 Digital Service Model:</strong> This is a fee-based service with minimal credit risk. 
                            "Volume" represents the service capacity/revenue potential, not traditional loan volumes.
                            {product.isDigital && <span className="ml-2 text-blue-600 font-medium">✓ Digital Native Service</span>}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                         <EditableNumberField 
                            label="Service Revenue Anno 1" 
                            value={product.volumes.y1} 
                            onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], volumes: {...product.volumes, y1: val}}}}))} 
                            unit="€M" 
                            disabled={!editMode} 
                            isInteger
                         />
                         <EditableNumberField 
                            label="Service Revenue Anno 5" 
                            value={product.volumes.y5} 
                            onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], volumes: {...product.volumes, y5: val}}}}))} 
                            unit="€M" 
                            disabled={!editMode} 
                            isInteger
                         />
                         <EditableNumberField 
                            label="Avg Service Size" 
                            value={product.avgLoanSize || 0.001} 
                            onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], avgLoanSize: val}}}))} 
                            unit="€M" 
                            disabled={!editMode}
                         />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Revenue Parameters</h5>
                            <EditableNumberField 
                                label="Interest Spread" 
                                value={product.spread} 
                                onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], spread: val}}}))} 
                                unit="% (for payment services)" 
                                disabled={!editMode} 
                                isPercentage
                            />
                            <EditableNumberField 
                                label="Commission Rate" 
                                value={product.commissionRate} 
                                onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], commissionRate: val}}}))} 
                                unit="% (main revenue)" 
                                disabled={!editMode} 
                                isPercentage
                            />
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Service Parameters</h5>
                            <EditableNumberField 
                                label="Service Cycle" 
                                value={product.durata} 
                                onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], durata: val}}}))} 
                                unit="anni (contract length)" 
                                disabled={!editMode}
                            />
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                                <select 
                                    value={product.type || 'services'}
                                    onChange={e => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], type: e.target.value}}}))}
                                    disabled={!editMode}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="services">Digital Services</option>
                                    <option value="saas">SaaS Platform</option>
                                    <option value="marketplace">Marketplace</option>
                                    <option value="payments">Payment Services</option>
                                </select>
                            </div>
                            <EditableNumberField 
                                label="RWA Density" 
                                value={product.rwaDensity} 
                                onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], rwaDensity: val}}}))} 
                                unit="% (very low for services)" 
                                disabled={!editMode} 
                                isPercentage
                            />
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-600 text-sm mb-2">Risk Parameters (Minimal)</h5>
                            <EditableNumberField 
                                label="Operational Risk Rate" 
                                value={product.dangerRate} 
                                onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], dangerRate: val}}}))} 
                                unit="% (operational/counterparty)" 
                                disabled={!editMode} 
                                isPercentage
                            />
                            <div className="text-xs text-gray-500 mt-2">
                                <p>• LTV: N/A (service-based)</p>
                                <p>• Recovery: N/A (no collateral)</p>
                                <p>• Haircut: N/A (no assets)</p>
                                <p className="text-green-600 font-medium">✓ Minimal credit risk model</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default AssumptionsSheet;