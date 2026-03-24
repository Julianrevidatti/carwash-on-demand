import subprocess
import os

sz_path = r"C:\Users\54112\Desktop\GestionPro\StockPro\node_modules\7zip-bin\win\x64\7za.exe"
archive = r"C:\Users\54112\AppData\Local\electron-builder\Cache\winCodeSign\993823867.7z"
dest = r"C:\Users\54112\AppData\Local\electron-builder\Cache\winCodeSign\winCodeSign-2.6.0"

os.makedirs(dest, exist_ok=True)

cmd = [sz_path, "x", "-y", "-snld", "-bd", archive, f"-o{dest}", "-x!darwin", "-x!linux"]

print("Running command:", " ".join(cmd))
result = subprocess.run(cmd, capture_output=True, text=True)

print("Return code:", result.returncode)
print("STDOUT:", result.stdout[:1000])
print("STDERR:", result.stderr[:1000])
