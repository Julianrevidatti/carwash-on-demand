import os
import re

BASE_DIR = r"c:\Users\54112\Desktop\GestionPro"
LANDING_FILE = os.path.join(BASE_DIR, "components", "LandingPage.tsx")

def patch_demo_button():
    with open(LANDING_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # The exact string we're looking for inside LandingPage.tsx
    target_button = '<button className="bg-transparent hover:bg-slate-800 text-white px-8 py-4 rounded-lg font-bold text-lg border border-slate-700 transition-all">\n                Ver Demo en Vivo\n              </button>'
    
    # We add the onClick handler with toast and onGoToLogin
    replacement_button = '<button onClick={() => { alert("Solo tenés que crearte una cuenta y aprovechar los 7 días de prueba."); onGoToLogin(); }} className="bg-transparent hover:bg-slate-800 text-white px-8 py-4 rounded-lg font-bold text-lg border border-slate-700 transition-all">\n                Ver Demo en Vivo\n              </button>'

    if target_button in content:
        content = content.replace(target_button, replacement_button)
        with open(LANDING_FILE, "w", encoding="utf-8") as f:
            f.write(content)
        print("Successfully patched 'Ver Demo en Vivo' button in LandingPage.tsx")
    elif "alert(\"Solo tenés que crearte una cuenta y aprovechar los 7 días de prueba.\");" in content:
        print("The button is already patched.")
    else:
        print("Could not find the target button in LandingPage.tsx.")

if __name__ == "__main__":
    patch_demo_button()
