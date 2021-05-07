const { ipcRenderer } = require('electron')
const Store = require('electron-store')
const clinixstorage = new Store();
let $ = jQuery = require('jquery');


const init = () => {
   
	if(process.platform == 'win32'){
		$("body").addClass('windows')
	}
	else{
		$("body").addClass('macos')		
	}

	window.addEventListener('blur', function(){
		$("body").addClass("focusout");
	})
	window.addEventListener('focus', function(){
		$("body").removeClass("focusout");
	})
	window.addEventListener('online', networkStatusChange)
	window.addEventListener('offline', networkStatusChange)

	// maximize, minimize, close control buttons
	$(".btn-win-close").on("click", function(e){
		holdClinica();
		leaveSession();
		ipcRenderer.invoke('control-buttons:close');
		
	})
	$(".btn-win-mini").on("click", function(e){
		ipcRenderer.invoke('control-buttons:minimize')
	})
	$(".btn-win-maxi").on("click", function(e){
		ipcRenderer.invoke('control-buttons:toggle')
	})
	document.getElementById('maximize-bar').addEventListener('dblclick', () => {
		ipcRenderer.invoke('control-buttons:toggle')
	})

}

// funciones de la ventana
function networkStatusChange(){
	if(navigator.onLine){
		$("#div-offline").fadeOut(400);
	}
	else{
		$("#div-offline").fadeIn(400);
		holdClinica();
	}
}

/**** Specific JS for this page ****/
$(function() {
	/* initialize the external events
	-----------------------------------------------------------------*/
 	// Datepicker
 	var myDate = new Date();
	
	$('#external-events div.external-event').each(function() {
		// create an Event Object (http://arshaw.com/fullcalendar/docs/event_data/Event_Object/)
		// it doesn't need to have a start or end
		var eventObject = {
			title: $.trim($(this).text()) // use the element's text as the event title
		};
		// store the Event Object in the DOM element so we can get to it later
		$(this).data('eventObject', eventObject);
		// make the event draggable using jQuery UI
		$(this).draggable({
		zIndex: 999,
		revert: true,      // will cause the event to go back to its
		revertDuration: 0  //  original position after the drag
		});
	});
	var date = new Date();
	var d = date.getDate();
	var m = date.getMonth();
	var y = date.getFullYear();
	var calendar = $('#calendar').fullCalendar({
		header: {
			left: 'anterior,siguiente hoy',
			center: 'title',
			right: 'Mes,Semana,Dia'
		},
		selectable: true,
		selectHelper: true,
		select: function(start, end, allDay) {
			var title = prompt('Event Title:');
			if (title) {
			calendar.fullCalendar('renderEvent',
				{
				title: title,
				start: start,
				end: end,
				allDay: allDay
				},
				true // make the event "stick"
				);
			}
			calendar.fullCalendar('unselect');
		},
		editable: true,
		droppable:true,
		drop: function(date, allDay) { // this function is called when something is dropped
			// retrieve the dropped element's stored Event Object
			var originalEventObject = $(this).data('eventObject');
			// we need to copy it, so that multiple events don't have a reference to the same object
			var copiedEventObject = $.extend({}, originalEventObject);
			// assign it the date that was reported
			copiedEventObject.start = date;
			copiedEventObject.allDay = allDay;
			// render the event on the calendar
			// the last `true` argument determines if the event "sticks" (http://arshaw.com/fullcalendar/docs/event_rendering/renderEvent/)
			$('#calendar').fullCalendar('renderEvent', copiedEventObject, true);
			// is the "remove after drop" checkbox checked?
			
			// if so, remove the element from the "Draggable Events" list
			//$(this).remove();
		},
		events: [
			{
				title: 'All Day Event',
				start: new Date(y, m, 1)
			},
			{
				title: 'Long Event',
				start: new Date(y, m, d+5),
				end: new Date(y, m, d+7)
			},
			{
				id: 999,
				title: 'Repeating Event',
				start: new Date(y, m, d-3, 16, 0),
				allDay: false
			},
			{
				id: 999,
				title: 'Repeating Event',
				start: new Date(y, m, d+4, 16, 0),
				allDay: false
			},
			{
				title: 'Meeting',
				start: new Date(y, m, d, 10, 30),
				allDay: false
			},
			{
				title: 'Lunch',
				start: new Date(y, m, d, 12, 0),
				end: new Date(y, m, d, 14, 0),
				allDay: false
			},
			{
				title: 'Birthday Party',
				start: new Date(y, m, d+1, 19, 0),
				end: new Date(y, m, d+1, 22, 30),
				allDay: false
			},
			{
				title: 'Click for PixelGrade',
				start: new Date(y, m, 28),
				end: new Date(y, m, 29),
				url: '../../../pixelgrade.com/default.htm'
			}
		]
	});
});

// funcion para manejo de errores
function errorCallback(e) {
	console.log('Error:', e)
}

init();