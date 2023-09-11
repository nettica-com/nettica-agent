!macro customInstall
  ExecWait 'MsiExec.exe /i "$INSTDIR\extra\wireguard-amd64-0.5.3.msi" DO_NOT_LAUNCH=1 /qn'
  ExecWait '"$INSTDIR\extra\nettica-client.exe" install'
  ExecWait '"$INSTDIR\extra\nettica-client.exe" start'
  CreateDirectory '$APPDATA\Nettica'
  CreateDirectory '$APPDATA\Nettica\WireGuard'
!macroend

!macro customUninstall
  ExecWait '"$INSTDIR\extra\nettica-client.exe" stop'
  ExecWait '"$INSTDIR\extra\nettica-client.exe" remove'
!macroend