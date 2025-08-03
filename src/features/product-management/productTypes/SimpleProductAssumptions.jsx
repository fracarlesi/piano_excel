import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card/Card';
import { EditableNumberField } from '../../../components/ui/inputs';

const SimpleProductAssumptions = ({ 
  product, 
  productKey, 
  divisionKey,
  editMode, 
  onFieldChange 
}) => {
  const handleChange = (field, value) => {
    onFieldChange(productKey, field, value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">💼 Parametri Prodotto</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <EditableNumberField
          label="Commissione (%)"
          value={product.commissionRate}
          onChange={(value) => handleChange('commissionRate', value)}
          editMode={editMode}
          min={0}
          max={10}
          step={0.1}
          
        />
        
        {product.requiresBaseProduct && (
          <div className="col-span-2 md:col-span-3">
            <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
              ℹ️ Questo prodotto richiede un prodotto base per essere attivato
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleProductAssumptions;