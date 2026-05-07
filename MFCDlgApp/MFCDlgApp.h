// MFCDlgApp.h : главный файл заголовка для приложения PROJECT_NAME
//

#pragma once

#ifndef __AFXWIN_H__
	#error "include 'pch.h' before including this file for PCH"
#endif

#include "resource.h"		// основные символы


// CMFCDlgAppApp:
// См. MFCDlgApp.cpp для реализации этого класса
//

class CMFCDlgAppApp : public CWinApp
{
public:
	CMFCDlgAppApp();

// Переопрежение
public:
	virtual BOOL InitInstance();

// Реализация

	DECLARE_MESSAGE_MAP()
};

extern CMFCDlgAppApp theApp;
