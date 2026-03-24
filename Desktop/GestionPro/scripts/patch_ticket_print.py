import os
import re

# Paths
BASE_DIR = r"c:\Users\54112\Desktop\GestionPro"
TYPES_FILE = os.path.join(BASE_DIR, "types.ts")
SETTINGS_FILE = os.path.join(BASE_DIR, "components", "Settings.tsx")
POS_FILE = os.path.join(BASE_DIR, "components", "POS.tsx")
SERVICE_FILE = os.path.join(BASE_DIR, "src", "services", "webPrintService.ts")

def create_print_service():
    os.makedirs(os.path.dirname(SERVICE_FILE), exist_ok=True)
    content = """import { Sale, SystemSettings } from '../../types';

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
        <div class="text-center" style="font-size: 11px; margin-top: 10px; font-style: italic;">
          ¡Gracias por su compra!<br/>
          Software por GestionNow
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
"""
    with open(SERVICE_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created {SERVICE_FILE}")

def patch_types():
    with open(TYPES_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    if "ticketWidth?: '58mm' | '80mm';" not in content:
        target = "export interface SystemSettings {"
        replacement = """export interface SystemSettings {
  // Ticket Printing
  ticketWidth?: '58mm' | '80mm';
  autoPrintTicket?: boolean;"""
        content = content.replace(target, replacement)
        
        with open(TYPES_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {TYPES_FILE}")
    else:
        print(f"Already patched {TYPES_FILE}")

def patch_settings():
    with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    if "Impresora" not in content and "setActiveTab('printer')" not in content:
        # Import Printer icon
        import_target = "LayoutDashboard, QrCode as QrIcon,"
        import_replacement = "LayoutDashboard, QrCode as QrIcon, Printer,"
        if import_target in content:
            content = content.replace(import_target, import_replacement)

        # Add the tab button
        tab_target = """<button
          onClick={() => setActiveTab('catalog')}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 flex items-center gap-2 ${activeTab === 'catalog' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 border-blue-600 scale-105' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'}`}
        >
          <QrIcon className="w-4 h-4" />
          Mi Negocio
        </button>"""
        
        tab_replacement = tab_target + """
        <button
          onClick={() => setActiveTab('printer')}
          className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 flex items-center gap-2 ${activeTab === 'printer' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 border-blue-600 scale-105' : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'}`}
        >
          <Printer className="w-4 h-4" />
          Impresora
        </button>"""
        content = content.replace(tab_target, tab_replacement)

        # Add the tab content
        content_target = "{/* --- SUBSCRIPTION TAB --- */}"
        content_replacement = """{activeTab === 'printer' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Printer className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Configuración de Ticket</h3>
                <p className="text-sm text-gray-500">Personalizá cómo y cuándo se imprimen los comprobantes de venta.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm text-indigo-800 flex gap-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <p>La impresión se realiza directamente desde el navegador al completar una venta. No se requieren drivers especiales más allá del instalado en tu sistema operativo.</p>
              </div>

              {/* Toggle AutoPrint */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <label className="text-sm font-bold text-gray-800">Impresión Automática</label>
                  <p className="text-xs text-gray-500">Imprimir automáticamente al cobrar una venta desde el Punto de Venta.</p>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, autoPrintTicket: !settings.autoPrintTicket })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${settings.autoPrintTicket ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoPrintTicket ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Paper Width */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-800 mb-2">Ancho del Rollo de Papel</label>
                <div className="flex gap-4">
                  <label className="relative flex cursor-pointer items-center justify-center rounded-xl border-2 p-4 w-full transition-all hover:bg-gray-100 ${settings.ticketWidth === '58mm' || !settings.ticketWidth ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200'}">
                    <input
                      type="radio"
                      name="paperWidth"
                      className="sr-only"
                      checked={settings.ticketWidth === '58mm' || !settings.ticketWidth}
                      onChange={() => onUpdateSettings({ ...settings, ticketWidth: '58mm' })}
                    />
                    <div className="text-center">
                      <p className="font-bold text-gray-800">58mm</p>
                      <p className="text-xs text-gray-500">Impresoras Comunes (Portátiles / Pequeñas)</p>
                    </div>
                  </label>
                  <label className="relative flex cursor-pointer items-center justify-center rounded-xl border-2 p-4 w-full transition-all hover:bg-gray-100 ${settings.ticketWidth === '80mm' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200'}">
                    <input
                      type="radio"
                      name="paperWidth"
                      className="sr-only"
                      checked={settings.ticketWidth === '80mm'}
                      onChange={() => onUpdateSettings({ ...settings, ticketWidth: '80mm' })}
                    />
                    <div className="text-center">
                      <p className="font-bold text-gray-800">80mm</p>
                      <p className="text-xs text-gray-500">Impresoras Grandes (Epson, Códigos de barras)</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Prueba de Impresión (Preview Header mockup) */}
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Vista Previa (Encabezado)</h4>
                <div className={`bg-gray-50 p-4 rounded border border-gray-200 shadow-sm text-center ${settings.ticketWidth === '80mm' ? 'w-64' : 'w-48'}`}>
                  <p className="font-black text-gray-800 uppercase">{businessName || 'MI NEGOCIO'}</p>
                  <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{address || 'Sin dirección registrada. Agregar en pestaña Mi Negocio'}</p>
                  <p className="text-[10px] text-gray-500 mt-2 border-t border-dashed border-gray-300 pt-2">
                    TICKET FISCAL / CANJE<br/>
                    Fecha: {new Date().toLocaleDateString('es-AR')}<br/>
                  </p>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 text-center">* En dispositivos Apple (iOS) puede que la impresión automática esté bloqueada por Safari. Usar el botón en el punto de venta en su lugar.</p>
            </div>
          </div>
        )}

        {/* --- SUBSCRIPTION TAB --- */}"""
        
        content = content.replace(content_target, content_replacement)
        
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {SETTINGS_FILE}")
    else:
        print(f"Already patched {SETTINGS_FILE} or could not find hooks")

def patch_pos():
    with open(POS_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Need webPrintService import and currentTenant state
    if "webPrintService" not in content:
        import_target = "import { toast } from 'sonner';"
        import_replacement = "import { toast } from 'sonner';\nimport { webPrintService } from '../src/services/webPrintService';\nimport { useStore } from '../src/store/useStore';"
        if import_target in content:
            content = content.replace(import_target, import_replacement)

        # Get current tenant in component
        state_target = "const { hasPermission } = useUserPermissions();"
        state_replacement = "const { hasPermission } = useUserPermissions();\n  const currentTenant = useStore(state => state.currentTenant);"
        if state_target in content:
            content = content.replace(state_target, state_replacement)
        
        # Patch finalizeSale
        sale_target = "await onCompleteSale(sale);"
        sale_replacement = """await onCompleteSale(sale);
      
      // -- TICKET PRINTING --
      if (settings.autoPrintTicket) {
        toast.info("Imprimiendo ticket...", { duration: 2000 });
        webPrintService.printReceipt(sale, settings, currentTenant?.businessName || 'Mi Negocio');
      }
"""
        if sale_target in content:
            content = content.replace(sale_target, sale_replacement)
        
        with open(POS_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {POS_FILE}")
    else:
        print(f"Already patched {POS_FILE} or could not find hooks")

if __name__ == "__main__":
    create_print_service()
    patch_types()
    patch_settings()
    patch_pos()
    print("Done")
