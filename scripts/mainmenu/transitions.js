"use strict";

var Transition = new class {
	/**
	 * Begins a new transition between two sets of elements.
	 * @param {Object} json { elementsFrom: Array<Panel>, elementsTo: Array<Panel>, classFromBegin: string, classFrom: string, classFromComplete: string, classToBegin: string, classTo: string, classToComplete: string, duration: Number, stagger*: Number, callback*: function }
	 */
	Begin( json ) {
		const data = {
			stagger: 0,
			callback: null,
			classFromBegin: '',
			classToBegin: '',
			classFromComplete: '',
			classToComplete: '',
			...json
		};

		data.elementsFrom.forEach( (element,element_id)=>{
			element.AddClass( data.classFromBegin );
			$.Schedule( element_id*data.stagger, ()=>{
				element.RemoveClass( data.classFromBegin );
				element.AddClass( data.classFrom );
				$.Schedule( data.duration, ()=>{
					element.RemoveClass(data.classFrom);
					if (data.classFromComplete === '') {return}
					element.AddClass(data.classFromComplete);
				});
			});
		});

		if (data.callback instanceof Function) {
			$.Schedule( (data.elementsFrom.length-1)*data.stagger + data.duration, ()=>{
				data.callback();
			});
		}

		$.Schedule((data.elementsFrom.length*data.stagger + data.duration), ()=>{
			data.elementsTo.forEach( (element,element_id)=>{
				element.AddClass( data.classToBegin );
				$.Schedule( element_id*data.stagger, ()=>{
					element.RemoveClass( data.classToBegin );
					element.AddClass( data.classTo );
					$.Schedule( data.duration, ()=>{
						element.RemoveClass(data.classTo);
						if (data.classToComplete === '') {return}
						element.AddClass(data.classToComplete);
					});
				});
			});
		});
	}

	/**
	 * Begins a new transition between two elements.
	 * @param {Object} json { elementFrom: Panel, elementTo: Panel, duration: Number, classFrom: string, classTo: string, callback*: Function }
	 */
	Simple( json ) {
		const data = {
			callback: null,
			...json
		};

		data.elementFrom.AddClass( data.classFrom );
		$.Schedule( data.duration, ()=>{
			data.elementFrom.RemoveClass( data.classFrom );
			if (data.callback !== null) {data.callback()}
			data.elementTo.AddClass( data.classTo );
			$.Schedule( data.duration, ()=>{
				data.elementTo.RemoveClass( data.classTo );
			});
		});
	}

}();