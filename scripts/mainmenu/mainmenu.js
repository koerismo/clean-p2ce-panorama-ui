"use strict";

// But if you close your eyes...
// import { SettingsController } from './settings.js';
// import { Transition } from './transitions.js';
// import { GAME_STATE } from './states.js';

var MenuController = new class {

	paused		= false;
	page	 	= 'main';
	pagetable	= {};
	ready		= true;

	Initialize() {
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
		if (!url) {
			movie.Stop();
			movie.SetMovie('');
			movie.visible = false;
			movie.SetReadyForDisplay( false );
		}
		else {
			movie.SetMovie("file://{media}/" + url + ".webm");
			movie.SetReadyForDisplay( true );
			movie.visible = true;
			movie.Play();
		}
	}


	SetMenuPaused( paused ) {
		this.paused = paused;
		const container = $('#MainMenuContainerPanel');
		if (paused)	{ container.AddClass('paused') }
		else		{ container.RemoveClass('paused') }
	}


	SetMenuPage( page, downwards=false ) {
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
				this.pagetable[this.page].RemoveClass('visible');
				this.pagetable[page].AddClass('visible');
				this.page = page;
			}
		});
	}


	Escape() {
		const target = this.pagetable[this.page].GetAttributeString('data-esc', '');
		if (target !== this.page && target !== '') {
			this.SetMenuPage( target, true );
		}
	};


	Quit() {
		GameInterfaceAPI.ConsoleCommand('quit');
	};

	SettingsCancel() {
		SettingsController.CancelChanges();
		this.SetMenuPage( 'main', true );
	}

	SettingsApply() {
		SettingsController.ApplyChanges();
		this.SetMenuPage( 'main' );
	}
	
}();

$.Schedule(0.1, ()=>{MenuController.Initialize()});