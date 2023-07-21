!macro customInstall
  ExecWait '"$INSTDIR\extra\nettica-client.exe" install'
  ExecWait '"$INSTDIR\extra\nettica-client.exe" start'
  CreateDirectory '$APPDATA\Nettica'
  CreateDirectory '$APPDATA\Nettica\WireGuard'
!macroend

!macro customUninstall
  ExecWait '"$INSTDIR\extra\nettica-client.exe" stop'
  ExecWait '"$INSTDIR\extra\nettica-client.exe" remove'
!macroend