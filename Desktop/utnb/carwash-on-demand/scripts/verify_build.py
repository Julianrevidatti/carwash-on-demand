import subprocess
import os

def run_build():
    project_root = r"c:\Users\54112\Desktop\utnb\carwash-on-demand"
    try:
        # Run gradlew assembleDebug
        result = subprocess.run(
            [os.path.join(project_root, "gradlew.bat"), "assembleDebug"],
            cwd=project_root,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore"
        )
        
        if result.returncode != 0:
            print("BUILD FAILED")
            print("STDOUT:")
            print(result.stdout[-2000:])
            print("STDERR:")
            print(result.stderr[-2000:])
        else:
            print("BUILD SUCCESSFUL")
            
    except Exception as e:
        print(f"Error executing build: {e}")

if __name__ == "__main__":
    run_build()
