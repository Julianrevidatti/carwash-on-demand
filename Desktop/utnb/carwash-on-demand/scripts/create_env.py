import os

env_path = r"c:\Users\54112\Desktop\utnb\carwash-on-demand\.env"
key = "AIzaSyBiGwTa9UNsjbQ8qOGXAUGlmOaENpvemVA"

with open(env_path, "w") as f:
    f.write(f"GOOGLE_MAPS_KEY={key}\n")

print(f"File {env_path} created successfully.")
