var SettingsController = new class {

	/** @type {Object} */
	categories;
	/** @type {Panel} */
	root;
	/** @type {Number} */
	page;
	/** @type {Object} */
	staged = {};



	/**
	 * Loads settings from a layout file.
	 * @param {string} filepath 
	 * @returns The generated dictionary.
	 */
	Load( filepath ) {

		const categories = [];
		function _treatCvars( cvars ) { return cvars.split(',').map(x => x.trim()); }

		const layout = $.CreatePanel( 'Panel', $.GetContextPanel(), { visible: false } );
		layout.LoadLayout( filepath, true, false );

		layout.Children().forEach(layout_category => {
			const category = {
				name:			layout_category.GetAttributeString( 'name', '' ),
				settings:		[]
			};

			layout_category.Children().forEach(layout_setting => {
				const setting = {
					name:		layout_setting.GetAttributeString( 'name', '' ),
					type:		layout_setting.GetAttributeString( 'type',    '' ),
					cvars:		_treatCvars(layout_setting.GetAttributeString( 'cvars', '' )),
					choices:	[]
				}

				layout_setting.Children().forEach(layout_choice => {
					const choice = {
						display:	layout_choice.GetAttributeString( 'display', '' ),
						cvars:		_treatCvars(layout_choice.GetAttributeString( 'cvars', '' ))
					}

					if (choice.cvars.length !== setting.cvars.length) { return $.Msg( `Choice ${choice.name} of setting ${setting.name} has inequal cvar entry count! Skipping.` )}
					setting.choices.push( choice );
				});

				category.settings.push( setting );
			});

			categories.push( category );
		});

		this.categories = categories;
		return categories;
	};

	/**
	 * Sets up a menu structure underneath the specified element.
	 * @param {Panel} root
	 */
	Realize( root ) {

		this.root = root;
		const header = $.CreatePanel( 'Panel', root, 'settings-head',   {} );
		const body   = $.CreatePanel( 'Panel', root, 'settings-body',   {} );

		this.categories.forEach((category, category_id) => {
			const c_header_label    = $.CreatePanel( 'Label', header, 'settings-head-'+category_id, { text: category.name } );
			const c_body_layout     = $.CreatePanel( 'Panel', body,   'settings-body-'+category_id, {} );

			c_header_label.SetPanelEvent( 'onactivate', ()=>{this.SetPage(category_id)} );
			
			category.settings.forEach((setting, setting_id) => {

				if (setting.type === 'options') {
					const s_layout      = $.CreatePanel( 'Panel',      c_body_layout, '', { class: 'setting-row'                                         } );
					const s_name_label  = $.CreatePanel( 'Label',      s_layout,      '', { class: 'setting-row-title', text: setting.name               } );
					const s_value_input = $.CreatePanel( 'TextButton', s_layout,      '', { class: 'setting-row-value', text: setting.choices[0].display } );
					s_layout.AddClass( 'setting-type-options' );
					
					let value_index = 0;
					s_value_input.SetPanelEvent( 'onactivate', ()=>{
						value_index += 1;
						if (value_index >= setting.choices.length) {value_index = 0}
						s_value_input.text = this.SetMenuChoice( category_id, setting_id, value_index );
					});
				}

				else if (setting.type === 'slider') {
					const s_layout      = $.CreatePanel( 'Panel',      c_body_layout, '', { class: 'setting-row'                                         } );
					const s_name_label  = $.CreatePanel( 'Label',      s_layout,      '', { class: 'setting-row-title', text: setting.name               } );
					const s_value_input = $.CreatePanel( 'Slider',     s_layout,      '', { class: 'setting-row-value', min: 0, max: 1, increment: 0.01, direction: 'horizontal'  } );
					s_layout.AddClass( 'setting-type-slider' );
				}

				else if (setting.type === 'label') {
					const s_layout      = $.CreatePanel( 'Panel',      c_body_layout, '', { class: 'setting-row'                                         } );
					const s_name_label  = $.CreatePanel( 'Label',      s_layout,      '', { class: 'setting-row-title', text: setting.name               } );
					s_layout.AddClass( 'setting-type-label' );
				}
			
			});

		});

		this.SetPage(0);
		this.ReadToMenu();
		return;
	};

	ApplyChanges() {
		for (let cvar in this.staged) {
			$.Msg(`Setting ${cvar} to ${this.staged[cvar]}`);
			// GameInterfaceAPI.SetSettingString( cvar, this.staged[cvar] );
		}
		this.staged = {};
		return;
	}

	CancelChanges() {
		this.staged = {};
		this.ReadToMenu();
		return;
	}

	/**
	 * Reads the game cvars and attempts to set the menu options accordingly.
	 * @private
	 */
	ReadToMenu() {
		this.root.FindChild( 'settings-body' ).Children().forEach((category_panel, category_id)=>{
			category_panel.Children().forEach((setting_panel, setting_id)=>{
				
				const setting = this.categories[category_id].settings[setting_id];
				if (setting.type === 'label') {return}

				if (setting.type === 'options') {
					const choice_id = this.GetMenuChoice(category_id,setting_id);
					setting_panel.GetLastChild().text = setting.choices[choice_id].display;
				}
				else if (setting.type === 'slider') {
					setting_panel.GetLastChild().value = 0 // This is gonna require some math to inverse-lerp the cvar's value between the two boundaries. Will do later.
				}
			});
		});
	}

	/**
	 * Sets the current page.
	 * @private
	 * @param {Number} page_id 
	 */
	SetPage( page_id ) {
		if ( page_id < 0 || page_id >= this.categories.length ) { return $.Msg( `Ignoring invalid SetPage request for page ${page_id}.` ); }
		if ( this.page !== undefined ) {
			this.root.FindChildTraverse( 'settings-head-'+this.page ).RemoveClass( 'active' );
			this.root.FindChildTraverse( 'settings-body-'+this.page ).RemoveClass( 'active' );
		}
		this.root.FindChildTraverse( 'settings-head-'+page_id ).AddClass( 'active' );
		this.root.FindChildTraverse( 'settings-body-'+page_id ).AddClass( 'active' );
		this.page = page_id;
	}

	/**
	 * Update a menu choice by index and return the new value as a string.
	 * @param {Number} category_id 
	 * @param {Number} setting_id 
	 * @param {Number} choice_id 
	 * @returns The new value as a string.
	 */
	SetMenuChoice( category_id, setting_id, choice_id ) {
		const category = this.categories[ category_id ];
		const setting  = category.settings[ setting_id ];
		const choice   = setting.choices[ choice_id ];

		setting.cvars.forEach((cvar,cvar_id)=>{
			this.staged[cvar] = choice.cvars[cvar_id];
		});

		return choice.display;
	}

	/**
	 * Attempt to get the current menu option
	 * @param {Number} category_id 
	 * @param {Number} setting_id
	 * @param {Number} fallback A fallback index to return if no options match.
	 * @returns The first matching option
	 */
	GetMenuChoice( category_id, setting_id, fallback=0 ) {
		const category = this.categories[ category_id ];
		const setting  = category.settings[ setting_id ];
		
		const current_vars = setting.cvars.map( cvar => GameInterfaceAPI.GetSettingString(cvar) );
		const remapped_choices = setting.choices.map( (choice, choice_id) => {return {id: choice_id, cvars: choice.cvars}} );
		const matches = remapped_choices.filter( choice => {
			for (let v in choice.cvars) { if (choice.cvars[v] !== current_vars[v]) {return false} };
			return true;
		});

		if (!matches.length) {return fallback}
		return matches[0].id
	}

}();