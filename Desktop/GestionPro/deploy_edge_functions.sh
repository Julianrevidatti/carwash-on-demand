#!/bin/bash

# ============================================
# SCRIPT DE DEPLOYMENT PARA EDGE FUNCTIONS
# GestionPro - Mercado Pago Subscriptions
# ============================================

echo "🚀 Desplegando Edge Functions de Supabase..."

# Verificar que Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI no está instalado."
    echo "Instalar con: npm install -g supabase"
    exit 1
fi

# Desplegar función create-subscription
echo "📦 Desplegando create-subscription..."
supabase functions deploy create-subscription --project-ref qeltuiqarfhymbhkdyan

if [ $? -ne 0 ]; then
    echo "❌ Error al desplegar create-subscription"
    exit 1
fi

# Desplegar función mp-webhook
echo "📦 Desplegando mp-webhook..."
supabase functions deploy mp-webhook --project-ref qeltuiqarfhymbhkdyan

if [ $? -ne 0 ]; then
    echo "❌ Error al desplegar mp-webhook"
    exit 1
fi

# Configurar secret de MP_ACCESS_TOKEN
echo "🔐 Configurando secrets..."
supabase secrets set MP_ACCESS_TOKEN=APP_USR-7836901662321194-112818-94c8abbef482daff5734ac2bb68dcd4c-3023878944 --project-ref qeltuiqarfhymbhkdyan

if [ $? -ne 0 ]; then
    echo "⚠️  Advertencia: No se pudo configurar el secret automáticamente"
    echo "Configurar manualmente en: https://supabase.com/dashboard/project/qeltuiqarfhymbhkdyan/settings/secrets"
fi

echo ""
echo "✅ Deployment completado!"
echo ""
echo "📝 Próximos pasos manuales:"
echo "1. Configurar webhook en Mercado Pago:"
echo "   URL: https://qeltuiqarfhymbhkdyan.supabase.co/functions/v1/mp-webhook"
echo "   Eventos: preapproval, subscription_preapproval"
echo ""
echo "2. Ejecutar el script SQL en Supabase:"
echo "   update_tenants_for_subscriptions.sql"
echo ""
echo "3. Probar el flujo de suscripción en modo TEST"
