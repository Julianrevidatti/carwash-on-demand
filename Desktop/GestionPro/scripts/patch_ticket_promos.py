"""
Patch DataReports.tsx:
1. Update TicketModal signature to accept promotions
2. Add promo name identification in the discount section
3. Pass promotions to TicketModal from parent
"""

filepath = r'c:\Users\54112\Desktop\GestionPro\components\DataReports.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace TicketModal signature to accept promotions
old_sig = 'const TicketModal = ({ sale, onClose }: { sale: Sale; onClose: () => void }) => {'
new_sig = 'const TicketModal = ({ sale, onClose, promotions = [] }: { sale: Sale; onClose: () => void; promotions?: Promotion[] }) => {'
content = content.replace(old_sig, new_sig)

# 2. Replace the generic "Descuento / Promo" line with promo identification
old_discount = """                  {finalDiscount > 0 && (
                     <div className="flex justify-between text-sm text-green-600">
                        <span>Descuento / Promo</span>
                        <span>-${finalDiscount.toLocaleString()}</span>
                     </div>
                  )}"""

new_discount = """                  {finalDiscount > 0 && (() => {
                     // Identify which promos matched this sale's items
                     const saleItemIds = sale.items.map(i => i.id);
                     const matchedPromos = promotions.filter(p => 
                        p.triggerProductIds.every(pid => saleItemIds.includes(pid))
                     );
                     return (
                        <div className="space-y-1">
                           {matchedPromos.length > 0 ? (
                              matchedPromos.map(p => (
                                 <div key={p.id} className="flex justify-between text-sm text-green-600">
                                    <span className="flex items-center gap-1">
                                       <span className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded">PROMO</span>
                                       {p.name}
                                    </span>
                                 </div>
                              ))
                           ) : (
                              <div className="flex justify-between text-sm text-green-600">
                                 <span>Descuento</span>
                              </div>
                           )}
                           <div className="flex justify-between text-sm text-green-600 font-bold">
                              <span>Total Descuento</span>
                              <span>-${finalDiscount.toLocaleString()}</span>
                           </div>
                        </div>
                     );
                  })()}"""

content = content.replace(old_discount, new_discount)

# 3. Pass promotions to TicketModal from parent
old_call = '<TicketModal sale={selectedSale} onClose={() => setSelectedSale(null)} />'
new_call = '<TicketModal sale={selectedSale} onClose={() => setSelectedSale(null)} promotions={promotions} />'
content = content.replace(old_call, new_call)

with open(filepath, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

# Verify changes
checks = [
    ('TicketModal signature', 'promotions?: Promotion[]' in content),
    ('Promo identification', 'matchedPromos' in content),
    ('Pass promotions prop', 'promotions={promotions}' in content),
]

for name, ok in checks:
    print(f"{'OK' if ok else 'FAIL'}: {name}")
