// Receipt HTML generator for thermal printers (58mm / 80mm)
// Generates a self-contained HTML string ready for printing

import { Sale, SystemSettings } from '../types';

interface ReceiptData {
  sale: Sale;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  paperWidth?: '58mm' | '80mm';
}

export function generateReceiptHtml(data: ReceiptData): string {
  const { sale, businessName, businessAddress, businessPhone, paperWidth = '80mm' } = data;
  const width = paperWidth === '58mm' ? '48mm' : '72mm';
  const fontSize = paperWidth === '58mm' ? '10px' : '12px';
  const date = new Date(sale.date);
  const dateStr = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const itemRows = sale.items.map(item => {
    const subtotal = item.price * item.quantity;
    const qtyLabel = item.isWeighted ? `${item.quantity.toFixed(3)} kg` : `${item.quantity}`;
    return `
      <tr>
        <td style="text-align:left;padding:1px 0">
          ${item.name}
          ${item.size || item.color ? `<br><span style="font-size:0.85em; opacity:0.8">${item.size ? `T: ${item.size}` : ''} ${item.color ? `Col: ${item.color}` : ''}</span>` : ''}
        </td>
        <td style="text-align:center;padding:1px 4px;vertical-align:top">${qtyLabel}</td>
        <td style="text-align:right;padding:1px 0;vertical-align:top">$${subtotal.toLocaleString('es-AR')}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { 
    margin: 0; 
    size: ${paperWidth} auto; 
  }
  * { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
  }
  body {
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: ${fontSize};
    width: ${width};
    padding: 4px;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider {
    border-top: 1px dashed #000;
    margin: 4px 0;
  }
  table { 
    width: 100%; 
    border-collapse: collapse; 
    font-size: ${fontSize};
  }
  .total-row {
    font-size: ${paperWidth === '58mm' ? '14px' : '16px'};
    font-weight: bold;
  }
  .footer {
    margin-top: 6px;
    font-size: ${paperWidth === '58mm' ? '8px' : '9px'};
    text-align: center;
    color: #333;
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="center bold" style="font-size:${paperWidth === '58mm' ? '13px' : '15px'}; margin-bottom:2px">
  ${businessName.toUpperCase()}
</div>
${businessAddress ? `<div class="center" style="font-size:${paperWidth === '58mm' ? '8px' : '9px'}">${businessAddress}</div>` : ''}
${businessPhone ? `<div class="center" style="font-size:${paperWidth === '58mm' ? '8px' : '9px'}">Tel: ${businessPhone}</div>` : ''}

<div class="divider"></div>

<!-- DATE & TICKET # -->
<div style="display:flex; justify-content:space-between; font-size:${paperWidth === '58mm' ? '9px' : '10px'}">
  <span>${dateStr} ${timeStr}</span>
  <span>#${sale.id.substring(0, 8).toUpperCase()}</span>
</div>

<div class="divider"></div>

<!-- ITEMS -->
<table>
  <thead>
    <tr style="font-weight:bold; border-bottom:1px solid #000">
      <td style="text-align:left">Producto</td>
      <td style="text-align:center">Cant</td>
      <td style="text-align:right">Importe</td>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
  </tbody>
</table>

<div class="divider"></div>

<!-- TOTALS -->
<table>
  ${sale.surcharge > 0 ? `
  <tr>
    <td style="text-align:left">Subtotal</td>
    <td style="text-align:right">$${sale.subtotal.toLocaleString('es-AR')}</td>
  </tr>
  <tr>
    <td style="text-align:left">Recargo</td>
    <td style="text-align:right">$${sale.surcharge.toLocaleString('es-AR')}</td>
  </tr>` : ''}
  ${(sale.discount || 0) > 0 ? `
  <tr>
    <td style="text-align:left">Descuento</td>
    <td style="text-align:right">-$${sale.discount!.toLocaleString('es-AR')}</td>
  </tr>` : ''}
  <tr class="total-row">
    <td style="text-align:left; padding-top:4px">TOTAL</td>
    <td style="text-align:right; padding-top:4px">$${sale.total.toLocaleString('es-AR')}</td>
  </tr>
</table>

<div class="divider"></div>

<!-- PAYMENT METHOD -->
<div class="center bold" style="margin:4px 0">
  Pago: ${sale.paymentMethodName}
</div>

<div class="divider"></div>

<!-- FOOTER -->
<div class="footer">
  ¡Gracias por su compra!
  <br>
  Conserve este ticket como comprobante
  <br><br>
  FashionPro ®
</div>

<div style="margin-bottom: 20px"></div>

</body>
</html>`;
}
