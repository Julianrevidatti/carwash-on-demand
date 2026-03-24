// Print service - bridges frontend to Electron printer API

import { Sale } from '../types';
import { generateReceiptHtml } from './receiptGenerator';

declare global {
    interface Window {
        electronAPI?: any;
    }
}

interface PrinterInfo {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
}

let cachedPrinters: PrinterInfo[] = [];
let selectedPrinter: string | null = null;
let paperWidth: '58mm' | '80mm' = '80mm';
let autoPrint: boolean = false;

export const printService = {
    // Get available printers
    getPrinters: async (): Promise<PrinterInfo[]> => {
        if (typeof window === 'undefined' || !window.electronAPI?.printer) return [];
        try {
            cachedPrinters = await window.electronAPI.printer.getPrinters();
            return cachedPrinters;
        } catch (e) {
            console.error('Error getting printers:', e);
            return [];
        }
    },

    // Set preferred printer
    setSelectedPrinter: (name: string | null) => {
        selectedPrinter = name;
        try { localStorage.setItem('stockpro_printer', name || ''); } catch { }
    },

    // Get selected printer
    getSelectedPrinter: (): string | null => {
        if (!selectedPrinter) {
            try { selectedPrinter = localStorage.getItem('stockpro_printer') || null; } catch { }
        }
        return selectedPrinter;
    },

    // Set paper width
    setPaperWidth: (width: '58mm' | '80mm') => {
        paperWidth = width;
        try { localStorage.setItem('stockpro_paper_width', width); } catch { }
    },

    // Get paper width
    getPaperWidth: (): '58mm' | '80mm' => {
        try {
            const saved = localStorage.getItem('stockpro_paper_width');
            if (saved === '58mm' || saved === '80mm') paperWidth = saved;
        } catch { }
        return paperWidth;
    },

    // Set auto-print mode
    setAutoPrint: (enabled: boolean) => {
        autoPrint = enabled;
        try { localStorage.setItem('stockpro_autoprint', enabled ? '1' : '0'); } catch { }
    },

    // Get auto-print mode
    getAutoPrint: (): boolean => {
        try {
            const saved = localStorage.getItem('stockpro_autoprint');
            if (saved !== null) autoPrint = saved === '1';
        } catch { }
        return autoPrint;
    },

    // Print a sale receipt
    printReceipt: async (sale: Sale, businessName: string, businessAddress?: string, businessPhone?: string): Promise<boolean> => {
        if (typeof window === 'undefined' || !window.electronAPI?.printer) {
            console.warn('Printer API not available');
            return false;
        }

        const html = generateReceiptHtml({
            sale,
            businessName: businessName || 'Mi Negocio',
            businessAddress,
            businessPhone,
            paperWidth: printService.getPaperWidth()
        });

        const printer = printService.getSelectedPrinter() || undefined;

        try {
            const result = await window.electronAPI.printer.print(html, printer);
            return result?.success || false;
        } catch (e) {
            console.error('Print error:', e);
            return false;
        }
    }
};
