"use strict";

// But if you close your eyes...
// import { SettingsController } from './settings.js';
// import { Transition } from './transitions.js';
// import { GAME_STATE } from './states.js';

var MenuController = new class {

	page	 	= 'main';
	pagetable	= {};
	ready		= true;

	Initialize() {
		// Apply events
		$.RegisterForUnhandledEvent('ChaosShowMainMenu', ()=>{this.OnShowMainMenu()});
		$.RegisterForUnhandledEvent('ChaosHideMainMenu', ()=>{this.OnHideMainMenu()});
		$.RegisterForUnhandledEvent('ChaosShowPauseMenu', ()=>{this.OnShowPauseMenu()});
		$.RegisterForUnhandledEvent('ChaosHidePauseMenu', ()=>{this.OnHidePauseMenu()});


		// Load settings menu.
		SettingsController.Load('file://{config}/mainmenu/settings.xml');
		SettingsController.Realize($('#settings'));

		// Initialize pagetable.
		$('#menu-root').Children().forEach( p => {
			if (p.paneltype !== 'Panel') {return}
			const page = p.GetAttributeString('data-page', '')
			if (page !== '') {this.pagetable[page] = p}
		});

		// Add sound events to buttons.
		// function PlayHoverSound() {$.PlaySoundEvent('GameUI.ButtonClickSound')}
		// function PlayClickSound() {$.PlaySoundEvent('GameUI.ButtonClickSound')}
		// $('#menu-root').FindChildrenWithClassTraverse('main-menu-button').forEach( button => {
		// 	button.SetPanelEvent( 'onmouseover', PlayHoverSound );
		// 	button.SetPanelEvent( 'onactivate',  PlayClickSound );
		// });

		// Initialize modular menu.
		this.SetMovie( 'community_bg1' );
		this.SetMenuPage( 'main' );
	}


	SetMovie( url ) {
		const movie = $("#MainMenuMovie");
		if (url === '') {
			movie.Stop();
			movie.SetMovie('');
			movie.visible = false;
		}
		else {
			movie.SetMovie("file://{media}/" + url + ".webm");
			movie.visible = true;
			movie.Play();
		}
	}


	SetMenuPaused( paused ) {
		const container = $('#MainMenuContainerPanel');
		if (paused)	{ container.AddClass('paused') }
		else		{ container.RemoveClass('paused') }
	}


	SetMenuPage( page ) {
		eval(this.pagetable[this.page].GetAttributeString('data-onleave', ''));
		eval(this.pagetable[page].GetAttributeString('data-onenter', ''));
		this.pagetable[this.page].RemoveClass('visible');
		this.pagetable[page].AddClass('visible');
		this.page = page;
	}

	AnimateMenuPage( page, downwards=false ) {
		if (!this.ready) { return }

		const classFrom	= downwards ? 'slide-right-fade-out' : 'slide-left-fade-out';
		const classTo	= downwards ? 'slide-right-fade-in' : 'slide-left-fade-in';

		this.ready = false;
		Transition.Simple({
			elementFrom: this.pagetable[this.page],
			elementTo: this.pagetable[page],
			classFrom: classFrom,
			classTo: classTo,
			duration: 0.25,

			callback: ()=>{
				this.ready = true;
				this.SetMenuPage(page);
			}
		});
	}


	Escape() {
		const target = this.pagetable[this.page].GetAttributeString('data-esc', '');
		const gamestate = GameInterfaceAPI.GetGameUIState();

		if (this.page === 'main') {
			this.MenuHidePlayMenu();
			this.MenuHideQuitMenu();
		}

		if (gamestate === GAME_STATE.PAUSEMENU && this.page === 'paused') {
			return this.MenuResume();
		}

		if (this.page === 'settings') {
			SettingsController.CancelChanges();
			if (gamestate === GAME_STATE.PAUSEMENU) { return this.AnimateMenuPage( 'paused', true ) }
		}

		if (target !== this.page && target !== '') {
			this.AnimateMenuPage( target, true );
		}
	};


	Quit() {
		GameInterfaceAPI.ConsoleCommand('quit');
	};


	SettingsCancel() {
		SettingsController.CancelChanges();
		this.AnimateMenuPage( 'main', true );
	}

	SettingsApply() {
		SettingsController.ApplyChanges();
		this.AnimateMenuPage( 'main' );
	}


	MenuResume() {
		$.DispatchEvent('ChaosMainMenuResumeGame');
	}

	MenuDisconnect() {
		GameInterfaceAPI.ConsoleCommand('disconnect');
	}

	
	submenus = {}
	MenuShowSubmenu( submenu_id, button_id ) {
		if (this.submenus[submenu_id] === true) {return}
		this.submenus[submenu_id] = true;

		const menupage	= $('#'+submenu_id);
		const button	= $('#'+button_id);

		menupage.AddClass('visible');
		button.AddClass('expanded');
		menupage.AddClass('slide-right-fade-in');
		$.Schedule( 0.25, ()=>{
			menupage.RemoveClass('slide-right-fade-in');
		});
	}

	MenuHideSubmenu( submenu_id, button_id ) {
		if (this.submenus[submenu_id] === false) {return}
		this.submenus[submenu_id] = false;

		const mainpage	= this.pagetable['main'];
		const menupage	= $('#'+submenu_id);
		const button	= $('#'+button_id);

		button.RemoveClass('expanded');
		menupage.AddClass('slide-left-fade-out');
		$.Schedule( 0.25, ()=>{
			menupage.RemoveClass('visible');
			menupage.RemoveClass('slide-left-fade-out');
		});
	}

	MenuToggleSubmenu( submenu_id, button_id ) {
		if (!this.ready) {return}

		if ( !(submenu_id in this.submenus) )
			this.submenus[submenu_id] = false;

		if (!this.submenus[submenu_id])
			this.MenuShowSubmenu(submenu_id, button_id);
		else
			this.MenuHideSubmenu(submenu_id, button_id);
	}


	// It's modular *enough*
	MenuTogglePlayMenu() {if (!this.ready) {return}; this.MenuHideQuitMenu(); this.MenuToggleSubmenu( 'play-container', 'play-button' )}
	MenuHidePlayMenu() {this.MenuHideSubmenu( 'play-container', 'play-button' )}
	MenuToggleQuitMenu() {if (!this.ready) {return}; this.MenuHidePlayMenu(); this.MenuToggleSubmenu( 'quit-container', 'quit-button' )}
	MenuHideQuitMenu() {this.MenuHideSubmenu( 'quit-container', 'quit-button' )}

	// If this gets too absurd, I'll make a function to do it automatically.
	MenuHideHomeSubmenus() {this.MenuHidePlayMenu(); this.MenuHideQuitMenu()}


	OnShowMainMenu() {
		this.SetMenuPaused( false );
		this.SetMenuPage( 'main' );
		// This is broken because the engine randomly deletes the movie element.
		// Of course it does. Why wouldn't it? Amazing.
		// this.SetMovie( 'community_bg1' );
	}

	OnHideMainMenu() {
		this.SetMenuPaused( false );
		// this.SetMovie( '' );
	}

	OnShowPauseMenu() {
		this.SetMenuPaused( true );
		this.SetMenuPage( 'paused' );
	}

	OnHidePauseMenu() {
		this.SetMenuPaused( true );
	}
	
}();

$.Schedule(0.0, ()=>{MenuController.Initialize()});