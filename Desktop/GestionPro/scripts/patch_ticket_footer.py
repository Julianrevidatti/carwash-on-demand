import os
import re

BASE_DIR = r"c:\Users\54112\Desktop\GestionPro"
TYPES_FILE = os.path.join(BASE_DIR, "types.ts")
SETTINGS_FILE = os.path.join(BASE_DIR, "components", "Settings.tsx")
SERVICE_FILE = os.path.join(BASE_DIR, "src", "services", "webPrintService.ts")

def patch_types():
    with open(TYPES_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    if "customTicketFooter?:" not in content:
        target = "ticketWidth?: '58mm' | '80mm';"
        replacement = "ticketWidth?: '58mm' | '80mm';\n  customTicketFooter?: string;"
        content = content.replace(target, replacement)
        with open(TYPES_FILE, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Patched {TYPES_FILE}")
    else:
        print(f"Already patched {TYPES_FILE}")


def patch_settings():
    with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    if "name=\"customTicketFooter\"" not in content and "settings.customTicketFooter" not in content:
        # We find the Paper Width div block and append the Footer TextArea right after it
        target_div = """                      <p className="text-xs text-gray-500">Impresoras Grandes (Epson, Códigos de barras)</p>
                    </div>
                  </label>
                </div>
              </div>"""
              
        replacement_div = target_div + """

              {/* Custom Ticket Footer */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-800 mb-2">Mensaje Personalizado (Pie de Ticket)</label>
                <p className="text-xs text-gray-500 mb-3">Este mensaje aparecerá al final de todos tus tickets impresos (Ej: Políticas de cambio, agradecimientos especiales).</p>
                <textarea
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700 resize-none"
                  rows={3}
                  placeholder="¡Gracias por su compra! Recuerde que los cambios se realizan dentro de los 15 días con el ticket físico."
                  value={settings.customTicketFooter || ''}
                  onChange={(e) => onUpdateSettings({ ...settings, customTicketFooter: e.target.value })}
                />
              </div>"""
              
        # Also need to update the mockup preview
        target_mockup = """<div className="text-center" style={{ fontSize: '11px', marginTop: '10px', fontStyle: 'italic' }}>
                    ¡Gracias por su compra!<br/>
                    Software por GestionNow
                  </div>"""
                  
        replacement_mockup = """<div className="text-center" style={{ fontSize: '11px', marginTop: '10px', fontStyle: 'italic' }}>
                    {settings.customTicketFooter ? (
                      <div style={{ whiteSpace: 'pre-wrap', marginBottom: '8px', color: '#374151' }}>
                        {settings.customTicketFooter}
                      </div>
                    ) : (
                      <>¡Gracias por su compra!<br/></>
                    )}
                    <span style={{ color: '#9CA3AF' }}>Software por GestionNow</span>
                  </div>"""

        # Wait, the mockup doesn't have the exactly same html in settings as webPrintService.
        # Let's search what is actually in Settings Preview:
        # <p className="text-[10px] text-gray-500 mt-2 border-t border-dashed border-gray-300 pt-2">
        #   TICKET FISCAL / CANJE<br/>
        #   Fecha: {new Date().toLocaleDateString('es-AR')}<br/>
        # </p>
        
        target_mockup_actual = """<p className="text-[10px] text-gray-500 mt-2 border-t border-dashed border-gray-300 pt-2">
                    TICKET FISCAL / CANJE<br/>
                    Fecha: {new Date().toLocaleDateString('es-AR')}<br/>
                  </p>"""
                  
        replacement_mockup_actual = target_mockup_actual + """
                  {settings.customTicketFooter && (
                    <p className="text-[10px] text-gray-600 mt-2 border-t border-dashed border-gray-300 pt-2 whitespace-pre-wrap font-medium">
                      {settings.customTicketFooter}
                    </p>
                  )}
                  <p className="text-[9px] text-gray-400 mt-2 italic">Software por GestionNow</p>"""
                  
        if target_div in content:
            content = content.replace(target_div, replacement_div)
            if target_mockup_actual in content:
                content = content.replace(target_mockup_actual, replacement_mockup_actual)
            with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Patched {SETTINGS_FILE}")
        else:
            print(f"Could not find anchor to patch Settings.tsx")
    else:
        print(f"Already patched {SETTINGS_FILE}")

def patch_service():
    with open(SERVICE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    target_footer = """<div class="divider"></div>
        <div class="text-center" style="font-size: 11px; margin-top: 10px; font-style: italic;">
          ¡Gracias por su compra!<br/>
          Software por GestionNow
        </div>"""
        
    replacement_footer = """<div class="divider"></div>
        <div class="text-center" style="font-size: 11px; margin-top: 10px;">
          ${settings.customTicketFooter ? `
            <div style="white-space: pre-wrap; margin-bottom: 8px; font-weight: bold; font-family: sans-serif;">
              ${settings.customTicketFooter.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            </div>
          ` : `
            <div style="font-style: italic; margin-bottom: 8px;">¡Gracias por su compra!</div>
          `}
          <div style="font-style: italic; color: #555;">Software por GestionNow</div>
        </div>"""

    if target_footer in content:
        content = content.replace(target_footer, replacement_footer)
        with open(SERVICE_FILE, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Patched {SERVICE_FILE}")
    else:
        print(f"Already patched {SERVICE_FILE} or target not found")

if __name__ == "__main__":
    patch_types()
    patch_settings()
    patch_service()
    print("Tickets footer patch completed.")
