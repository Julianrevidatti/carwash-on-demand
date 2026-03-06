import os
import re

TARGET_FILE = r"C:\Users\54112\Desktop\GestionPro\components\DataReports.tsx"

def apply_patch():
    with open(TARGET_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # We need to replace logic around line 560-580
    # Specifically replacing supplierInPromo and otherInPromo and the supplierItemIds mapping

    # Step 1: Replace supplierItemIds and otherItemIds mappings
    old_item_ids_logic = """                            const supplierItemIds = saleItems.filter(i => isSupplierItem(i.id, i.supplierId)).map(i => i.id);
                            const otherItemIds = saleItems.filter(i => !isSupplierItem(i.id, i.supplierId)).map(i => i.id);"""
    
    new_item_ids_logic = """                            const supplierItemIds = saleItems.filter(i => isSupplierItem(i.id, i.supplierId)).map(i => i.productId || i.product_id || i.id);
                            const otherItemIds = saleItems.filter(i => !isSupplierItem(i.id, i.supplierId)).map(i => i.productId || i.product_id || i.id);"""
    
    if old_item_ids_logic in content:
        content = content.replace(old_item_ids_logic, new_item_ids_logic)
        print("Replaced item IDs mapping.")
    else:
        print("Could not find the old item IDs mapping logic.")

    # Step 2: Replace supplierInPromo and otherInPromo logic
    old_promo_check_logic = """                            // Are any of the supplier's items in any promo?
                            const supplierInPromo = promotions.some(p =>
                               p.triggerProductIds.some(pid => supplierItemIds.includes(pid))
                            );
                            // Are any of the OTHER items in any promo?
                            const otherInPromo = promotions.some(p =>
                               p.triggerProductIds.some(pid => otherItemIds.includes(pid))
                            );"""
    
    new_promo_check_logic = """                            // Are any of the supplier's items in any promo?
                            const supplierInPromo = promotions.some(p => {
                                let triggers = p.triggerProductIds || p.trigger_product_ids;
                                if (typeof triggers === 'string') { try { triggers = JSON.parse(triggers) } catch (e) { triggers = [] } }
                                const inTriggers = Array.isArray(triggers) && triggers.some(pid => supplierItemIds.includes(pid));
                                
                                let reqs = p.requirements || [];
                                if (typeof reqs === 'string') { try { reqs = JSON.parse(reqs) } catch (e) { reqs = [] } }
                                const inReqs = Array.isArray(reqs) && reqs.some(r => supplierItemIds.includes(r.product_id || r.productId));
                                
                                return inTriggers || inReqs;
                            });
                            
                            // Are any of the OTHER items in any promo?
                            const otherInPromo = promotions.some(p => {
                                let triggers = p.triggerProductIds || p.trigger_product_ids;
                                if (typeof triggers === 'string') { try { triggers = JSON.parse(triggers) } catch (e) { triggers = [] } }
                                const inTriggers = Array.isArray(triggers) && triggers.some(pid => otherItemIds.includes(pid));
                                
                                let reqs = p.requirements || [];
                                if (typeof reqs === 'string') { try { reqs = JSON.parse(reqs) } catch (e) { reqs = [] } }
                                const inReqs = Array.isArray(reqs) && reqs.some(r => otherItemIds.includes(r.product_id || r.productId));
                                
                                return inTriggers || inReqs;
                            });"""
                            
    if old_promo_check_logic in content:
        content = content.replace(old_promo_check_logic, new_promo_check_logic)
        print("Replaced promo matching logic.")
    else:
        print("Could not find the old promo match logic.")

    with open(TARGET_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    
    print("Patch applied to DataReports.tsx successfully.")

if __name__ == "__main__":
    apply_patch()
