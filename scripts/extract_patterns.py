import os
import re
import json

def extract_patterns(root_dir):
    patterns = {
        "packages": set(),
        "view_binding_usage": [],
        "view_model_usage": [],
        "repository_usage": [],
        "firebase_references": [],
        "naming_conventions": {
            "fragments": [],
            "view_models": [],
            "repositories": []
        }
    }

    src_dir = os.path.join(root_dir, "app", "src", "main", "java")
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(".kt"):
                path = os.path.join(root, file)
                rel_path = os.path.relpath(path, src_dir)
                patterns["packages"].add(os.path.dirname(rel_path).replace(os.sep, "."))
                
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                    
                    if "Binding" in content:
                        patterns["view_binding_usage"].append(file)
                    if "ViewModel" in content:
                        patterns["view_model_usage"].append(file)
                    if "Repository" in file:
                        patterns["repository_usage"].append(file)
                    if "Firebase" in content or "firestore" in content.lower():
                        patterns["firebase_references"].append(file)

                    # Naming conventions
                    if file.endswith("Fragment.kt"):
                        patterns["naming_conventions"]["fragments"].append(file)
                    elif file.endswith("ViewModel.kt"):
                        patterns["naming_conventions"]["view_models"].append(file)
                    elif file.endswith("Repository.kt"):
                        patterns["naming_conventions"]["repositories"].append(file)

    # Convert sets to lists for JSON serialization
    patterns["packages"] = sorted(list(patterns["packages"]))
    return patterns

if __name__ == "__main__":
    project_root = r"c:\Users\54112\Desktop\utnb\carwash-on-demand"
    results = extract_patterns(project_root)
    
    output_path = os.path.join(project_root, ".tmp", "analysis_results.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4)
    
    print(f"Analysis complete. Results saved to {output_path}")
