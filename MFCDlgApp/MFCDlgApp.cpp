// MFCDlgApp.cpp : реализует логику приложения.
//

#include "pch.h"
#include "framework.h"
#include "MFCDlgApp.h"
#include "MFCDlgAppDlg.h"

#ifdef _DEBUG
#define new DEBUG_NEW
#endif


// CMFCDlgAppApp

BEGIN_MESSAGE_MAP(CMFCDlgAppApp, CWinApp)
	ON_COMMAND(ID_HELP, &CWinApp::OnHelp)
END_MESSAGE_MAP()


// Создание CMFCDlgAppApp

CMFCDlgAppApp::CMFCDlgAppApp()
{
	// поддержка перезагрузки менеджера размещения
	m_dwRestartManagerSupportFlags = AFX_RESTART_MANAGER_SUPPORT_RESTART;

	// TODO: добавьте код создания,
	// Размещает весь важный код инициализации в InitInstance
}


// Единственный объект CMFCDlgAppApp

CMFCDlgAppApp theApp;


// Инициализация CMFCDlgAppApp

BOOL CMFCDlgAppApp::InitInstance()
{
	// InitCommonControlsEx() требуется для Windows XP, если манифест приложения
	// использует ComCtl32.dll версии 6 или более поздней для включения
	// стилей отображения.  В противном случае создание любого окна будет завершаться неудачей.
	INITCOMMONCONTROLSEX InitCtrls;
	InitCtrls.dwSize = sizeof(InitCtrls);
	// Выберите этот параметр для включения всех общих классов управления, которые вы хотите
	// использовать в своем приложении.
	InitCtrls.dwICC = ICC_WIN95_CLASSES;
	InitCommonControlsEx(&InitCtrls);

	CWinApp::InitInstance();


	AfxEnableControlContainer();

	// Стандартная инициализация
	// Если эти возможности не используются и необходимо уменьшить размер
	// итогового исполняемого файла, следует удалить из следующих
	// конкретных подпрограмм инициализации, которые не требуются
	// Измените раздел реестра, в котором хранятся параметры
	// TODO: следует изменить эту строку на что-нибудь подходящее, например на название вашей организации
	SetRegistryKey(_T("Локальные приложения, созданные с помощью мастера приложений"));


	CMFCDlgAppDlg dlg;
	m_pMainWnd = &dlg;
	INT_PTR nResponse = dlg.DoModal();
	if (nResponse == IDOK)
	{
		// TODO: введите здесь код обработки закрытия диалогового окна
		//  с помощью кнопки "ОК"
	}
	else if (nResponse == IDCANCEL)
	{
		// TODO: введите здесь код обработки закрытия диалогового окна
		//  с помощью кнопки "Отмена"
	}
	else if (nResponse == -1)
	{
		TRACE(traceAppMsg, 0, "Предупреждение. Не удалось создать диалоговое окно, поэтому приложение неожиданно завершает работу.\n");
		TRACE(traceAppMsg, 0, "Предупреждение. При использовании элементов управления MFC в диалоговом окне невозможно #define _AFX_NO_MFC_CONTROLS_IN_DIALOGS.\n");
	}

	// Удалить объект оболочки, созданный выше.
#if !defined(_AFXDLL) && !defined(_AFX_NO_MFC_CONTROLS_IN_DIALOGS)
	delete m_pShellManager;
#endif

	// Поскольку диалоговое окно закрыто, возвратим значение FALSE, чтобы выйти из
	//  приложения вместо запуска генератора сообщений приложения.
	return FALSE;
}
