# ============================================
# SCRIPT DE DEPLOYMENT PARA EDGE FUNCTIONS
# GestionPro - Mercado Pago Subscriptions
# PowerShell Version
# ============================================

Write-Host "🚀 Desplegando Edge Functions de Supabase..." -ForegroundColor Cyan

# Verificar que Supabase CLI está instalado
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Supabase CLI no está instalado." -ForegroundColor Red
    Write-Host "Instalar con: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Desplegar función create-subscription
Write-Host "📦 Desplegando create-subscription..." -ForegroundColor Yellow
supabase functions deploy create-subscription --project-ref qeltuiqarfhymbhkdyan

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al desplegar create-subscription" -ForegroundColor Red
    exit 1
}

# Desplegar función mp-webhook
Write-Host "📦 Desplegando mp-webhook..." -ForegroundColor Yellow
supabase functions deploy mp-webhook --project-ref qeltuiqarfhymbhkdyan

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al desplegar mp-webhook" -ForegroundColor Red
    exit 1
}

# Configurar secret de MP_ACCESS_TOKEN
Write-Host "🔐 Configurando secrets..." -ForegroundColor Yellow
supabase secrets set MP_ACCESS_TOKEN=APP_USR-7836901662321194-112818-94c8abbef482daff5734ac2bb68dcd4c-3023878944 --project-ref qeltuiqarfhymbhkdyan

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Advertencia: No se pudo configurar el secret automáticamente" -ForegroundColor Yellow
    Write-Host "Configurar manualmente en: https://supabase.com/dashboard/project/qeltuiqarfhymbhkdyan/settings/secrets" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✅ Deployment completado!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos manuales:" -ForegroundColor Cyan
Write-Host "1. Configurar webhook en Mercado Pago:"
Write-Host "   URL: https://qeltuiqarfhymbhkdyan.supabase.co/functions/v1/mp-webhook" -ForegroundColor White
Write-Host "   Eventos: preapproval, subscription_preapproval" -ForegroundColor White
Write-Host ""
Write-Host "2. Ejecutar el script SQL en Supabase:"
Write-Host "   update_tenants_for_subscriptions.sql" -ForegroundColor White
Write-Host ""
Write-Host "3. Probar el flujo de suscripción en modo TEST" -ForegroundColor White
