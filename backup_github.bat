@echo off
echo [*] Sincronizando backup do projeto NeonZenithTowerofLight no GitHub...
git add .
git commit -m "auto: backup sincronizado Neon Zenith: Tower of Light v1.0"
git branch -M main
git push -u origin main
echo [OK] Backup concluido com sucesso!
