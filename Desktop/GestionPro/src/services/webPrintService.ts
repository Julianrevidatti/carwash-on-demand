import { Sale, SystemSettings } from '../../types';

export const webPrintService = {
  printReceipt: (sale: Sale, settings: SystemSettings, businessName: string) => {
    const paperWidth = settings.ticketWidth || '80mm';
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const safeBusinessName = businessName || 'Mi Negocio';
    const formattedDate = new Date(sale.date).toLocaleString('es-AR', {
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit'
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: ${paperWidth === '58mm' ? '54mm' : '76mm'}; /* Slightly less than paper width to ensure no cutoff */
            margin: 0 auto; 
            padding: 2mm; 
            font-size: 12px;
            color: black;
            box-sizing: border-box;
          }
          .title { text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 5px; text-transform: uppercase; }
          .subtitle { text-align: center; font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed black; padding-bottom: 5px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; }
          .item-name { flex: 1; padding-right: 5px; word-break: break-word; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed black; margin: 5px 0; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .items-container { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="title">${safeBusinessName}</div>
        <div class="subtitle">
          TICKET FISCAL / CANJE<br/>
          Fecha: ${formattedDate}<br/>
          Abonado con: ${sale.paymentMethodName || 'Efectivo'}
        </div>
        
        <div class="items-container">
          ${sale.items.map(item => `
            <div class="item">
              <span class="item-name">${item.isWeighted ? item.quantity.toFixed(3) + 'kg' : item.quantity + 'x'} - ${item.name}</span>
              <span>$${(item.quantity * item.price).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="divider"></div>
        
        <div class="item">
          <span>Subtotal:</span>
          <span>$${sale.subtotal.toFixed(2)}</span>
        </div>
        ${sale.discount && sale.discount > 0 ? `
        <div class="item">
          <span>Desc Promo:</span>
          <span>-$${sale.discount.toFixed(2)}</span>
        </div>` : ''}
        ${sale.surcharge && sale.surcharge > 0 ? `
        <div class="item">
          <span>Recargo:</span>
          <span>+$${sale.surcharge.toFixed(2)}</span>
        </div>` : ''}
        
        <div class="divider"></div>
        <div class="item bold" style="font-size: 14px;">
          <span>TOTAL:</span>
          <span>$${sale.total.toFixed(2)}</span>
        </div>
        
        <div class="divider"></div>
        <div class="text-center" style="font-size: 11px; margin-top: 10px;">
          ${settings.customTicketFooter ? `
            <div style="white-space: pre-wrap; margin-bottom: 8px; font-weight: bold; font-family: sans-serif;">
              ${settings.customTicketFooter.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            </div>
          ` : `
            <div style="font-style: italic; margin-bottom: 8px;">¡Gracias por su compra!</div>
          `}
          <div style="font-style: italic; color: #555;">Software por GestionNow</div>
        </div>
      </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      };
    }
  }
};
