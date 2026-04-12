!macro customInstall
  ; If old WireGuard version is installed, uninstall it first
  nsExec::ExecToLog 'cmd /c wg version 2>&1 | findstr v1.0.20210914'
  Pop $0
  StrCmp $0 "0" uninstall_old_wg skip_old_wg
  uninstall_old_wg:
    ; Stop nettica-client first so it gracefully tears down any active tunnels
    ExecWait '"$INSTDIR\extra\nettica-client.exe" stop'
    ExecWait '"$INSTDIR\extra\nettica-client.exe" remove'
    ExecWait 'MsiExec.exe /x "$INSTDIR\extra\wireguard-amd64-0.5.3.msi" /qn'
    SetRebootFlag true
  skip_old_wg:
  ExecWait 'MsiExec.exe /i "$INSTDIR\extra\wireguard-amd64-0.6.1.msi" DO_NOT_LAUNCH=1 /qn'
  ExecWait '"$INSTDIR\extra\nettica-client.exe" install'
  ExecWait '"$INSTDIR\extra\nettica-client.exe" start'
  CreateDirectory '$APPDATA\Nettica'
  CreateDirectory '$APPDATA\Nettica\WireGuard'
!macroend

!macro customUninstall
  ExecWait '"$INSTDIR\extra\nettica-client.exe" stop'
  ExecWait '"$INSTDIR\extra\nettica-client.exe" remove'
!macroend