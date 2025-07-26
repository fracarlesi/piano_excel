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
                    <EditableNumberField label="% Front Office" value={assumptions.realEstateDivision.frontOfficeRatio} onChange={val => setAssumptions(prev => ({...prev, realEstateDivision: {...prev.realEstateDivision, frontOfficeRatio: val}}))} unit="%" disabled={!editMode} isPercentage/>
                 </div>
            </div>
            {Object.entries(assumptions.products).map(([key, product], index) => (
                <div key={key} className="mb-8 border-b pb-8 last:border-b-0 last:pb-0">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{`Product ${index + 1}: ${product.name}`}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                         <EditableNumberField label="Nuovi Impieghi Anno 1" value={product.volumes.y1} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], volumes: {...product.volumes, y1: val}}}}))} unit="€M" disabled={!editMode} isInteger/>
                         <EditableNumberField label="Nuovi Impieghi Anno 5" value={product.volumes.y5} onChange={val => setAssumptions(prev => ({...prev, products: {...prev.products, [key]: {...prev.products[key], volumes: {...product.volumes, y5: val}}}}))} unit="€M" disabled={!editMode} isInteger/>
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
    </div>
);

export default AssumptionsSheet;